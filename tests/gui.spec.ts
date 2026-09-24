/** Behaviour of the UI itself: states, wiring of options, keyboard, layout. */
import { test, expect, type Page } from '@playwright/test';
import * as path from 'node:path';
import { LIB_ROOT, convert, download, fixture, openApp, openTab, upload } from './helpers';

const REJECTED_XLSX = path.join(LIB_ROOT, 'tests/fixtures/surveys/all_types_survey/xlsform.xlsx');

test.beforeEach(async ({ page }) => {
	await openApp(page);
});

test('tabs: one selected at a time, each shows its own inputs', async ({ page }) => {
	const tabs = page.getByRole('tab');
	await expect(tabs).toHaveCount(3);
	const inputs = ['#file-input', '#kobo-xlsx', '#lime-tsv'];
	for (let i = 0; i < 3; i++) {
		await tabs.nth(i).click();
		for (let j = 0; j < 3; j++) {
			await expect(tabs.nth(j)).toHaveAttribute('aria-selected', String(i === j));
			await expect(page.locator(inputs[j])).toHaveCount(i === j ? 1 : 0);
		}
	}
});

test('Convert stays disabled until a file is chosen, on every tab', async ({ page }) => {
	for (const tab of ['tsv', 'kobo', 'lime'] as const) {
		await openTab(page, tab);
		await expect(page.locator('.convert-btn')).toBeDisabled();
	}
});

test('Kobo tab switches from metadata to full mode when a CSV is added', async ({ page }) => {
	await openTab(page, 'kobo');
	const banner = page.locator('.mode-banner');
	await expect(banner).toHaveClass(/mode-metadata/);
	await upload(page, '#kobo-xlsx', fixture('minimal.xlsx'));
	await page.locator('#kobo-csv').setInputFiles(fixture('kobo-comma.csv'));
	await expect(banner).toHaveClass(/mode-full/);
	await convert(page);
	// Full mode offers the XML and the data CSV.
	await expect(page.locator('.download-btn')).toHaveCount(2);
	const csv = await download(page, 1);
	expect(csv.name).toBe('survey.csv');
	expect(csv.text).toBe('consent,name\r\nyes,Alice\r\nno,Bob\r\n');
});

test('a form outside the CDL subset is rejected with a message, no result', async ({ page }) => {
	await upload(page, '#file-input', REJECTED_XLSX);
	await convert(page);
	await expect(page.locator('.error')).toContainText('LimeSurvey cannot represent');
	await expect(page.locator('.result-box')).toHaveCount(0);
	await expect(page.locator('.download-btn')).toHaveCount(0);
});

test('choosing a new file clears the previous result', async ({ page }) => {
	await upload(page, '#file-input', fixture('minimal.xlsx'));
	await convert(page);
	await expect(page.locator('.result-box')).toBeVisible();
	await page.locator('#file-input').setInputFiles(REJECTED_XLSX);
	await expect(page.locator('.result-box')).toHaveCount(0);
});

test('result header counts questions and groups', async ({ page }) => {
	await upload(page, '#file-input', fixture('minimal.xlsx'));
	await convert(page);
	await expect(page.locator('.result-stats')).toHaveText(/^2\s+Fragen, 1 Gruppe$/);
});

async function tsvWithOption(page: Page, label: RegExp, checked: boolean) {
	await page.locator('details.options-section summary').click();
	await page.getByRole('checkbox', { name: label }).setChecked(checked);
	await upload(page, '#file-input', fixture('minimal.xlsx'));
	await convert(page);
	return (await download(page)).text;
}

test('options are passed to the converter: hide question tips', async ({ page }) => {
	const on = await tsvWithOption(page, /Fragetipps ausblenden/, true);
	expect(on.split('\r\n')[0]).toContain('hide_tip');
	await openApp(page);
	const off = await tsvWithOption(page, /Fragetipps ausblenden/, false);
	expect(off.split('\r\n')[0]).not.toContain('hide_tip');
});

test('options are passed to the converter: hide "no answer"', async ({ page }) => {
	const on = await tsvWithOption(page, /Keine Antwort/, true);
	expect(on).toContain('\tshownoanswer\t');
	await openApp(page);
	const off = await tsvWithOption(page, /Keine Antwort/, false);
	expect(off).not.toContain('\tshownoanswer\t');
});

test('keyboard: tabs are reachable and activate with Enter', async ({ page }) => {
	const kobo = page.getByRole('tab').nth(1);
	await kobo.focus();
	await expect(kobo).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(kobo).toHaveAttribute('aria-selected', 'true');
	await expect(page.locator('#kobo-xlsx')).toHaveCount(1);
});

test('scope notice links to the supported subset', async ({ page }) => {
	await expect(page.locator('.scope-notice a')).toHaveAttribute(
		'href',
		'https://github.com/CorrelAid/formtransform#supported-xlsform-subset'
	);
});

test('imprint renders the liability text', async ({ page }) => {
	await page.goto('/imprint');
	// Fetched from cdl-wp-eins at dev-server start; empty when the GitHub API
	// rate limit is exhausted (set GITHUB_TOKEN).
	await expect(page.locator('main'), 'liability snippet missing').toContainText(/Haftung/);
});

test.describe('mobile (375 px)', () => {
	test.use({ viewport: { width: 375, height: 740 } });

	for (const tab of ['tsv', 'kobo', 'lime'] as const) {
		test(`${tab} tab: no horizontal scroll, Convert visible`, async ({ page }) => {
			await openTab(page, tab);
			const overflow = await page.evaluate(
				() => document.documentElement.scrollWidth - document.documentElement.clientWidth
			);
			expect(overflow).toBeLessThanOrEqual(0);
			// Below the fold is fine; clipped sideways is not.
			const btn = page.locator('.convert-btn');
			await btn.scrollIntoViewIfNeeded();
			await expect(btn).toBeInViewport({ ratio: 1 });
		});
	}

	test('TSV result preview scrolls inside its box, not the page', async ({ page }) => {
		await upload(page, '#file-input', fixture('minimal.xlsx'));
		await convert(page);
		await page.locator('.result-box details summary').click();
		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth - document.documentElement.clientWidth
		);
		expect(overflow).toBeLessThanOrEqual(0);
	});
});
