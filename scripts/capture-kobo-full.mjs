import { chromium } from 'playwright';

const url = process.argv[2];
const xlsxPath = process.argv[3];
const csvPath = process.argv[4];
const outFile = process.argv[5];

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

const errors = [];
const netAfterClick = [];
let clicked = false;
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
	if (m.type() === 'error') errors.push(`console.error: ${m.text()}`);
});
page.on('request', (req) => {
	if (clicked) netAfterClick.push(req.url());
});

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForSelector('button[role="tab"]');
await page.waitForTimeout(1000);
const tabs = page.locator('button[role="tab"]');
await tabs.nth(1).click();
await page.waitForSelector('#kobo-xlsx', { state: 'attached' });

clicked = true;
await page.locator('#kobo-xlsx').setInputFiles(xlsxPath);
await page.waitForTimeout(500);
await page.locator('#kobo-csv').setInputFiles(csvPath);
await page.waitForTimeout(500);

// Mode is "full" because both files are set
const convertBtn = page.getByRole('button', { name: /DDI \+ CSV|DDI-Metadaten|DDI metadata/i });
const btnText = await convertBtn.textContent();
console.log(`convert button: "${btnText?.trim()}"`);

await convertBtn.click();
await page.waitForSelector('.result-box, .error', { timeout: 30_000 });

const errCount = await page.locator('.error').count();
const resultCount = await page.locator('.result-box').count();
const pyodide = netAfterClick.filter((u) => /pyodide|\.whl/i.test(u));
const xlsform2lstsv = netAfterClick.filter((u) => /xlsform2lstsv/i.test(u));

let capture = '';
if (errCount > 0) {
	const errText = await page.locator('.error').first().textContent();
	capture = `ERROR: ${errText}\n`;
} else {
	const xml = await page.locator('.result-box pre.tsv-preview').first().textContent();
	capture = `xml(${xml?.length ?? 0}):\n${xml}\n`;
	// Click the CSV download button to get the CSV
	const csvBtn = page.getByRole('button', { name: /CSV herunterladen|Download CSV/i });
	if ((await csvBtn.count()) > 0) {
		const [download] = await Promise.all([
			page.waitForEvent('download'),
			csvBtn.click()
		]);
		const csvPath = await download.path();
		const csv = await (await import('node:fs/promises')).readFile(csvPath, 'utf8');
		capture += `\n---\ncsv(${csv.length}):\n${csv}`;
	}
}

await import('node:fs/promises').then((fs) => fs.writeFile(outFile, capture, 'utf8'));
console.log(`wrote ${capture.length} chars to ${outFile}`);
console.log(`pyodide/whl requests: ${pyodide.length}`);
console.log(`xlsform2lstsv requests: ${xlsform2lstsv.length}`);
if (errors.length) console.error('errors:', errors);

await browser.close();
