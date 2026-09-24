import { expect, type Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';

/**
 * The library's blessed fixtures, read from the installed package so they are
 * pinned by bun.lock and cannot drift from the code under test. bun installs
 * the whole git repo, not just `dist/`.
 */
export const LIB_ROOT = fileURLToPath(
	new URL('../node_modules/@correlaid/formtransform/', import.meta.url)
);

export const fixture = (name: string) =>
	fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

export interface GoldenCase {
	name: string;
	dir: string;
	/** Absolute path to an XLSForm workbook (given, or generated from xlsform.json). */
	xlsx: string;
	tsv: string | null;
	ddi: string | null;
}

type Rows = Record<string, unknown>[];

/** Write `{survey, choices, settings}` JSON as an XLSForm workbook. */
function jsonToXlsx(jsonPath: string, outPath: string): string {
	const form = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as Record<string, Rows | undefined>;
	const wb = XLSX.utils.book_new();
	// survey and choices are required sheets even when empty.
	const headers: Record<string, string[]> = {
		survey: ['type', 'name', 'label'],
		choices: ['list_name', 'name', 'label']
	};
	for (const sheet of ['survey', 'choices', 'settings']) {
		const rows = form[sheet] ?? [];
		if (!rows.length && !headers[sheet]) continue;
		const ws = rows.length
			? XLSX.utils.json_to_sheet(rows)
			: XLSX.utils.aoa_to_sheet([headers[sheet]]);
		XLSX.utils.book_append_sheet(wb, ws, sheet);
	}
	fs.mkdirSync(path.dirname(outPath), { recursive: true });
	fs.writeFileSync(outPath, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
	return outPath;
}

const GENERATED = fileURLToPath(new URL('../test-results/.golden-xlsx/', import.meta.url));

function readIf(p: string): string | null {
	return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : null;
}

function discover(root: string, formDir: (dir: string) => string, group: string): GoldenCase[] {
	if (!fs.existsSync(root)) {
		throw new Error(`${root} not found — is @correlaid/formtransform installed from git?`);
	}
	const cases: GoldenCase[] = [];
	for (const name of fs.readdirSync(root).sort()) {
		const dir = path.join(root, name);
		if (!fs.statSync(dir).isDirectory()) continue;
		const src = formDir(dir);
		const given = path.join(src, 'xlsform.xlsx');
		const json = path.join(src, 'xlsform.json');
		let xlsx: string;
		if (fs.existsSync(given)) xlsx = given;
		else if (fs.existsSync(json))
			xlsx = jsonToXlsx(json, path.join(GENERATED, group, `${name}.xlsx`));
		else continue;
		cases.push({
			name,
			dir,
			xlsx,
			tsv: readIf(path.join(dir, 'tsv.tsv')),
			ddi: readIf(path.join(dir, 'ddi.xml'))
		});
	}
	return cases;
}

/** One folder per registered question type: fixtures/xlsform.json, tsv.tsv, ddi.xml. */
export const registryCases = () =>
	discover(
		path.join(LIB_ROOT, 'registry', 'entities'),
		(d) => path.join(d, 'fixtures'),
		'registry'
	);

/** Whole-survey fixtures: xlsform.{json,xlsx}, tsv.tsv, ddi.xml. */
export const surveyCases = () =>
	discover(path.join(LIB_ROOT, 'tests', 'fixtures', 'surveys'), (d) => d, 'surveys');

/** `prodDate` is the build-time wall clock. */
export const scrubProdDate = (xml: string) =>
	xml.replace(/<prodDate[^>]*>[^<]*<\/prodDate>/g, '<prodDate/>');

/** Open the page and wait for hydration; file inputs only react after it. */
export async function openApp(page: Page) {
	await page.goto('/');
	await page.waitForLoadState('networkidle');
}

export async function openTab(page: Page, name: 'tsv' | 'kobo' | 'lime') {
	const index = { tsv: 0, kobo: 1, lime: 2 }[name];
	await page.getByRole('tab').nth(index).click();
}

/**
 * Set a file input and wait until the app has taken it (Convert enabled).
 * Before hydration the input accepts the file but no handler runs, so retry.
 */
export async function upload(page: Page, selector: string, file: string) {
	await expect(async () => {
		await page.locator(selector).setInputFiles(file);
		await expect(page.locator('.convert-btn')).toBeEnabled({ timeout: 1000 });
	}).toPass({ timeout: 15_000 });
}

export async function convert(page: Page) {
	await page.locator('.convert-btn').click();
	await expect(page.locator('.result-box, .error').first()).toBeVisible();
}

/** Click a download button and return the file's name and text. */
export async function download(page: Page, buttonIndex = 0) {
	const [dl] = await Promise.all([
		page.waitForEvent('download'),
		page.locator('.download-btn').nth(buttonIndex).click()
	]);
	const file = await dl.path();
	return { name: dl.suggestedFilename(), text: fs.readFileSync(file, 'utf-8') };
}

/** Fill the "advanced options" title field on a DDI tab. */
export async function setTitle(page: Page, title: string) {
	await page.locator('details.options-section summary').click();
	await page.locator('.title-input input').fill(title);
}
