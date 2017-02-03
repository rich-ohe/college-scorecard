/* jshint esnext: true, maxlen: 120, noyield: true */
/* global browser */

var assert = require('assert');
var utils = require('./utils');

describe('compare', function() {

  it('should navigate to compare page from search results accordion link and display selected schools', function*() {

    yield utils.runSearch();
    yield utils.getVisibleResults();

    var schoolOne = '.school.results-card:nth-child(1) .button-compare_schools';
    var compareOne = '.schools-compare_selected-list .selected-school-info:first-child h1';

    var schoolTwo = '.school.results-card:nth-child(2) .button-compare_schools';
    var compareTwo = '.schools-compare_selected-list .selected-school-info:nth-child(2) h1';

    var schoolOneName = yield browser
        .getAttribute(schoolOne, 'data-school-name');

    var schoolTwoName = yield browser
        .getAttribute(schoolTwo, 'data-school-name');

    yield browser
      .click(schoolOne);

    yield browser
      .click(schoolTwo);

    yield browser
      .click('#compare_schools-edit');

    yield browser
      .click('#compare-link');

    yield utils.getVisibleCompare();

    var compareOneName = yield browser
      .element(compareOne)
      .getText();

    var compareTwoName = yield browser
      .element(compareTwo)
      .getText();

    assert(schoolOneName, compareOneName);
    assert(schoolTwoName, compareTwoName);

  });

});