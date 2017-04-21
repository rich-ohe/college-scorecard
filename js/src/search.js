// tagalong!
var tagalong = require('tagalong');
var formdb = require('formdb');
var querystring = require('querystring');
var d3 = require('d3');

module.exports = function search() {

  var resultsRoot = document.querySelector('.search-results');
  var paginator = resultsRoot.querySelector('.pagination');
  var bottomPaginator = resultsRoot.querySelector('.pagination_bottom');

  var form = new formdb.Form('#search-form');
  var query = querystring.parse(location.search.substr(1));
  picc.form.autocompleteName('#search-form');
  // console.info('initial query:', query);

  // the current outbound request
  var req;

  var previousParams = query || {};
  var poppingState = false;
  var ready = false;
  var alreadyLoaded = false;

  // Search tools namespace
  picc.search = {};

  // are we in IE? hopefully not.
  var ie = typeof document.documentMode === 'number';

  // "incremental" updates will only hide the list of schools, and
  // not any of the other elements (results total, sort, pages)
  var incremental = false;

  // if this flag is set to false, the search form will not resubmit
  var submit = true;

  // the maximum # of page links to show
  var MAX_PAGES = 6;

  var change = picc.debounce(onChange, 100);

  // only render these directives, for performance (and IE11, *cough*)
  var directives = picc.data.selectKeys(picc.school.directives, [
    'title',
    'school_link',
    'name',
    'city',
    'state',
    'under_investigation',
    'size_number',
    'average_cost',
    'average_cost_meter',
    'grad_rate',
    'grad_rate_meter',
    'average_salary',
    'average_salary_meter',
    'more_link',
  ]);

  var win = d3.select(window);

  // get a reference to all of the sliders
  var sliders = d3.selectAll('picc-slider');

  // close other toggles when one opens
  var toggles = d3.selectAll('.toggle-accordion')
    .on('open', function() {
      var opened = this;
      toggles.each(function() {
        if (this !== opened) this.close();
      });

      var event = 'click.toggle';
      win.on(event, function() {
        if (!opened.contains(d3.event.target) && !d3.event.target.hasAttribute('aria-controls')) {
          console.log('here not a d3 event');
          win.on(event, null);
          opened.close();
        }
      });
    });

  // close all toggles on escape
  win.on('keyup.toggle', function() {
    if (d3.event.keyCode === 27) {
      toggles.property('expanded', false);
    }
  });

  // expand (child) accordions that contain elements with values set
  picc.ui.expandAccordions('.toggle-accordion aria-accordion', function() {
    var inputs = this.querySelectorAll('[name]');
    return [].some.call(inputs, function(input) {
      return query[input.name];
    });
  });

  picc.ready(function() {
    ready = true;

    // console.warn('setting form data:', query);
    form.setData(query);

    // for each of the sliders
    sliders
      // update them once first, so they don't fire a change event
      .each(updateSlider)
      .on('change', picc.debounce(function() {
        // when the slider changes, update the input with a range value.
        var input = this.querySelector('input');
        if (input) {
          if (this.lower > this.min || this.upper < this.max) {
            var lower = this.lower > this.min ? this.lower : '';
            var upper = this.upper < this.max ? this.upper : '';
            // console.log('%d > %d || %d < %d', this.lower, this.min, this.upper, this.max);
            input.value = [lower, upper].join('..');
          } else {
            // console.log('slider range @ limits:', this);
            input.value = '';
          }
          change();
        }
      }, 200));

    change();
  });

  form.on('change', change);

  // sort is an "incremental" update
  form.on('change:sort', function() {
    // console.log('change sort!');
    incremental = true;
  });

  // update the distance field's disabled flag when zip changes
  form.on('change:zip', updateDistanceDisabled);

  form.on('change:_drawer', function(value, e) {
    submit = false;
  });

  form.on('submit', function(data, e) {
    toggles.property('expanded', false);
    scrollIntoView();

    change();
    e.preventDefault();
    return false;
  });

  // update the form on popstate
  window.addEventListener('popstate', function(e) {
    if (!e.state) return;

    // copy the unset keys (as `null`) from the previous state to clear any
    // elements that aren't represented in the new state.
    var state = copyUnsetKeys(previousParams, e.state);
    // console.info('pop state:', e.state, '->', state);

    // update all of the form elements
    form.setData(state);

    // update the slider values, too
    sliders.each(updateSlider);

    poppingState = true;
    onChange();
    poppingState = false;
  });

  function onChange() {
    // XXX somehow, Firefox fires a change event before picc.ready() does its
    // callback. This guards against any browser that does this from
    // overwriting the query with default form data.
    if (!ready) {
      console.warn('onChange() before ready!');
      return;
    }

    // XXX the submit flag is set to false when the drawer toggles.
    if (!submit) {
      // console.warn('not submitting this time!');
      submit = true;
      return;
    }

    // always update the distance disabled state
    updateDistanceDisabled();

    var params = form.getData();
    // console.info('form data:', params);

    // unset parameters that are "empty" arrays (with a single, falsy value)
    for (var k in params) {
      if (Array.isArray(params[k]) && !params[k][0]) {
        // console.warn('ignoring empty array parameter:', k, params[k]);
        delete params[k];
      }
    }

    // don't submit the _drawer parameter
    delete params._drawer;

    if (diffExcept(previousParams, params, ['page'])) {
      // console.warn('non-page change:', previousParams, '->', params);
      delete params.page;
    }

    var query = picc.form.prepareParams(params);

    // only query the fields that we care about
    query.fields = [
      // we need the id to link it
      picc.fields.ID,
      // basic display fields
      picc.fields.NAME,
      picc.fields.CITY,
      picc.fields.STATE,
      picc.fields.ZIP_CODE,
      picc.fields.REGION_ID,
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
      // earnings share above HS
      picc.fields.EARNINGS_GT_25K,
      // under investigation flag
      picc.fields.UNDER_INVESTIGATION
    ].join(',');

    var qs = querystring.stringify(params);
    qs = '?' + qs.replace(/^&+/, '')
      .replace(/&{2,}/g, '&')
      .replace(/%3A/g, ':');

    if (poppingState) {
      // console.info('popping state');
      // history.replaceState(params, 'search', qs);
    } else if (alreadyLoaded && diff(previousParams, params)) {
      // console.info('push state:', qs, previousParams, '->', params);
      // update the URL
      history.pushState(params, 'search', qs);
    } else {
      // console.info('replace state:', qs);
      history.replaceState(params, 'search', qs);
    }

    d3.select('a.results-share')
      .attr('href', function() {
        return picc.template.resolve(
          this.getAttribute('data-href'),
          {url: encodeURIComponent(document.location.href)}
        );
      });

    if (req) req.abort();

    resultsRoot.classList.toggle('js-incremental', incremental);

    if (incremental) {
      // incremental
    } else {
      resultsRoot.classList.add('js-loading');
      resultsRoot.classList.remove('js-loaded');
      resultsRoot.classList.remove('js-error');
    }

    paginator.classList.toggle('show-loading', incremental);

    console.time && console.time('[load]');

    req = picc.API.search(query, function(error, data) {
      resultsRoot.classList.remove('js-loading');
      resultsRoot.classList.remove('js-incremental');

      paginator.classList.remove('show-loading');
      bottomPaginator.classList.remove('show-loading');

      previousParams = params;
      incremental = false;

      console.timeEnd && console.timeEnd('[load]');

      if (error) {
        resultsRoot.classList.add('js-error');
        return showError(error);
      }

      resultsRoot.classList.add('js-loaded');

      var format = picc.format;

      console.log('loaded schools:', data);

      console.time && console.time('[render]');

      var meta = data.metadata || data;
      // console.log('meta:', meta);
      var total = meta.total;

      // only update the heading
      var heading = resultsRoot.querySelector('.results-main-alert');
      tagalong(heading, meta, {
        results_word: format.plural('total', 'Result'),
        results_total: format.number('total', '0')
      });

      var page = +params.page || 0;
      var perPage = meta.per_page;

      var pages = getPages(total, perPage, page);

      tagalong(paginator, {
        pages: pages
      }, {
        pages: {
          '@data-index': function(d) {
            return String(d.index);
          },
          '@class': function(d) {
            return d.index === page
              ? 'pagination-page_selected'
              : d.arrow ? 'pagination-arrow' : null;
          },
          link: {
            text: 'page',
            '@data-page': function(d) {
              return String(d.index);
            },
            '@href': function(d) {
              return d.index === page
                ? null
                : d.index === false
                  ? null
                  : '?' + querystring.stringify(picc.data.extend({}, params, {page: d.index}));
            }
          }
        }
      });

      // duplicate the pagination structure below the search results
      bottomPaginator.innerHTML = paginator.innerHTML;

      var pageLinks = d3.select(resultsRoot)
        .selectAll('a.select-page')
          .on('click', function() {
            d3.event.preventDefault();

            var _page = this.getAttribute('data-page');
            if (_page === 'false') return;

            pageLinks.each(function() {
              var p = this.getAttribute('data-page');
              var selected = p == _page;
              this.parentNode.classList
                .toggle('pagination-page_selected', selected);
              // console.log('selected?', p, page, selected, '->', this.parentNode);
            });

            form.set('page', _page);
            incremental = true;
            change();
          });

      var resultsList = resultsRoot.querySelector('.schools-list');

      /*
       * XXX this avoids a nasty hard crash in IE11, which seems to have some
       * problems with tagalong's data joining algorithm (and/or, you know,
       * it's just broken).
       *
       * Removing the children of the results list after it's already been
       * rendered (iff `alreadyLoaded` is true) guarantees that tagalong has
       * stashed a reference to the template node.
       *
       * Note: we _don't_ do this in other browsers because it has performance
       * implications. Rendering will be much faster when the existing nodes
       * are reused and modified in place, rather than being cloned anew each
       * time.
       */
      if (ie && alreadyLoaded) {
        removeAllChildren(resultsList);
      }

      // Scroll to the top of the result list when loading new pages
      if (alreadyLoaded) {
          scrollIntoView();
      }

      tagalong(resultsList, data.results, directives);

      alreadyLoaded = true;

      console.timeEnd && console.timeEnd('[render]');

      // nudge request
      if (data.metadata.total >= 1) {
        getNudge(data.results, query, params);
      } else {
        picc.search.nudge.displayNudge(false);
      }


    });
  }

  picc.ready(function() {
    var nudgeButton = 'data-button';
    picc.delegate(
      document.querySelector('[data-button="nudge-button"]'),
      function() {
        return this.hasAttribute(nudgeButton);
      },
      {
        click: function() { picc.ui.expandAccordions('#search-edit', true); }
      }
    );
  });

  function getPages(total, perPage, page) {

    var numPages = Math.ceil(total / perPage);
    var previous = false;
    var next = false;
    var pages;

    if (numPages > MAX_PAGES) {
      var end = Math.min(page + MAX_PAGES, numPages);
      var start = end - MAX_PAGES;
      // console.log('pages: %d -> %d', start, end);
      pages = d3.range(start, start + MAX_PAGES);
      previous = start > 0;
      next = end < numPages;
    } else {
      pages = d3.range(0, numPages);
    }

    // console.log('pages:', numPages, '->', pages);

    pages = pages.map(function(page) {
      return {
        page: page + 1,
        index: page
      };
    });

    if (previous) {
      var first = pages[0];
      pages.unshift({
        index: first.index - 1,
        page: '<',
        arrow: true
      });
      if (first.index > 1) {
        pages.unshift({
          index: 0,
          page: '<<',
          arrow: true
        });
      }
    }
    if (next) {
      var last = pages[pages.length - 1];
      pages.push({
        index: last.index + 1,
        page: '>',
        arrow: true
      });
      if (last.index < numPages - 1) {
        pages.push({
          index: numPages - 1,
          page: '>>',
          arrow: true
        });
      }
    }

    return pages;
  }

  function showError(error) {
    console.error('error:', error);
    var message = resultsRoot.querySelector('.error-message');
    if (typeof error.responseText != "undefined") {
      var errorText = JSON.parse(error.responseText);
      error = errorText.errors[0].message;
    }

    message.textContent = String(error) || 'There was an unexpected API error.';
  }

  function diffExcept(a, b, keys) {
    a = picc.data.extend({}, a);
    b = picc.data.extend({}, b);
    keys.forEach(function(key) {
      delete a[key];
      delete b[key];
    });
    // console.log('diff except:', a, b, keys);
    return diff(a, b);
  }

  function diff(a, b) {
    if ((typeof a) !== (typeof b)) {
      // console.log('diff types:', typeof a, typeof b);
      return true;
    } else if (typeof a === 'object') {
      for (k in a) if (diff(a[k], b[k])) return true;
      for (k in b) if (diff(a[k], b[k])) return true;
      return false;
    }
    return a != b;
  }

  function copyUnsetKeys(from, into) {
    var copy = picc.data.extend({}, into);
    for (var key in from) {
      if (!copy.hasOwnProperty(key)) {
        copy[key] = null;
      }
    }
    return copy;
  }


  function updateSlider() {
    // get the value of its hidden input (set by formdb),
    // and parse it as a range
    var input = this.querySelector('input');
    if (input) {
      var value = input.value.split('..').map(Number);
      if (value.length === 2) {
        this.lower = value[0] || this.min;
        this.upper = value[1] || this.max;
      } else {
        // console.warn('bad slider input value:', value);
      }
    }
  }

  function updateDistanceDisabled() {
    var zip = form.get('zip');
    var dist = form.getInputsByName('distance')[0];
    if (!dist) return;
    dist.disabled = !zip;
  }

  function scrollIntoView() {
    try {
      form.element.scrollIntoView();
    } catch (error) {
      console.warn('unable to scroll results into view:', error);
    }
  }

  function removeAllChildren(node) {
    while (node.lastChild) {
      node.removeChild(node.lastChild);
    }
  }

  function getNudge(results, query, originalParams) {

    // check if we have a valid nudge search; mode === 'name', 'location', or '' for not valid;
    var nudgeMode = picc.search.nudge.getNudgeMode(originalParams);
    if (!nudgeMode) {
      console.info('no nudge mode available for search');
      return picc.search.nudge.displayNudge(false);
    }
    console.info('[Nudge Mode]: ',nudgeMode);

    var singleResult = false;
    if (results.length === 1) {
      singleResult = results[0];
    } else {
      var schoolsPerforming = picc.search.nudge.filterLowPerforming(results, originalParams, null);
      if (schoolsPerforming.length) {
        console.info('No nudge mode available for multiple schools');
        return picc.search.nudge.displayNudge(false);
      }
    }

    var nudgeQuery = picc.data.extend({}, query);

    picc.search.nudge.removeBlacklistParams(query, nudgeQuery);
    nudgeQuery = picc.search.nudge.queryForNudgeMode(nudgeMode, nudgeQuery, results, originalParams);

    console.log('nudgeQuery', nudgeQuery);

    var nudge = picc.API.search(nudgeQuery, function(error, data) {
      if (error) {
        return console.error('nudge error', error);
      }

      // remove original single result school from nudges
      var filteredResults = data.results.filter(function(nudgeSchool){
        if (singleResult) {
        return nudgeSchool.id !== singleResult.id;
        } else {
          // loop over original results
          return results.some(function(originalSchool){
            return (originalSchool.id !== nudgeSchool.id);
          })
        }
      });

      // Filter out some `low performing` schools, currently only
      // evaluating grad completion rate & salary earnings after HS.
      // Neither metric can be below the given thresholds
      filteredResults = picc.search.nudge.filterLowPerforming(filteredResults, originalParams, nudgeMode);

      if (filteredResults.length > 0) {
        console.info('loaded nudge schools: ', data);
        picc.search.nudge.displayNudge(true);
        var nudgeText = picc.search.nudge.getNudgeText(nudgeQuery, nudgeMode, originalParams);
        tagalong('.nudge-meta', {'nudgeText': nudgeText}, picc.data.selectKeys(picc.school.directives, ['nudge_mode']));
        // limit 10 nudge results
        tagalong('.school-nudge-list', filteredResults.slice(0,10), directives);
      } else {
        console.info('no nudge results');
        picc.search.nudge.displayNudge(false);
      }

    });
  }

  // Nudge utils
  picc.search.nudge = {

    location_areas: {
      large: ['AK', 'SD', 'WY'],
      small: ['DC', 'ME', 'RI', 'VT']
    },

    degrees: {
      'a': 'Associate\'s Degree',
      'b': 'Bachelor\'s Degree',
      'c': 'Certficates'
    },

    blacklist: [
      'zip',
      'distance',
      picc.fields.NAME,
      picc.fields.STATE,
      picc.fields.REGION_ID,
      picc.fields.MEN_ONLY,
      picc.fields.WOMEN_ONLY,
      picc.fields.MINORITY_SERVING
    ],


    // filter some original query params from nudgeQuery
    removeBlacklistParams: function removeBlacklistParams(query, nudgeQuery) {
      Object.keys(query).forEach(function(paramKey) {
        picc.search.nudge.blacklist.forEach(function(remove) {
          if ( paramKey.indexOf(remove) > -1 ) {
            // console.log('remove: ', paramKey);
            delete nudgeQuery[paramKey];
          }
        });
      });
    },

    displayNudge:   function displayNudge(bool) {
      var nudgeContainer = d3.select('.section-card_container-nudge');
      nudgeContainer.classed('no-nudge', !bool);
      var schoolsContainer = d3.select('.section-card_container-results');
      schoolsContainer.classed('nudged', bool);
    },

    getNudgeMode: function getNudgeMode(origParams) {
      // priority is given to `name` search
      var mode ='';
      if (origParams.name) { mode = 'name'; }
      else if (origParams.state && origParams.degree) {
        mode = this.getLocationSearchType(origParams);
      }
      return mode;
    },

    getNudgeText: function(nudgeQuery, nudgeMode, origParams) {
      var degree, program, online, type, size;

      switch (nudgeMode) {
        case 'name':
          return 'Check Out Schools Nearby';
        case 'online':
        case 'region':
        case 'borders':
          degree = (nudgeMode==='online') ? 'Offering Online ' + this.degrees[origParams.degree] : 'Nearby Offering ' +this.degrees[origParams.degree];
          program = (origParams.major) ? 'in '+ picc.PROGRAM_NAMES[origParams.major] : 'Programs';
          return 'Check Out Schools ' + degree + ' ' + program;
      }
    },

    queryForNudgeMode: function queryForNudgeMode(nudgeMode, nudgeQuery, origResult, origParams) {
      switch(nudgeMode) {
        case 'name':
          // look for schools in a greater zip radius
          // within the same state
          nudgeQuery[picc.fields.STATE] = picc.access(picc.fields.STATE)(origResult[0]);
          nudgeQuery['zip'] = +picc.access(picc.fields.ZIP_CODE)(origResult[0]);
          nudgeQuery['distance'] = '25';
          nudgeQuery = this.setProgramForMode(nudgeQuery, origParams, nudgeMode);
          break;
        case 'online':
          nudgeQuery = this.setProgramForMode(nudgeQuery, origParams, nudgeMode);
          break;
        case 'region':
          nudgeQuery[picc.fields.REGION_ID] = picc.access(picc.fields.REGION_ID)(origResult[0]);
          nudgeQuery = this.setProgramForMode(nudgeQuery, origParams, nudgeMode);
          break;
        case 'borders':
          nudgeQuery[picc.fields.STATE] = this.getBordersForStatesUnique(origParams.state);
          nudgeQuery = this.setProgramForMode(nudgeQuery, origParams, nudgeMode);
          break;
      }
      return nudgeQuery;
    },

    // ensure a nudge school offers a specified program
    // in the chosen degree
    setProgramForMode: function(nudgeQuery, origParams, nudgeMode) {

      if (origParams.major) {
        var oldParamVal;
        var newParamKey;

        var online;
        if (nudgeMode === 'online') {
          online = 2;
        }

        var degree;
        switch (origParams.degree) {
          case 'a':
            degree = 'assoc';
            break;
          case 'b':
            degree = 'bachelors';
            break;
          case 'c':
            degree = 'certificate';
            break;
          default:
            degree = 'degree';

        }

        if ( online || degree !== 'degree') {

          Object.keys(nudgeQuery).forEach(function (paramKey) {
            if (paramKey.indexOf(origParams.major) > -1) {
              oldParamVal = nudgeQuery[paramKey];
              newParamKey = paramKey.replace('degree', degree);
              if (online) {
                newParamKey = newParamKey.replace('__range', '');
                nudgeQuery[newParamKey] = online;
              } else {
                nudgeQuery[newParamKey] = oldParamVal;
              }
              delete nudgeQuery[paramKey];
            }
          });
        }
      }
      return nudgeQuery;
    },

    //FIXME move to national_stats
    thresholds: {
      // associates
      a: {
        completionRate: 0.15,
        earningsRate:   0.34,
      },
      // bachelor's
      b: {
        completionRate: 0.25,
        earningsRate:  0.45,
      },
      // certificate
      c: {
        completionRate: 0.25,
        earningsRate:  0.45,
      },
      predeg: {
        0: 'b', // not disclosed use b
        1: 'a',
        2: 'b',
        3: 'c'
      }
    },

    filterLowPerforming: function filterLowPerforming(schools, originalParams, nudgeMode) {
      var thresholds = this.thresholds;
      return schools.filter(function(school) {
        var testsFailed = [];
        var lowCompletion;
        var lowEarnings;

        if (nudgeMode === 'name' || ! originalParams.degree) {
          // we don't reliably know the threshold-type by degree for a school.name search
          // so use predominant degree to select thresholds
          lowCompletion = thresholds[thresholds.predeg[school[picc.fields.PREDOMINANT_DEGREE]]].completionRate;
          lowEarnings = thresholds[thresholds.predeg[school[picc.fields.PREDOMINANT_DEGREE]]].earningsRate;

        } else {
          lowCompletion = thresholds[originalParams.degree].completionRate;
          lowEarnings = thresholds[originalParams.degree].earningsRate;
        }
        // for now commenting this to allow schools that don't have metrics for either threshold checks
        // if ( school[picc.fields.COMPLETION_RATE] === null && school[picc.fields.EARNINGS_GT_25K] === null) testsFailed.push(true);

        // completion rate
        if (school[picc.fields.COMPLETION_RATE] !== null && school[picc.fields.COMPLETION_RATE] < lowCompletion ) testsFailed.push(true);

        // salary earnings above HS
        if (school[picc.fields.EARNINGS_GT_25K] !== null && school[picc.fields.EARNINGS_GT_25K] < lowEarnings) testsFailed.push(true);

        return ( testsFailed.indexOf(true) === -1 );

      });
    },

    getLocationSearchType: function getLocationSearchType(origParams) {
      var type = '';
      var statesArr = origParams.state;

      // priority of location type assignment is of large or small, then is bordering;
      // some large or small states also border different regions

      // large-area states -> add `online only`
      if (this.isState(this.inArea, this.location_areas['large'], statesArr)) { type = 'online'; }
      // small-area states -> add region states
      else if (this.isState(this.inArea, this.location_areas['small'], statesArr)) { type = 'region'; }
      // state borders a different region -> add neighboring states
      else if (this.isBordersDifferentRegion(statesArr)) { type = 'borders'; }

      return type;
    },

    inArea: function inArea(el, i, arr) {
      return (this.indexOf(el) > -1);
    },

    isState: function isState(fn, location_area, states) {
      return states.some(fn, location_area);
    },

    isBordersDifferentRegion: function isBordersDifferentRegion(statesArr) {

      var regionsUnique = this.getRegionsForStatesUnique(statesArr);
      var borderStatesUnique = this.getBordersForStatesUnique(statesArr);
      var borderStateRegionsUnique = this.getRegionsForStatesUnique(borderStatesUnique);

      return borderStateRegionsUnique.some(function(el, i, arr){
        return (this.indexOf(el) === -1);
      }, regionsUnique);
    },

    getBordersForStatesUnique: function getBordersForStatesUnique(statesArr) {
      return [].concat.apply([], statesArr.map(function(state) {
        return picc.STATES[state].border_states.split(" ");
      }))
      .filter(function(state){
        return state;
      });
    },

    getRegionsForStatesUnique: function getRegionsForStatesUnique(statesArr) {
      return statesArr
        .map(function(state){
            return picc.STATES[state].region_id;
        })
        .filter(function(el, i, arr){
          return arr.indexOf(el) === i;
        });
    },

  };

};
