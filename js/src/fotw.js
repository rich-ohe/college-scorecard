var formdb = require('formdb');
var tagalong = require('tagalong');
var querystring = require('querystring');

module.exports = function fotw() {

  var loadable = document.querySelector('.loadable');
  var fotwRoot = document.querySelector('.fotw-schools');
  var fotwSchools = picc.school.selection.all('compare');
  var form = new formdb.Form('#fotw-schools-form');

  var showError = function(error) {
    console.error('error:', error);
    var message = fotwRoot.querySelector('.error-message');
    if (typeof error.responseText != "undefined") {
      var errorText = JSON.parse(error.responseText);
      error = errorText.errors[0].message;
    }

    message.textContent = String(error) || 'There was an unexpected error.';
  };

  if (!fotwSchools.length) {
    loadable.classList.add('js-error');
    return showError(picc.errors.NO_SUCH_SCHOOL);
  }

  loadable.classList.add('js-loaded');

  tagalong(
    '#edit-fotw-list',
    fotwSchools,
    {
      checkbox_label: {
        '@for': function(d) {
          return 'edit-fotw-' + picc.access('schoolId')(d);
        },
        '@data-school-id': function (d) {
          return picc.access('schoolId')(d);
        },
        '@data-school-name': function(d) {
          return picc.access('schoolName')(d);
        },
        '@data-school': function() {
          return 'compare';
        }
      },
      fotw_checkbox: {
        '@id': function (d) {
          return 'edit-fotw-' + picc.access('schoolId')(d);
        },
        '@checked': function(d) {
          return (picc.school.selection.isSelected(picc.access('schoolId')(d), 'compare') >= 0) ? 'checked': null;
        },
        '@value': function(d) {
          return picc.access('fotw')(d);
        }
      }
    }
  );
  /**
   * add event listeners for school selection click events
   */
  // picc.ready(function() {
  //
  //   var fotwBox = 'data-school';
  //   picc.delegate(
  //     document.body,
  //     // if the element matches '[data-school]'
  //     function() {
  //       return this.parentElement.hasAttribute(fotwBox) ||
  //         this.hasAttribute(fotwBox);
  //     },
  //     {
  //       change: picc.school.selection.toggle
  //     }
  //   );
  //
  // });

  form.on('submit', function(data, e) {

    if (!data['schools[]'] || !data['schools[]'].length) {
      console.warn('No schools selected.');
      e.preventDefault();
      return false;
    }
    form.set('passback_id', window.sessionStorage.getItem('passback_id'));

    // commented for development
    //window.sessionStorage.removeItem('passback_id');

    // update for FOTW-integration passback
    // this.element.action = 'http://127.0.0.1/return_trip';

  });

};