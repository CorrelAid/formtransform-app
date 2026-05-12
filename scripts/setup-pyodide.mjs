#!/usr/bin/env node
// Stage Pyodide + survey2ddi wheel into static/ for offline/local loading.
import { mkdirSync, copyFileSync, existsSync, createWriteStream } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pyodideSrc = join(root, 'node_modules', 'pyodide');
const pyodideDst = join(root, 'static', 'pyodide');
const wheelsDst = join(root, 'static', 'wheels');

const WHEEL_URL =
	'https://files.pythonhosted.org/packages/a4/5b/a507db74bd867af0f60a18da040949cc24b2623df42d034f1237a7612839/survey2ddi-0.3.0-py3-none-any.whl';
const WHEEL_NAME = 'survey2ddi-0.3.0-py3-none-any.whl';

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
console.log(`[setup-pyodide] copied ${PYODIDE_FILES.length} files → static/pyodide/`);

const wheelPath = join(wheelsDst, WHEEL_NAME);
if (existsSync(wheelPath)) {
	console.log(`[setup-pyodide] wheel cached: ${WHEEL_NAME}`);
} else {
	console.log(`[setup-pyodide] downloading ${WHEEL_NAME}…`);
	const res = await fetch(WHEEL_URL);
	if (!res.ok) {
		console.error(`[setup-pyodide] failed: ${res.status}`);
		process.exit(1);
	}
	const buf = Buffer.from(await res.arrayBuffer());
	const out = createWriteStream(wheelPath);
	out.write(buf);
	out.end();
	console.log(`[setup-pyodide] saved → static/wheels/${WHEEL_NAME}`);
}
