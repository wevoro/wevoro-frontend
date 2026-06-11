const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const htmlPath = path.resolve(__dirname, 'features-report.html');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: path.resolve(__dirname, 'Wevoro_Features_Report_SCRUM_60-67.pdf'),
    format: 'A4',
    margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
    printBackground: true,
  });
  await browser.close();
  console.log('✅ PDF created: Wevoro_Features_Report_SCRUM_60-67.pdf');
})();
