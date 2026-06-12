const nodeHtmlToImage = require('node-html-to-image');
const fs = require('fs');
const path = require('path');

const files = [
  { input: 'option1-garage.html', output: 'option1.png' },
  { input: 'option2-minimal.html', output: 'option2.png' },
  { input: 'option3-native.html', output: 'option3.png' },
  { input: 'option4-bold.html', output: 'option4.png' },
];

(async () => {
  for (const f of files) {
    const html = fs.readFileSync(path.join(__dirname, f.input), 'utf8');
    console.log(`Rendering ${f.input}...`);
    await nodeHtmlToImage({
      output: path.join(__dirname, f.output),
      html,
      puppeteerArgs: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
      beforeScreenshot: async (page) => {
        await page.setViewport({ width: 390, height: 844 });
      },
    });
    console.log(`  -> ${f.output} done`);
  }
})();
