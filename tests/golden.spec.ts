/**
 * Golden parity through the GUI: upload the library's own fixtures, download
 * what the app produces, compare with the library's blessed outputs.
 *
 * The library tests the converters; these tests prove the app wires them up
 * the same way (config defaults, validation on, title → assetName, the bytes
 * the download button writes).
 */
import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { XLSLoader, buildDdiXml, lstsvToDdiXml } from '@correlaid/formtransform';
import {
	convert,
	download,
	openApp,
	openTab,
	registryCases,
	scrubProdDate,
	setTitle,
	surveyCases,
	upload
} from './helpers';

/** The TSV download adds a UTF-8 BOM and CRLF line endings for LimeSurvey. */
function fromTsvDownload(text: string) {
	expect(text.charCodeAt(0), 'TSV download starts with a BOM').toBe(0xfeff);
	return text.slice(1).replace(/\r\n/g, '\n');
}

test.beforeEach(async ({ page }) => {
	await openApp(page);
});

for (const c of registryCases()) {
	test.describe(`registry type: ${c.name}`, () => {
		test('XLSForm → TSV matches blessed tsv.tsv', async ({ page }) => {
			test.skip(!c.tsv, 'no blessed tsv.tsv');
			await upload(page, '#file-input', c.xlsx);
			await convert(page);
			await expect(page.locator('.error')).toHaveCount(0);
			const { name, text } = await download(page);
			expect(name).toBe(`${c.name}.txt`);
			expect(fromTsvDownload(text)).toBe(c.tsv);
		});

		test('Kobo → DDI matches blessed ddi.xml', async ({ page }) => {
			test.skip(!c.ddi, 'no blessed ddi.xml');
			await openTab(page, 'kobo');
			await upload(page, '#kobo-xlsx', c.xlsx);
			await setTitle(page, c.name);
			await convert(page);
			await expect(page.locator('.error')).toHaveCount(0);
			const { name, text } = await download(page);
			expect(name).toBe('survey.xml');
			expect(scrubProdDate(text)).toBe(scrubProdDate(c.ddi!));
		});

		test('LimeSurvey → DDI matches blessed ddi.xml', async ({ page }) => {
			test.skip(!c.tsv || !c.ddi, 'needs tsv.tsv and ddi.xml');
			await openTab(page, 'lime');
			await upload(page, '#lime-tsv', path.join(c.dir, 'tsv.tsv'));
			await setTitle(page, c.name);
			await convert(page);
			await expect(page.locator('.error')).toHaveCount(0);
			const { text } = await download(page);
			expect(scrubProdDate(text)).toBe(scrubProdDate(c.ddi!));
		});
	});
}

for (const c of surveyCases()) {
	test.describe(`survey fixture: ${c.name}`, () => {
		// The app validates (the library's own snapshots skip validation), so
		// the oracle is: whatever the strict loader decides, the GUI shows.
		let rejection: string | null = null;
		let parsed: ReturnType<typeof XLSLoader.parseXLSData> | null = null;
		try {
			parsed = XLSLoader.parseXLSData(fs.readFileSync(c.xlsx));
		} catch (e) {
			rejection = (e as Error).message;
		}

		test('XLSForm → TSV: blessed output, or the validator’s rejection', async ({ page }) => {
			await upload(page, '#file-input', c.xlsx);
			await convert(page);
			if (rejection) {
				await expect(page.locator('.error')).toContainText(rejection.split('\n')[0]);
				await expect(page.locator('.result-box')).toHaveCount(0);
				return;
			}
			test.skip(!c.tsv, 'no blessed tsv.tsv');
			const { text } = await download(page);
			expect(fromTsvDownload(text)).toBe(c.tsv);
		});

		test('Kobo → DDI: same XML as the library, or the rejection', async ({ page }) => {
			await openTab(page, 'kobo');
			await upload(page, '#kobo-xlsx', c.xlsx);
			await setTitle(page, c.name);
			await convert(page);
			if (rejection) {
				await expect(page.locator('.error')).toContainText(rejection.split('\n')[0]);
				return;
			}
			const { surveyData, choicesData, settingsData } = parsed!;
			const expected = settingsData.length
				? buildDdiXml(surveyData, choicesData, { assetName: c.name, settings: settingsData[0] })
				: c.ddi!;
			const { text } = await download(page);
			expect(scrubProdDate(text)).toBe(scrubProdDate(expected));
		});

		test('LimeSurvey → DDI: same XML as the library', async ({ page }) => {
			test.skip(!c.tsv, 'no blessed tsv.tsv');
			await openTab(page, 'lime');
			await upload(page, '#lime-tsv', path.join(c.dir, 'tsv.tsv'));
			await setTitle(page, c.name);
			await convert(page);
			await expect(page.locator('.error')).toHaveCount(0);
			const { text } = await download(page);
			expect(scrubProdDate(text)).toBe(scrubProdDate(lstsvToDdiXml(c.tsv!, { assetName: c.name })));
		});
	});
}
