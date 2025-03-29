const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const { computeExecutablePath } = require('@puppeteer/browsers');

const app = express();
app.use(express.static('public'));
app.use(express.json());

app.post('/get-recaptcha-token', async (req, res) => {
  try {
    const chromePath = computeExecutablePath({
      browser: 'chrome',
      buildId: '121.0.6167.85' // Match the version you installed in install-chrome.js
    });

    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath: chromePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    page.on('console', msg => console.log('🖥 [Browser]', msg.text()));

    // ✅ Use your Render domain here
    const pageUrl = 'https://recaptcha-yourproject.onrender.com/index.html';
    console.log(`📄 Opening: ${pageUrl}`);
    await page.goto(pageUrl, { waitUntil: 'networkidle2' });

    console.log('⏳ Waiting for reCAPTCHA token...');
    await page.waitForFunction(() => window.tokenReady === true, { timeout: 30000 });

    const token = await page.evaluate(() => window.recaptchaToken);
    console.log('✅ Token received:', token);

    await browser.close();
    res.json({ success: true, token });

  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
