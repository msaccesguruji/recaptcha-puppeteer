const puppeteer = require('puppeteer-extra');
const express = require('express');
const path = require('path');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const app = express();
app.use(express.static('public'));
app.use(express.json());

app.post('/get-recaptcha-token', async (req, res) => {
  const siteKey = req.body.siteKey || '6LcFFhweAAAAAKVAzmxaLI8IwgXIWydvrEvmE2Qm';
  const action = req.body.action || 'submit';
  const pageUrl = `file://${path.join(__dirname, 'public', 'index.html')}`;

  console.log('🔐 Launching browser with stealth plugin...');

  try {
    const browser = await puppeteer.launch({
      headless: false, // ❗ Show real browser window
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(pageUrl, { waitUntil: 'networkidle2' });

    console.log('📄 Page loaded. Waiting for tokenReady...');
    await page.waitForFunction(() => window.tokenReady === true, {
      timeout: 10000,
      polling: 300
    });

    const token = await page.evaluate(() => {
      return document.querySelector('#token')?.value || '';
    });

    console.log('✅ Token extracted from DOM:', token);
    await browser.close();
    res.json({ success: true, token });

  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
