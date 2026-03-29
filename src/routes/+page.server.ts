async function fetchSnippet(fetch: typeof globalThis.fetch, lang: string) {
	const res = await fetch(
		`https://api.github.com/repos/CorrelAid/cdl-wp-eins/contents/src/content/snippets/formtransform/${lang}.html`,
		{ headers: { Accept: 'application/vnd.github.raw+json' } }
	);
	if (!res.ok) throw new Error(`Failed to fetch formtransform/${lang}.html: ${res.status}`);
	return res.text();
}

export async function load({ fetch }) {
	const [en, de] = await Promise.all([fetchSnippet(fetch, 'en'), fetchSnippet(fetch, 'de')]);
	return { descriptionHtml: { en, de } };
}
