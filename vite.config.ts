import { defineConfig, type Plugin } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import { cdlTokens } from '@correlaid/cdl-design/vite-plugin';

interface CdlContent {
	formtransform: { en: string; de: string };
	liability: { en: string; de: string };
}

function fetchCdlContent(): Plugin {
	let content: CdlContent = {
		formtransform: { en: '', de: '' },
		liability: { en: '', de: '' }
	};

	function ghHeaders(): Record<string, string> {
		const h: Record<string, string> = { Accept: 'application/vnd.github.raw+json' };
		const token = process.env.GITHUB_TOKEN;
		if (token) h['Authorization'] = `Bearer ${token}`;
		return h;
	}

	async function fetchSnippet(path: string): Promise<string> {
		try {
			const res = await fetch(
				`https://api.github.com/repos/CorrelAid/cdl-wp-eins/contents/src/content/snippets/${path}`,
				{ headers: ghHeaders() }
			);
			if (!res.ok) {
				console.warn(`[cdl-content] Failed to fetch ${path}: ${res.status}`);
				if (!process.env.GITHUB_TOKEN) console.warn('[cdl-content] GITHUB_TOKEN not set — you may hit rate limits');
				return '';
			}
			return res.text();
		} catch (e) {
			console.warn(`[cdl-content] Error fetching ${path}:`, e);
			return '';
		}
	}

	return {
		name: 'cdl-content',
		async buildStart() {
			const [ftEn, ftDe, liEn, liDe] = await Promise.all([
				fetchSnippet('formtransform/en.html'),
				fetchSnippet('formtransform/de.html'),
				fetchSnippet('liability/en.html'),
				fetchSnippet('liability/de.html')
			]);
			content = {
				formtransform: { en: ftEn, de: ftDe },
				liability: { en: liEn, de: liDe }
			};
		},
		resolveId(id) {
			if (id === 'virtual:cdl-content') return '\0virtual:cdl-content';
		},
		load(id) {
			if (id === '\0virtual:cdl-content') {
				return `export const content = ${JSON.stringify(content)};`;
			}
		}
	};
}

export default defineConfig({
	plugins: [sveltekit(), cdlTokens(), fetchCdlContent()],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
