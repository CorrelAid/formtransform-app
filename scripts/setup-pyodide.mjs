#!/usr/bin/env node
// Stage Pyodide core (static/pyodide) + survey2ddi wheel (src/lib/wheels)
// using versions pinned in pyodide.config.json. Wheel URL is resolved
// dynamically from PyPI to avoid hardcoding hashed CDN paths.
import {
	mkdirSync,
	copyFileSync,
	existsSync,
	readdirSync,
	unlinkSync,
	writeFileSync,
	readFileSync
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(join(root, 'pyodide.config.json'), 'utf8'));

const pyodideSrc = join(root, 'node_modules', 'pyodide');
const pyodideDst = join(root, 'static', 'pyodide');
const wheelsDst = join(root, 'src', 'lib', 'wheels');

const PYODIDE_FILES = [
	'pyodide.js',
	'pyodide.mjs',
	'pyodide.asm.js',
	'pyodide.asm.wasm',
	'pyodide-lock.json',
	'python_stdlib.zip'
];

if (!existsSync(pyodideSrc)) {
	console.error('[setup-pyodide] node_modules/pyodide missing — run install first');
	process.exit(1);
}

mkdirSync(pyodideDst, { recursive: true });
mkdirSync(wheelsDst, { recursive: true });

for (const f of PYODIDE_FILES) {
	copyFileSync(join(pyodideSrc, f), join(pyodideDst, f));
}
console.log(
	`[setup-pyodide] copied ${PYODIDE_FILES.length} Pyodide ${config.pyodideVersion} files → static/pyodide/`
);

const wheelName = `survey2ddi-${config.survey2ddiVersion}-py3-none-any.whl`;
const wheelPath = join(wheelsDst, wheelName);

if (existsSync(wheelPath)) {
	console.log(`[setup-pyodide] wheel cached: ${wheelName}`);
} else {
	for (const f of readdirSync(wheelsDst)) {
		if (f.startsWith('survey2ddi-') && f.endsWith('.whl')) {
			unlinkSync(join(wheelsDst, f));
			console.log(`[setup-pyodide] removed stale ${f}`);
		}
	}

	const pypiUrl = `https://pypi.org/pypi/survey2ddi/${config.survey2ddiVersion}/json`;
	console.log(`[setup-pyodide] resolving wheel from ${pypiUrl}`);
	const meta = await fetch(pypiUrl).then((r) => {
		if (!r.ok) throw new Error(`PyPI ${r.status}`);
		return r.json();
	});
	const wheel = meta.urls.find((u) => u.packagetype === 'bdist_wheel');
	if (!wheel) throw new Error('no bdist_wheel on PyPI');

	console.log(`[setup-pyodide] downloading ${wheelName}…`);
	const buf = Buffer.from(await fetch(wheel.url).then((r) => r.arrayBuffer()));
	writeFileSync(wheelPath, buf);
	console.log(`[setup-pyodide] saved → src/lib/wheels/${wheelName}`);
}
