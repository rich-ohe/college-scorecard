/* jshint esnext: true */
/* global exports, browser */
var _this = this;

exports.getVisibleCompare = function*() {
  return yield browser
    .waitForExist(
      '.schools-compare_selected-list .selected-school-info h1'
    )
    .waitUntil(function() {
      return this.getText(
        '.schools-compare_selected-list .selected-school-info:first-child h1')
        .then(function(text) {
          return text !== "School Name" && text !== "";
        });
    });
};

exports.getVisibleResults = function*() {
 return yield browser
    .waitForExist(
      '.results-main-alert .u-group_inline-left h1 span:first-child'
    )
    .waitUntil(function() {
      return this.getText(
        '.results-main-alert .u-group_inline-left h1 span:last-child')
        .then(function(text) {
          return text === 'Results' || text === 'Result';
        });
    });
};

exports.getSearchCount = function*() {
  yield _this.getVisibleResults();
  var value = yield browser.getText('.results-main-alert .u-group_inline-left h1 span:first-child');
  return parseInt(value.replace(/,/g, ''), 10);
};

exports.runSearch = function*(ops, argument) {
  yield browser
    .url('/');
  if (typeof ops === 'function') {
    yield ops(argument);
  }
  yield browser.click('#search-submit');
};

exports.runSearchFOTW = function*(ops, argument) {
  yield browser
    .url('/fotw/?passback_id=1231231');
  if (typeof ops === 'function') {
    yield ops(argument);
  }
  yield browser.click('#search-submit');
};
