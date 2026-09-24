import { test, expect, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const fixture = (name: string) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

const legacyRequests: string[] = [];

test.beforeEach(async ({ page }) => {
	legacyRequests.length = 0;
	page.on('request', (req) => {
		if (/pyodide|\.whl|\.wasm/i.test(req.url())) legacyRequests.push(req.url());
	});
	await page.goto('/');
	// File inputs only react once the page has hydrated.
	await page.waitForLoadState('networkidle');
});

test.afterEach(() => {
	expect(legacyRequests).toEqual([]);
});

async function convert(page: Page) {
	await page.locator('.convert-btn').click();
	await expect(page.locator('.result-box')).toBeVisible();
	await expect(page.locator('.error')).toHaveCount(0);
}

test('page shows the title and the scope notice', async ({ page }) => {
	await expect(page.getByRole('heading', { level: 1, name: 'FormTransform' })).toBeVisible();
	await expect(page.locator('.scope-notice')).toBeVisible();
});

test('XLSForm → LimeSurvey TSV', async ({ page }) => {
	await page.locator('#file-input').setInputFiles(fixture('minimal.xlsx'));
	await convert(page);
	const tsv = page.locator('.result-box pre');
	await expect(tsv).toContainText('Do you consent?');
	await expect(tsv).toContainText('hide_tip');
});

test('Kobo → DDI, metadata only', async ({ page }) => {
	await page.getByRole('tab', { name: 'Kobo → DDI' }).click();
	await page.locator('#kobo-xlsx').setInputFiles(fixture('minimal.xlsx'));
	await convert(page);
	const pres = page.locator('.result-box pre');
	await expect(pres).toHaveCount(1);
	await expect(pres.first()).toContainText('<codeBook');
});

for (const csv of ['kobo-comma.csv', 'kobo-semicolon.csv']) {
	test(`Kobo → DDI, full mode (${csv})`, async ({ page }) => {
		await page.getByRole('tab', { name: 'Kobo → DDI' }).click();
		await page.locator('#kobo-xlsx').setInputFiles(fixture('minimal.xlsx'));
		await page.locator('#kobo-csv').setInputFiles(fixture(csv));
		await convert(page);
		const pres = page.locator('.result-box pre');
		await expect(pres.first()).toContainText('<codeBook');
		expect((await pres.nth(1).textContent())?.split(/\r?\n/)).toEqual([
			'consent,name',
			'yes,Alice',
			'no,Bob',
			''
		]);
	});
}

test('LimeSurvey → DDI', async ({ page }) => {
	await page.getByRole('tab', { name: 'LimeSurvey → DDI' }).click();
	await page.locator('#lime-tsv').setInputFiles(fixture('minimal.tsv'));
	await convert(page);
	await expect(page.locator('.result-box pre')).toContainText('<codeBook');
});
