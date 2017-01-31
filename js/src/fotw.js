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
    return showError(picc.errors.NO_SCHOOLS_TO_COMPARE);
  }

  console.log(fotwSchools);

  tagalong(
    '#edit-fotw-list',
    fotwSchools,
    {
      'name': function(d) {

        return picc.access('name')(d);
      },

    }
  );

};