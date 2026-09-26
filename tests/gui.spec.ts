/** Behaviour of the UI itself: states, wiring of options, keyboard, layout. */
import { test, expect, type Page } from '@playwright/test';
import * as path from 'node:path';
import {
	LIB_FIXTURES,
	convert,
	download,
	fixture,
	openApp,
	openTab,
	upload,
	writeXlsForm,
	type XlsForm
} from './helpers';

const REJECTED_XLSX = path.join(
	LIB_FIXTURES,
	'tests/fixtures/surveys/all_types_survey/xlsform.xlsx'
);

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

test('Kobo export with BOM, quoted multi-line field and ";" inside quotes', async ({ page }) => {
	await openTab(page, 'kobo');
	await upload(page, '#kobo-xlsx', fixture('minimal.xlsx'));
	await page.locator('#kobo-csv').setInputFiles(fixture('kobo-multiline-bom.csv'));
	await convert(page);
	await expect(page.locator('.error')).toHaveCount(0);
	const csv = await download(page, 1);
	// Two respondents, values intact; the header carries no BOM.
	expect(csv.text).toBe('consent,name\r\nyes,"Alice\nSmith"\r\nno,Bob; Jr.\r\n');
});

test('a form outside the CDL subset is rejected with a message, no result', async ({ page }) => {
	await upload(page, '#file-input', REJECTED_XLSX);
	await convert(page);
	await expect(page.locator('.error')).toContainText(
		'Dieses Formular kann nicht umgewandelt werden'
	);
	// All findings at once, one per list item.
	expect(await page.locator('.error li').count()).toBeGreaterThan(1);
	await expect(page.locator('.result-box')).toHaveCount(0);
	await expect(page.locator('.download-btn')).toHaveCount(0);
});

/** Upload a generated form on the TSV tab and return the error text. */
async function tsvError(page: Page, form: XlsForm) {
	const file = writeXlsForm(form, test.info().outputPath('form.xlsx'));
	await upload(page, '#file-input', file);
	await convert(page);
	await expect(page.locator('.result-box')).toHaveCount(0);
	return page.locator('.error');
}

const often = { type: 'select_one freq', name: 'often', label: 'How often?' };

test('rejects a select whose choice list does not exist, naming the question', async ({ page }) => {
	const error = await tsvError(page, {
		survey: [often],
		choices: [{ list_name: 'other', name: 'a', label: 'A' }]
	});
	await expect(error).toContainText('often');
	await expect(error).toContainText('freq');
});

test('rejects duplicate answer codes in a list, naming the list', async ({ page }) => {
	const error = await tsvError(page, {
		survey: [often],
		choices: [
			{ list_name: 'freq', name: 'a', label: 'Always' },
			{ list_name: 'freq', name: 'a', label: 'Again' }
		]
	});
	await expect(error).toContainText('"a"');
	await expect(error).toContainText('freq');
});

test('Kobo tab keeps Kobo-style names the TSV tab rejects', async ({ page }) => {
	const file = writeXlsForm(
		{
			survey: [{ type: 'select_one freq', name: 'how_often_do_you_visit', label: 'How often?' }],
			choices: [
				{ list_name: 'freq', name: 'sometimes', label: 'Sometimes' },
				{ list_name: 'freq', name: 'never', label: 'Never' }
			]
		},
		test.info().outputPath('kobo.xlsx')
	);
	await upload(page, '#file-input', file);
	await convert(page);
	await expect(page.locator('.error li').first()).toContainText('how_often_do_you_visit');

	await openTab(page, 'kobo');
	await upload(page, '#kobo-xlsx', file);
	await convert(page);
	await expect(page.locator('.error')).toHaveCount(0);
	const { text } = await download(page);
	expect(text).toContain('name="how_often_do_you_visit"');
	expect(text).toContain('sometimes');
});

test('Kobo tab rejects unregistered types, listing each', async ({ page }) => {
	const file = writeXlsForm(
		{
			survey: [
				{ type: 'geopoint', name: 'where', label: 'Where?' },
				{ type: 'image', name: 'photo', label: 'Photo' },
				{ type: 'text', name: 'full_name', label: 'Name' }
			],
			choices: []
		},
		test.info().outputPath('unregistered.xlsx')
	);
	await openTab(page, 'kobo');
	await upload(page, '#kobo-xlsx', file);
	await convert(page);
	const items = page.locator('.error li');
	await expect(items).toHaveCount(2);
	await expect(items.nth(0)).toContainText('geopoint');
	await expect(items.nth(1)).toContainText('image');
	await expect(page.locator('.result-box')).toHaveCount(0);
});

test('converts but lists warnings, e.g. a comparison that is never true', async ({ page }) => {
	const file = writeXlsForm(
		{
			survey: [
				{ type: 'select_one yn', name: 'ok', label: 'OK?' },
				{ type: 'text', name: 'why', label: 'Why?', relevant: "${ok} = 'maybe'" }
			],
			choices: [
				{ list_name: 'yn', name: 'yes', label: 'Yes' },
				{ list_name: 'yn', name: 'no', label: 'No' }
			]
		},
		test.info().outputPath('never-true.xlsx')
	);
	for (const [tab, input] of [
		['tsv', '#file-input'],
		['kobo', '#kobo-xlsx']
	] as const) {
		await openTab(page, tab);
		await upload(page, input, file);
		await convert(page);
		await expect(page.locator('.result-box')).toBeVisible();
		await expect(page.locator('.error')).toHaveCount(0);
		await expect(page.locator('.warnings')).toContainText('bitte diese Punkte prüfen');
		await expect(page.locator('.warnings li')).toContainText(["'maybe' is not one of the choices"]);
	}
});

test('TSV tab lists every problem at once, including a dangling reference', async ({ page }) => {
	const error = await tsvError(page, {
		survey: [
			{ type: 'geopoint', name: 'where', label: 'Where?' },
			{ type: 'text', name: 'full_name', label: 'Name', relevant: '${nope} = 1' }
		],
		choices: []
	});
	await expect(error.locator('li')).toHaveCount(3);
	await expect(error).toContainText('geopoint');
	await expect(error).toContainText('full_name');
	await expect(error).toContainText('nope');
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
			const box = (await page.locator('.convert-btn').boundingBox())!;
			expect(box.x).toBeGreaterThanOrEqual(0);
			expect(box.x + box.width).toBeLessThanOrEqual(375);
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
