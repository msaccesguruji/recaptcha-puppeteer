const { install } = require('@puppeteer/browsers');

console.log('📦 Installing Chrome with Puppeteer...');
install({
  browser: 'chrome',
  buildId: '121.0.6167.85'
})
.then(() => {
  console.log('✅ Chrome installed!');
})
.catch((err) => {
  console.error('❌ Chrome install failed:', err);
  process.exit(1);
});
