import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';

const url = process.argv[2];
const xlsxPath = process.argv[3];
const outFile = process.argv[4];

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

const errors = [];
const logs = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
	const t = m.type();
	const txt = m.text();
	logs.push(`[${t}] ${txt}`);
	if (t === 'error') errors.push(`console.error: ${txt}`);
});
page.on('requestfailed', (req) => {
	errors.push(`requestfailed: ${req.url()} -- ${req.failure()?.errorText}`);
});
page.on('worker', (worker) => {
	console.log(`worker spawned: ${worker.url()}`);
	worker.on('console', (m) => {
		logs.push(`[worker:${m.type()}] ${m.text()}`);
	});
});

await page.goto(url, { waitUntil: 'networkidle' });

// Wait for the tab nav to be present AND hydrated
await page.waitForSelector('button[role="tab"]', { timeout: 10_000 });
await page.waitForTimeout(1000); // let Svelte 5 hydrate

// Click the Kobo tab (the second tab button in the page)
const tabs = page.locator('button[role="tab"]');
const tabCount = await tabs.count();
console.log(`tab count: ${tabCount}`);
for (let i = 0; i < tabCount; i++) {
	const txt = await tabs.nth(i).textContent();
	console.log(`  tab[${i}]: ${txt}`);
}
await tabs.nth(1).click();
await page.waitForSelector('#kobo-xlsx', { state: 'attached', timeout: 10_000 });

// Snapshot the DOM to debug
const debugHtml = await page.content();
await import('node:fs/promises').then((fs) => fs.writeFile('/tmp/debug.html', debugHtml, 'utf8'));
console.log('--- html after click ---');
const main = debugHtml.match(/<main[\s\S]*<\/main>/);
console.log(main ? main[0] : '(no main element found)');

await page.locator('#kobo-xlsx').setInputFiles(xlsxPath);
await page.waitForTimeout(500);

// Debug: is the convert button enabled now?
const btnDisabled = await page.getByRole('button', { name: /DDI metadata/i }).isDisabled();
console.log(`convert button disabled after upload: ${btnDisabled}`);
if (btnDisabled) {
	console.log('--- trying dispatchEvent change ---');
	await page.evaluate(() => {
		const inp = document.getElementById('kobo-xlsx');
		if (inp) inp.dispatchEvent(new Event('change', { bubbles: true }));
	});
	await page.waitForTimeout(500);
	const btnDisabled2 = await page.getByRole('button', { name: /DDI metadata/i }).isDisabled();
	console.log(`convert button disabled after dispatch: ${btnDisabled2}`);
}

// Click convert
await page.getByRole('button', { name: /DDI metadata/i }).click();

// Wait for result-box OR error
try {
	await page.waitForSelector('.result-box, .error', { timeout: 60_000 });
} catch (e) {
	console.log('timeout waiting for result/error.');
	console.log('--- console errors so far ---');
	for (const e2 of errors) console.log('  ', e2);
	console.log('--- all console messages ---');
	for (const l of logs.slice(-50)) console.log('  ', l);
	const errEl = await page.locator('.error').count();
	console.log(`error elements in DOM: ${errEl}`);
	const resultEl = await page.locator('.result-box').count();
	console.log(`result-box elements in DOM: ${resultEl}`);
	throw e;
}

const errCount = await page.locator('.error').count();
const resultCount = await page.locator('.result-box').count();
if (errCount > 0) {
	const errText = await page.locator('.error').first().textContent();
	await writeFile(outFile, `ERROR: ${errText ?? ''}`, 'utf8');
	console.log(`wrote ERROR (${errText?.length ?? 0} chars) to ${outFile}`);
} else if (resultCount > 0) {
	const xml = await page.locator('.result-box pre.tsv-preview').first().textContent();
	await writeFile(outFile, xml ?? '', 'utf8');
	console.log(`wrote ${xml?.length ?? 0} chars to ${outFile}`);
} else {
	await writeFile(outFile, '(no result-box, no error)', 'utf8');
	console.log('wrote (no result-box, no error) to', outFile);
}

if (errors.length) {
	console.error('page errors:', errors);
}

await browser.close();
