const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
app.use(express.static('public'));
app.use(express.json());

app.post('/get-recaptcha-token', async (req, res) => {
  const siteKey = req.body.siteKey || '6LcFFhweAAAAAKVAzmxaLI8IwgXIWydvrEvmE2Qm';
  const action = req.body.action || 'submit';
  const pageUrl = `file://${path.join(__dirname, 'public', 'index.html')}`;

  console.log('🔐 Generating reCAPTCHA token...');
  console.log('➡️ SiteKey:', siteKey);
  console.log('➡️ Action:', action);

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: process.env.CHROME_EXECUTABLE_PATH || undefined,
    });

    const page = await browser.newPage();
    await page.goto(pageUrl, { waitUntil: 'networkidle2' });

    console.log('📄 Page loaded. Waiting for tokenReady...');

    // Wait until window.tokenReady is true
    await page.waitForFunction(() => window.tokenReady === true, {
      timeout: 10000,
      polling: 300,
    });

    // Now get the final value from the DOM
    const token = await page.evaluate(() => {
      const textarea = document.querySelector('#token');
      return textarea?.value || '';
    });

    console.log('✅ Token from DOM:', token);

    await browser.close();
    res.json({ success: true, token });
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
