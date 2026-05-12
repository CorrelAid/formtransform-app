import { describe, it, expect } from 'vitest';
import { runKobo2Ddi } from './pyodide';
import minimalXlsxUrl from '../../tests/fixtures/minimal.xlsx?url';

async function fetchBytes(url: string): Promise<Uint8Array> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
	return new Uint8Array(await res.arrayBuffer());
}

describe('runKobo2Ddi', () => {
	it('metadata-only mode: emits DDI XML with form_title fallback', { timeout: 120_000 }, async () => {
		const xlsx = await fetchBytes(minimalXlsxUrl);
		const result = await runKobo2Ddi(xlsx, null, '');
		expect(result.csv).toBeFalsy();
		expect(result.xml).toContain('<codeBook');
		expect(result.xml).toContain('<titl>Test Survey</titl>');
		expect(result.xml).toContain('consent');
	});

	it('title override wins over form_title', { timeout: 120_000 }, async () => {
		const xlsx = await fetchBytes(minimalXlsxUrl);
		const result = await runKobo2Ddi(xlsx, null, 'Override Title');
		expect(result.xml).toContain('<titl>Override Title</titl>');
	});
});
