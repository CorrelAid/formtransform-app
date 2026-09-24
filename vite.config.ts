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

	function ghHeaders(token?: string): Record<string, string> {
		const h: Record<string, string> = { Accept: 'application/vnd.github.raw+json' };
		if (token) h['Authorization'] = `Bearer ${token}`;
		return h;
	}

	async function fetchSnippet(path: string): Promise<string> {
		const url = `https://api.github.com/repos/CorrelAid/cdl-wp-eins/contents/src/content/snippets/${path}`;
		const token = process.env.GITHUB_TOKEN;
		try {
			let res = await fetch(url, { headers: ghHeaders(token) });
			if (!res.ok && token) {
				// A stale or under-scoped token fails even though the repo is public.
				console.warn(`[cdl-content] ${path}: ${res.status} with GITHUB_TOKEN, retrying without it`);
				res = await fetch(url, { headers: ghHeaders() });
			}
			if (!res.ok) {
				console.warn(`[cdl-content] Failed to fetch ${path}: ${res.status}`);
				if (!token) console.warn('[cdl-content] GITHUB_TOKEN not set — you may hit rate limits');
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
			// The liability text is legally required; in CI (Coolify, GitHub Actions)
			// fail the build rather than deploy a page without it.
			if (process.env.CI && [ftEn, ftDe, liEn, liDe].some((s) => !s)) {
				throw new Error('[cdl-content] a CDL snippet is empty, refusing to build');
			}
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
	resolve: {
		alias: {
			// If js-xpath fails to load in the browser, the library's XPath
			// transpiler silently turns every relevance/constraint into "1".
			// Its `main` (src/main.js) leaves a bare `require` in the production
			// bundle; the shipped browserify bundle is self-contained. The
			// `this.alert` it runs at load time is undefined in strict ESM, which
			// patches/js-xpath@0.0.4.patch rewrites to globalThis.
			'js-xpath': 'js-xpath/dist/js-xpath.js'
		}
	},
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
