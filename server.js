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

  console.log('🔐 Starting reCAPTCHA token generation...');
  console.log('➡️ Site key:', siteKey);
  console.log('➡️ Action:', action);
  console.log('➡️ Loading HTML page:', pageUrl);

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: process.env.CHROME_EXECUTABLE_PATH || undefined,
    });

    const page = await browser.newPage();
    await page.goto(pageUrl, { waitUntil: 'networkidle2' });
    console.log('✅ Page loaded. Waiting briefly before checking token...');

    await page.waitForTimeout(1000); // Add 1-second delay for safety

    const token = await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          const textarea = document.querySelector('#token');
          if (textarea && textarea.value && !textarea.value.startsWith('Error')) {
            clearInterval(checkInterval);
            resolve(textarea.value.trim());
          }
        }, 300);

        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Timed out waiting for token in DOM'));
        }, 10000);
      });
    });

    console.log('✅ Token successfully retrieved from DOM:');
    console.log(token);

    await browser.close();
    console.log('🧹 Browser closed. Sending token back to client.');

    res.json({ success: true, token });
  } catch (err) {
    console.error('❌ Error generating token:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
