var tagalong = require('tagalong');

module.exports = function fotw() {

  var loadable = document.querySelector('.loadable');
  var fotwRoot = document.querySelector('.fotw-schools');

  var fotwSchools = picc.school.selection.all('fotw');

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

    var fotwBox = 'checkbox-focus';
    picc.delegate(
      document.body,
      // if the element matches '.checkbox-focus'
      function() {

        return this.parentElement.classList.contains(fotwBox) ||
          this.classList.contains(fotwBox);
      },
      {
        click: picc.school.selection.toggle
      }
    );

  });

};