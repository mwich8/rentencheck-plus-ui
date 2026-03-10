// Karma configuration file — extended timeouts for PDF generation tests
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
    ],
    client: {
      jasmine: {},
      clearContext: false, // leave Jasmine Spec Runner output visible in browser
    },
    jasmineHtmlReporter: {
      suppressAll: true,
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/rentencheck-plus'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
      ],
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['ChromeHeadless'],
    restartOnFileChange: true,

    // ── Extended timeouts for heavy PDF generation tests ──
    browserNoActivityTimeout: 120000,   // 2 min (default: 30s)
    browserDisconnectTimeout: 30000,    // 30s (default: 2s)
    browserDisconnectTolerance: 3,      // retry up to 3 times
    captureTimeout: 120000,             // 2 min for browser startup
  });
};

