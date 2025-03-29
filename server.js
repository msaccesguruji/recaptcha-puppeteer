const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
app.use(express.static('public')); // Serve index.html
app.use(express.json());

app.post('/get-recaptcha-token', async (req, res) => {
  const siteKey = req.body.siteKey || '6LcFFhweAAAAAKVAzmxaLI8IwgXIWydvrEvmE2Qm';
  const action = req.body.action || 'submit';
  const pageUrl = `file://${path.join(__dirname, 'public', 'index.html')}`;

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.goto(pageUrl, { waitUntil: 'networkidle2' });

    // Pass siteKey and action to page context
    const token = await page.evaluate(async (siteKey, action) => {
      return new Promise((resolve, reject) => {
        grecaptcha.ready(() => {
          grecaptcha.execute(siteKey, { action })
            .then(resolve)
            .catch(reject);
        });
      });
    }, siteKey, action);

    await browser.close();

    res.json({ success: true, token });
  } catch (err) {
    console.error('Error generating token:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
