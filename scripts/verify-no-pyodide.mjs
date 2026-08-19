import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';

const url = process.argv[2];
const xlsxPath = process.argv[3];

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

const networkAfterClick = [];
let clicked = false;

page.on('request', (req) => {
	if (clicked) networkAfterClick.push(req.url());
});

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForSelector('button[role="tab"]');
await page.waitForTimeout(1000);
await page.locator('button[role="tab"]').nth(1).click();
await page.waitForSelector('#kobo-xlsx', { state: 'attached' });

clicked = true;
await page.locator('#kobo-xlsx').setInputFiles(xlsxPath);
await page.waitForTimeout(500);
await page.getByRole('button', { name: /DDI metadata/i }).click();

await page.waitForSelector('.result-box, .error', { timeout: 30_000 });

console.log(`network requests during metadata conversion: ${networkAfterClick.length}`);
for (const u of networkAfterClick) console.log(`  ${u}`);

const pyodide = networkAfterClick.filter((u) => /pyodide|\.whl/i.test(u));
console.log(`pyodide/whl requests: ${pyodide.length}`);

await browser.close();
