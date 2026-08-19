import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';

const url = process.argv[2];
const tsvPath = process.argv[3];
const outFile = process.argv[4];

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
	if (m.type() === 'error') errors.push(`console.error: ${m.text()}`);
});

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForSelector('button[role="tab"]');
await page.waitForTimeout(1000);

// Click DE locale
await page.getByRole('button', { name: 'DE', exact: true }).click();
await page.waitForTimeout(500);

// Click the third tab (LimeSurvey → DDI)
const tabs = page.locator('button[role="tab"]');
const tabCount = await tabs.count();
console.log(`tab count: ${tabCount}`);
for (let i = 0; i < tabCount; i++) {
	console.log(`  tab[${i}]: ${await tabs.nth(i).textContent()}`);
}
await tabs.nth(2).click();

await page.waitForSelector('#lime-tsv', { state: 'attached', timeout: 10_000 });
await page.locator('#lime-tsv').setInputFiles(tsvPath);
await page.waitForTimeout(500);

// Debug: list all buttons in the form
const allBtns = await page.locator('button').allTextContents();
console.log(`all buttons: ${JSON.stringify(allBtns)}`);

const convertBtn = page.getByRole('button', { name: /DDI[- ]Metadaten erzeugen|Generate DDI metadata/i });
const convertCount = await convertBtn.count();
console.log(`convert buttons matching regex: ${convertCount}`);
const btnDisabled = await convertBtn.isDisabled();
console.log(`convert button disabled after upload: ${btnDisabled}`);

await convertBtn.click();

try {
	await page.waitForSelector('.result-box, .error', { timeout: 30_000 });
} catch (e) {
	console.log('timeout. console errors:');
	for (const e2 of errors) console.log('  ', e2);
	throw e;
}

const errCount = await page.locator('.error').count();
const resultCount = await page.locator('.result-box').count();
if (errCount > 0) {
	const errText = await page.locator('.error').first().textContent();
	await writeFile(outFile, `ERROR: ${errText ?? ''}`, 'utf8');
	console.log(`wrote ERROR (${errText?.length ?? 0} chars)`);
} else if (resultCount > 0) {
	const xml = await page.locator('.result-box pre.tsv-preview').first().textContent();
	await writeFile(outFile, xml ?? '', 'utf8');
	console.log(`wrote ${xml?.length ?? 0} chars`);
}

if (errors.length) {
	console.error('page errors:', errors);
}

await browser.close();
