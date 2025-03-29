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

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: process.env.CHROME_EXECUTABLE_PATH || undefined,
    });

    const page = await browser.newPage();
    await page.goto(pageUrl, { waitUntil: 'networkidle2' });

    // Wait for tokenReady to be true (from JS)
    await page.waitForFunction(() => window.tokenReady === true, {
      timeout: 10000,
      polling: 300,
    });

    // Read the final token directly from JS variable
    const token = await page.evaluate(() => window.recaptchaToken);

    await browser.close();
    res.json({ success: true, token });

  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
