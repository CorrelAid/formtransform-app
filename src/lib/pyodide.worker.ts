/// <reference lib="webworker" />
// Pyodide host worker (ESM). Receives {id, cmd, ...args}, replies with progress + result.

import config from '../../pyodide.config.json';

const wheelUrlMap = import.meta.glob('./wheels/*.whl', {
	eager: true,
	query: '?url',
	import: 'default'
}) as Record<string, string>;
const SURVEY2DDI_WHEEL_URL = Object.values(wheelUrlMap)[0];
if (!SURVEY2DDI_WHEEL_URL) throw new Error('survey2ddi wheel not found in src/lib/wheels/');

const PYODIDE_INDEX = '/pyodide/';
const PYODIDE_PACKAGE_BASE = `https://cdn.jsdelivr.net/pyodide/v${config.pyodideVersion}/full/`;

declare const self: DedicatedWorkerGlobalScope;

type PyodideInterface = {
	FS: { writeFile: (path: string, data: Uint8Array | string) => void };
	loadPackage: (names: string | string[]) => Promise<void>;
	runPythonAsync: (code: string) => Promise<unknown>;
	globals: { set: (k: string, v: unknown) => void };
};

type PyodideLoader = (opts: {
	indexURL: string;
	packageBaseUrl?: string;
}) => Promise<PyodideInterface>;

let initPromise: Promise<PyodideInterface> | null = null;

function post(id: number, payload: object) {
	self.postMessage({ id, ...payload });
}

async function ensureReady(id: number): Promise<PyodideInterface> {
	if (!initPromise) {
		initPromise = (async () => {
			post(id, { type: 'progress', msg: 'Loading Python runtime…' });
			const mod = (await import(/* @vite-ignore */ `${PYODIDE_INDEX}pyodide.mjs`)) as {
				loadPyodide: PyodideLoader;
			};
			const instance = await mod.loadPyodide({
				indexURL: PYODIDE_INDEX,
				packageBaseUrl: PYODIDE_PACKAGE_BASE
			});
			post(id, { type: 'progress', msg: 'Installing micropip…' });
			await instance.loadPackage('micropip');
			post(id, { type: 'progress', msg: 'Installing survey2ddi…' });
			const wheelAbsUrl = new URL(SURVEY2DDI_WHEEL_URL, self.location.origin).href;
			await instance.runPythonAsync(`
import micropip
await micropip.install("xlrd>=2.0.2", reinstall=True)
await micropip.install([
    "openpyxl",
    "httpx",
    "python-dotenv",
], keep_going=True)
await micropip.install("${wheelAbsUrl}")
`);
			return instance;
		})().catch((e) => {
			initPromise = null;
			throw e;
		});
	}
	return initPromise;
}

async function runKobo(
	id: number,
	xlsx: Uint8Array,
	csv: Uint8Array | null,
	title: string
): Promise<{ xml: string; csv: string | null }> {
	const p = await ensureReady(id);
	post(id, { type: 'progress', msg: 'Transforming…' });
	p.FS.writeFile('/tmp/form.xlsx', xlsx);
	p.globals.set('S2D_TITLE', title);
	p.globals.set('S2D_HAS_DATA', csv !== null);
	if (csv) p.FS.writeFile('/tmp/data.csv', csv);
	await p.runPythonAsync(`
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
	const xml = (await p.runPythonAsync('_xml')) as string;
	const csvOut = ((await p.runPythonAsync('_csv')) as string | null) ?? null;
	return { xml, csv: csvOut };
}

async function runLimesurvey(
	id: number,
	xlsx: Uint8Array,
	csv: Uint8Array,
	title: string
): Promise<{ xml: string; csv: string }> {
	const p = await ensureReady(id);
	post(id, { type: 'progress', msg: 'Transforming…' });
	p.FS.writeFile('/tmp/form.xlsx', xlsx);
	p.FS.writeFile('/tmp/data.csv', csv);
	p.globals.set('S2D_TITLE', title);
	await p.runPythonAsync(`
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
	const xml = (await p.runPythonAsync('_xml')) as string;
	const csvOut = (await p.runPythonAsync('_csv')) as string;
	return { xml, csv: csvOut };
}

self.onmessage = async (e: MessageEvent) => {
	const { id, cmd, xlsx, csv, title } = e.data as {
		id: number;
		cmd: 'kobo' | 'limesurvey';
		xlsx: Uint8Array;
		csv: Uint8Array | null;
		title: string;
	};
	try {
		const result =
			cmd === 'kobo' ? await runKobo(id, xlsx, csv, title) : await runLimesurvey(id, xlsx, csv!, title);
		post(id, { type: 'result', result });
	} catch (err) {
		post(id, { type: 'error', error: String(err) });
	}
};
