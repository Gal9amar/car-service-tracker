const puppeteer = require('/home/user/car-service-tracker/mockups/node_modules/puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME = '/root/.cache/puppeteer/chrome/linux-128.0.6613.119/chrome-linux64/chrome';
const BASE = '/home/user/car-service-tracker/mockups';

const files = [
  { input: 'option5-tesla.html', output: 'option5.png' },
  { input: 'option6-bmw.html',   output: 'option6.png' },
  { input: 'option7-byd.html',   output: 'option7.png' },
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: 'new',
  });

  for (const f of files) {
    let html = fs.readFileSync(path.join(BASE, f.input), 'utf8');
    html = html.replace(/<link[^>]*fonts\.googleapis\.com[^>]*>/g, '');
    html = html.replace(/'Segoe UI',\s*Arial,\s*sans-serif/g, "Arial, sans-serif");

    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({
      path: path.join(BASE, f.output),
      type: 'png',
      clip: { x: 0, y: 0, width: 390, height: 844 }
    });
    await page.close();
    console.log(`✓ ${f.output}`);
  }

  await browser.close();
})();
