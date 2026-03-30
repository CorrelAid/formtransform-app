import { env } from '$env/dynamic/private';

function ghHeaders() {
	const h: Record<string, string> = { Accept: 'application/vnd.github.raw+json' };
	if (env.GITHUB_TOKEN) h['Authorization'] = `Bearer ${env.GITHUB_TOKEN}`;
	return h;
}

async function fetchSnippet(fetch: typeof globalThis.fetch, lang: string): Promise<string> {
	try {
		const res = await fetch(
			`https://api.github.com/repos/CorrelAid/cdl-wp-eins/contents/src/content/snippets/liability/${lang}.html`,
			{ headers: ghHeaders() }
		);

		if (!res.ok) {
			const errorText = await res.text();
			console.error(`Failed to fetch liability/${lang}.html: ${res.status}`);
			console.error(`Response: ${errorText.substring(0, 200)}`);
			if (!env.GITHUB_TOKEN) {
				console.warn('GITHUB_TOKEN not set - you may hit rate limits');
			}
			return '';
		}

		return res.text();
	} catch (error) {
		console.error(`Error fetching liability/${lang}.html:`, error);
		return '';
	}
}

export async function load({ fetch }) {
	const [en, de] = await Promise.all([fetchSnippet(fetch, 'en'), fetchSnippet(fetch, 'de')]);
	return { liabilityHtml: { en, de } };
}
