// Download the golden fixtures that belong to the installed
// @correlaid/formtransform release, verify the pinned checksum, and unpack
// them to node_modules/.cache/formtransform-fixtures/<version>/.
// Run by `bun run test`; a no-op when that folder already exists.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const pin = JSON.parse(readFileSync(`${root}tests/formtransform-fixtures.json`, 'utf-8'));
const installed = JSON.parse(
	readFileSync(`${root}node_modules/@correlaid/formtransform/package.json`, 'utf-8')
).version;

if (installed !== pin.version) {
	console.error(
		`@correlaid/formtransform is ${installed} but tests/formtransform-fixtures.json pins ` +
			`fixtures for ${pin.version}. Update the pin (url + sha256 from the release).`
	);
	process.exit(1);
}

const dest = `${root}node_modules/.cache/formtransform-fixtures/${pin.version}`;
if (existsSync(dest)) process.exit(0);

const res = await fetch(pin.url);
if (!res.ok) throw new Error(`GET ${pin.url}: ${res.status}`);
const archive = Buffer.from(await res.arrayBuffer());
const sha256 = createHash('sha256').update(archive).digest('hex');
if (sha256 !== pin.sha256) {
	throw new Error(`checksum mismatch for ${pin.url}: got ${sha256}, pinned ${pin.sha256}`);
}

// Unpack next to the destination, then rename, so a failed run leaves nothing half-written.
const tmp = `${dest}.tmp`;
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
writeFileSync(`${tmp}/fixtures.tar.gz`, archive);
execFileSync('tar', ['-xzf', 'fixtures.tar.gz'], { cwd: tmp });
rmSync(`${tmp}/fixtures.tar.gz`);
renameSync(tmp, dest);
console.log(`formtransform fixtures ${pin.version} → ${dest}`);
