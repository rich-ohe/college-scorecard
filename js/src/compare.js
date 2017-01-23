var tagalong = require('tagalong');
var d3 = require('d3');

module.exports = function compare() {

  var loadable = d3.select('.loadable');

  var compareSchools = picc.school.compare.all();

  if (!compareSchools.length) {
    loadable.classed('js-error', true);
    return showError(picc.errors.NO_SCHOOLS_TO_COMPARE);
  }

  var fotw = ( window.sessionStorage.getItem('passback_id') !== "");

  loadable.classed('js-loading', true);

  var params = {},
      query = {};

  params.fields = [
    // we need the id to link it
    picc.fields.ID,
    // basic display fields
    picc.fields.NAME,
    picc.fields.CITY,
    picc.fields.STATE,
    picc.fields.SIZE,
    // to get "public" or "private"
    picc.fields.OWNERSHIP,
    // to get the "four_year" or "lt_four_year" bit
    picc.fields.PREDOMINANT_DEGREE,
    // get all of the net price values
    picc.fields.NET_PRICE,
    // completion rate
    picc.fields.COMPLETION_RATE,
    // this has no sub-fields
    picc.fields.MEDIAN_EARNINGS,
    // not sure if we need this, but let's get it anyway
    picc.fields.EARNINGS_GT_25K,
    // under investigation flag
    picc.fields.UNDER_INVESTIGATION
  ].join(',');

  compareSchools.map(function(id) {
    query[id] = [picc.API.getSchool, id, params];
  });

  var headingDirectives = picc.data.selectKeys(picc.school.directives, [
    'title',
    'school_link',
    'name',
    'city',
    'state',
    'compare_school',
    'under_investigation',
    'size_number',
  ]);

  var costMeterDirectives = picc.data.selectKeys(picc.school.directives, [
    'average_cost',
    'average_cost_meter'
  ]);

  var gradMeterDirectives = picc.data.selectKeys(picc.school.directives, [
    'grad_rate',
    'grad_rate_meter'
  ]);

  var earningsMeterDirectives = picc.data.selectKeys(picc.school.directives, [
    'average_salary',
    'average_salary_meter'
  ]);

  picc.API.getAll(query, function(error, data) {
    if (error) {
      console.log('getAll error:', error);
    }
    console.log('getAll schools:', data);

    var results = {};
    results.results = [];

    Object.keys(data).forEach(function(key) {
      results.results.push(data[key]);
    });

    var resultsList = document.querySelector('.selected-school_heading');
    var costMeter = document.querySelector('.selected-school_average-cost');
    var gradMeter = document.querySelector('.selected-school_grad-rate');
    var earningsMeter = document.querySelector('.selected-school_salary-earnings');


    tagalong(resultsList, results.results, headingDirectives);
    tagalong(costMeter, results.results, costMeterDirectives);
    tagalong(gradMeter, results.results, gradMeterDirectives);
    tagalong(earningsMeter, results.results, earningsMeterDirectives);


  });

};