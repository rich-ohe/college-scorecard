/* jshint node: true */
var baseUrl = require('./url');

exports.config = {

    //
    // ==================
    // Specify Test Files
    // ==================
    // Define which test specs should run. The pattern is relative to the
    // directory from which `wdio` was called. Notice that, if you are calling
    // `wdio` from an NPM script (see https://docs.npmjs.com/cli/run-script)
    // then the current working directory is where your package.json resides, so
    // `wdio` will be called from there.
    //
    specs: [
        './test/spec/**/*.js'
    ],

    // Patterns to exclude.
    exclude: [
    ],

    //
    // ============
    // Capabilities
    // ============
    // Define your capabilities here. WebdriverIO can run multiple capabilties
    // at the same time. Depending on the number of capabilities, WebdriverIO
    // launches several test sessions. Within your capabilities you can
    // overwrite the spec and exclude option in order to group specific specs to
    // a specific capability.
    //

    maxInstances: 1,
    // If you have trouble getting all important capabilities together, check
    // out the Sauce Labs platform configurator - a great tool to configure your
    // capabilities: https://docs.saucelabs.com/reference/platforms-configurator
    //
    capabilities: [{
        browserName: 'chrome',
        maxDuration: 4000,
        extendedDebugging: true,
        version: "74.0"
        // chromeOptions: {
        //     w3c: false
        // }
    }],

    //
    // ===================
    // Test Configurations
    // ===================
    // Define all options that are relevant for the WebdriverIO instance here
    //
    // Per default WebdriverIO commands getting executed in a synchronous way using
    // the wdio-sync package. If you still want to run your tests in an async way
    // using promises you can set the sync command to false.
    sync: true,

    // Level of logging verbosity.
    logLevel: 'silent',

    //
    // Enables colors for log output.
    coloredLogs: true,

    //
    // Saves a screenshot to a given path if a command fails.
    screenshotPath: './screenshots',

    //
    // Set a base URL in order to shorten url command calls. If your url
    // parameter starts with "/", the base url gets prepended.
    baseUrl: baseUrl,

    //
    // Default timeout for all waitForXXX commands.
    waitforTimeout: 20000,

    //
    // Initialize the browser instance with a WebdriverIO plugin. The object
    // should have the plugin name as key and the desired plugin options as
    // property. Make sure you have the plugin installed before running any
    // tests. The following plugins are currently available:
    //
    // WebdriverCSS: https://github.com/webdriverio/webdrivercss
    // WebdriverRTC: https://github.com/webdriverio/webdriverrtc
    // Browserevent: https://github.com/webdriverio/browserevent
    // plugins: {
    //     webdrivercss: {
    //         screenshotRoot: 'my-shots',
    //         failedComparisonsRoot: 'diffs',
    //         misMatchTolerance: 0.05,
    //         screenWidth: [320,480,640,1024]
    //     },
    //     webdriverrtc: {},
    //     browserevent: {}
    // },
    //
    // Framework you want to run your specs with.
    // The following are supported: mocha, jasmine and cucumber
    // see also: http://webdriver.io/guide/testrunner/frameworks.html
    //
    // Make sure you have the node package for the specific framework installed
    // before running any tests. If not please install the following package:
    // Mocha: `$ npm install mocha`
    // Jasmine: `$ npm install jasmine`
    // Cucumber: `$ npm install cucumber`
    framework: 'mocha',

    //
    // Test reporter for stdout.
    // The following are supported: dot (default), spec and xunit
    // see also: http://webdriver.io/guide/testrunner/reporters.html
    reporter: 'dot',

    //
    // Options to be passed to Mocha.
    // See the full list at http://mochajs.org/
    mochaOpts: {
        ui: 'bdd',
        timeout: 600000
    },

    //
    // =====
    // Hooks
    // =====
    // Run functions before or after the test. If one of them returns with a
    // promise, WebdriverIO will wait until that promise got resolved to
    // continue.
    //
    // Gets executed before all workers get launched.
    onPrepare: function() {
        // do something
    },

    //
    // Gets executed before test execution begins. At this point you will have
    // access to all global variables like `browser`. It is the perfect place to
    // define custom commands.
    before: function() {
        // do something
    },

    //
    // Gets executed after all tests are done. You still have access to all
    // global variables from the test.
    after: function(/* failures, pid */) {
        // do something
    },

    //
    // Gets executed after all workers got shut down and the process is about to
    // exit. It is not possible to defer the end of the process using a promise.
    onComplete: function() {
        // do something
    }
};
