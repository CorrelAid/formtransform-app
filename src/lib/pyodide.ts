// Lazy Pyodide loader + survey2ddi install. Singleton.

// Pyodide core served from /static (staged by scripts/setup-pyodide.mjs).
// Bundled packages (micropip etc.) fetched from CDN — too many to ship locally.
const PYODIDE_VERSION = '0.29.4';
const PYODIDE_CDN = '/pyodide/';
const PYODIDE_PACKAGE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const SURVEY2DDI_WHEEL_URL = '/wheels/survey2ddi-0.3.0-py3-none-any.whl';

type PyodideInterface = {
	FS: {
		writeFile: (path: string, data: Uint8Array | string) => void;
		readFile: (path: string, opts?: { encoding: string }) => string | Uint8Array;
		mkdir: (path: string) => void;
	};
	loadPackage: (names: string | string[]) => Promise<void>;
	runPythonAsync: (code: string) => Promise<unknown>;
	pyimport: (name: string) => unknown;
	globals: { get: (k: string) => unknown; set: (k: string, v: unknown) => void };
};

declare global {
	interface Window {
		loadPyodide: (opts: {
			indexURL: string;
			packageBaseUrl?: string;
		}) => Promise<PyodideInterface>;
	}
}

let instance: Promise<PyodideInterface> | null = null;

export type ProgressFn = (msg: string) => void;

async function loadScript(src: string): Promise<void> {
	return new Promise((resolve, reject) => {
		if (document.querySelector(`script[src="${src}"]`)) return resolve();
		const s = document.createElement('script');
		s.src = src;
		s.onload = () => resolve();
		s.onerror = () => reject(new Error(`Failed to load ${src}`));
		document.head.appendChild(s);
	});
}

export function getPyodide(onProgress?: ProgressFn): Promise<PyodideInterface> {
	if (instance) return instance;
	instance = (async () => {
		onProgress?.('Loading Python runtime…');
		await loadScript(`${PYODIDE_CDN}pyodide.js`);
		const py = await window.loadPyodide({
			indexURL: PYODIDE_CDN,
			packageBaseUrl: PYODIDE_PACKAGE_BASE
		});
		onProgress?.('Installing micropip…');
		await py.loadPackage('micropip');
		onProgress?.('Installing survey2ddi…');
		await py.runPythonAsync(`
import micropip
await micropip.install("xlrd>=2.0.2", reinstall=True)
await micropip.install([
    "openpyxl",
    "httpx",
    "python-dotenv",
], keep_going=True)
await micropip.install("${SURVEY2DDI_WHEEL_URL}")
`);
		onProgress?.('Ready.');
		return py;
	})().catch((e) => {
		instance = null;
		throw e;
	});
	return instance;
}

export async function runKobo2Ddi(
	xlsxBytes: Uint8Array,
	csvBytes: Uint8Array | null,
	titleOverride: string,
	onProgress?: ProgressFn
): Promise<{ xml: string; csv: string | null }> {
	const py = await getPyodide(onProgress);
	onProgress?.('Transforming…');
	py.FS.writeFile('/tmp/form.xlsx', xlsxBytes);
	py.globals.set('S2D_TITLE', titleOverride);
	py.globals.set('S2D_HAS_DATA', csvBytes !== null);
	if (csvBytes) py.FS.writeFile('/tmp/data.csv', csvBytes);
	await py.runPythonAsync(`
import csv
from pathlib import Path
from survey2ddi_core.xlsform import parse_xlsform, extract_variables, resolve_title
from survey2ddi_core.ddi_xml import build_ddi_xml
from survey2ddi_core.data import build_data_csv

survey_rows, choices_by_list, settings = parse_xlsform(Path('/tmp/form.xlsx'))
_title = resolve_title(S2D_TITLE, settings, fallback='Untitled')

if S2D_HAS_DATA:
    with open('/tmp/data.csv', encoding='utf-8-sig') as f:
        submissions = list(csv.DictReader(f, delimiter=';'))
        if not submissions or not any('/' in k for k in submissions[0].keys()):
            f.seek(0)
            submissions = list(csv.DictReader(f, delimiter=','))
    _xml = build_ddi_xml(_title, survey_rows, choices_by_list, settings, submissions, dataset_filename='data.csv')
    _csv = build_data_csv(extract_variables(survey_rows, choices_by_list), submissions)
else:
    _xml = build_ddi_xml(_title, survey_rows, choices_by_list, settings, [])
    _csv = None
`);
	const xml = (await py.runPythonAsync('_xml')) as string;
	const csv = (await py.runPythonAsync('_csv')) as string | null;
	return { xml, csv };
}

export async function runLimesurvey2Ddi(
	xlsxBytes: Uint8Array,
	csvBytes: Uint8Array,
	title: string,
	onProgress?: ProgressFn
): Promise<{ xml: string; csv: string }> {
	const py = await getPyodide(onProgress);
	onProgress?.('Transforming…');
	py.FS.writeFile('/tmp/form.xlsx', xlsxBytes);
	py.FS.writeFile('/tmp/data.csv', csvBytes);
	py.globals.set('S2D_TITLE', title);
	await py.runPythonAsync(`
import csv
from pathlib import Path
from limesurvey2ddi.transform import build_ddi_xml, build_data_csv

with open('/tmp/data.csv', encoding='utf-8-sig') as f:
    responses = list(csv.DictReader(f, delimiter=';'))
    if not responses or not any('[' in k or k.lower() == 'id' for k in responses[0].keys()):
        f.seek(0)
        responses = list(csv.DictReader(f, delimiter=','))

_xml = build_ddi_xml(S2D_TITLE, Path('/tmp/form.xlsx'), responses, dataset_filename='data.csv')
_csv = build_data_csv(Path('/tmp/form.xlsx'), responses)
`);
	const xml = (await py.runPythonAsync('_xml')) as string;
	const csv = (await py.runPythonAsync('_csv')) as string;
	return { xml, csv };
}
