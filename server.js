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

  console.log('🔐 Launching Puppeteer...');

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: process.env.CHROME_EXECUTABLE_PATH || undefined,
    });

    const page = await browser.newPage();

    // Optional: help reduce detection (but no stealth plugin used)
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36');
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

    console.log('📄 Navigating to:', pageUrl);
    await page.goto(pageUrl, { waitUntil: 'networkidle2' });

    console.log('⏳ Waiting for tokenReady...');
    await page.waitForFunction(() => window.tokenReady === true, {
      timeout: 15000,
      polling: 300,
    });

    const token = await page.evaluate(() => window.recaptchaToken);
    console.log('✅ Extracted token:', token);

    await browser.close();
    res.json({ success: true, token });

  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
