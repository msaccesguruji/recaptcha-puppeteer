const { install } = require('@puppeteer/browsers');

install({
  browser: 'chrome',
  buildId: '121.0.6167.85' // Match this with computeExecutablePath
});
