var tagalong = require('tagalong');
var d3 = require('d3');
var querystring = require('querystring');

module.exports = function compare() {

  var loadable = d3.select('.loadable');
  var compareRoot = document.querySelector('.compare-schools');

  // if schools were shared by querystring, compare those instead of any local school picks
  var qs = querystring.parse(location.search.substr(1));
  var compareSchools = (qs['schools[]']) ? qs['schools[]'] : picc.school.selection.all('compare');

  var backTo = (document.referrer.indexOf('/fotw') >= 0) ? '../search/' : document.referrer;
  d3.select('#referrer-link')
    .attr('href', backTo || null);

  var showError = function (error) {
    console.error('error:', error);
    var message = compareRoot.querySelector('.error-message');
    if (typeof error.responseText != "undefined") {
      var errorText = JSON.parse(error.responseText);
      error = errorText.errors[0].message;
    }

    message.textContent = String(error) || 'There was an unexpected API error.';
  };

  if (!compareSchools.length) {
    loadable.classed('js-error', true);
    return showError(picc.errors.NO_SCHOOLS_TO_COMPARE);
  }

  loadable.classed('js-loading', true);

  var params = {},
    query = {};

  params.fields = [
    // we need the id to link it
    picc.fields.ID,
    // fotw fields
    picc.fields.OPEID8,
    picc.fields.MAIN,
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

  var headingDirectives = picc.data.selectKeys(picc.school.directives, [
    'title',
    'school_link',
    'name',
    'city',
    'state',
    'selected_school',
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

  // build query for API call
  compareSchools.map(function (school) {
    var id = +school.schoolId || +school;
    query[id] = [picc.API.getSchool, id, params];
  });

  picc.API.getAll(query, function (error, data) {

    loadable.classed('js-loading', false);

    if (error) {
      console.error('getAll error:', error);
    }

    console.info('got schools:', data);

    var school = {};
    school.results = [];

    Object.keys(data).forEach(function (key) {
      if (data[key]) {
        school.results.push(data[key]);
      }
    });

    if (!school.results.length) {
      loadable.classed('js-error', true);
      return showError(picc.errors.NO_SUCH_SCHOOL);
    }

    loadable.classed('js-loaded', true);

    // show the fotw integration controls
    var fotw = window.sessionStorage.getItem('passback_id');

    if (fotw) {
      // add additional fotw directives to the school headings
      headingDirectives['fotw_school'] = picc.data.selectKeys(picc.school.directives, [
        'selected_school'
      ]).selected_school;

      headingDirectives.fotw_school['@data-fotw'] = function(d) {
        return picc.access(picc.fields.OPEID8)(d) + ":" + picc.access(picc.fields.MAIN)(d);
      };


      function setFOTWCount() {
        d3.select('.fotw-count').text(picc.school.selection.all('fotw').length);
      }

      var fotwSections = d3.selectAll('.fotw-wrapper')[0];
      fotwSections.forEach(function (section) {
        section = d3.select(section);
        section.attr('data-fotw', true);
      });

      var fotwLink = d3.select('.fotw-link');
      fotwLink.attr('href', '/fotw/schools/');

      setFOTWCount();
      /**
       * add event listeners for school selection click events
       */
      picc.ready(function () {
        var ariaPressed = 'aria-pressed';
        picc.delegate(
          document.body,
          // if the element matches '[aria-pressed]'
          function () {
            return this.parentElement.hasAttribute(ariaPressed) ||
              this.hasAttribute(ariaPressed);
          },
          {
            click: setFOTWCount
          }
        );

      });
    }

    var headingList = document.querySelector('.selected-school_heading');
    var costMeter = document.querySelector('.selected-school_average-cost');
    var gradMeter = document.querySelector('.selected-school_grad-rate');
    var earningsMeter = document.querySelector('.selected-school_salary-earnings');

    tagalong(headingList, school.results, headingDirectives);
    tagalong(costMeter, school.results, costMeterDirectives);
    tagalong(gradMeter, school.results, gradMeterDirectives);
    tagalong(earningsMeter, school.results, earningsMeterDirectives);

  });

};