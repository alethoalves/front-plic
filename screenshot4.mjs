import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('http://localhost:3000/evento/cicdf/publicacoes', { waitUntil: 'load', timeout: 20000 });
await page.waitForTimeout(800);
await page.screenshot({ path: 'serie-publicacoes.png' });
console.log('done');
await browser.close();
