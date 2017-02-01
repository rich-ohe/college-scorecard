var formdb = require('formdb');
var tagalong = require('tagalong');

module.exports = function fotw() {

  var loadable = document.querySelector('.loadable');
  var fotwRoot = document.querySelector('.fotw-schools');
  var fotwSchools = picc.school.selection.all('fotw');
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
          return 'fotw';
        }
      },
      fotw_checkbox: {
        '@id': function (d) {
          return 'edit-fotw-' + picc.access('schoolId')(d);
        },
        '@checked': function(d) {
          return (picc.school.selection.isSelected(picc.access('schoolId')(d), 'fotw') >= 0) ? 'checked': null;
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
  picc.ready(function() {

    var fotwBox = 'data-school';
    picc.delegate(
      document.body,
      // if the element matches '[data-school]'
      function() {
        return this.parentElement.hasAttribute(fotwBox) ||
          this.hasAttribute(fotwBox);
      },
      {
        click: picc.debounce(picc.school.selection.toggle,100)
      }
    );

  });

 form.on('submit', function(data, e) {

   if (!data['schools[]'] || !data['schools[]'].length) {
     console.warn('No schools selected.');
     e.preventDefault();
     return false;
   }
   form.set('passback_id', window.sessionStorage.getItem('passback_id'));

   //window.sessionStorage.removeItem('passback_id');
   //window.localStorage.removeItem('fotw');

   // this.element.action = 'http://127.0.0.1:8080/index.html';

 });


};