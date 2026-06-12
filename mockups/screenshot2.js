const puppeteer = require('/home/user/car-service-tracker/mockups/node_modules/puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME = '/root/.cache/puppeteer/chrome/linux-128.0.6613.119/chrome-linux64/chrome';
const BASE = '/home/user/car-service-tracker/mockups';

const files = [
  { input: 'option1-garage.html', output: 'option1.png' },
  { input: 'option2-minimal.html', output: 'option2.png' },
  { input: 'option3-native.html', output: 'option3.png' },
  { input: 'option4-bold.html', output: 'option4.png' },
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: 'new',
  });

  for (const f of files) {
    let html = fs.readFileSync(path.join(BASE, f.input), 'utf8');
    // Replace Google Fonts with system font stack (no internet needed)
    html = html.replace(/<link[^>]*fonts\.googleapis\.com[^>]*>/g, '');
    html = html.replace(/font-family:\s*['"]Heebo['"],\s*sans-serif/g, "font-family: 'Segoe UI', Arial, sans-serif");
    html = html.replace(/font-family:\s*['"]Heebo['"][^;]*/g, "font-family: Arial, sans-serif");
    html = html.replace(/'Heebo',\s*sans-serif/g, "Arial, sans-serif");

    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(BASE, f.output), type: 'png', clip: { x: 0, y: 0, width: 390, height: 844 } });
    await page.close();
    console.log(`✓ ${f.output}`);
  }

  await browser.close();
})();
