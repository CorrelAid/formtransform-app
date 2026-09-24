/** axe-core WCAG 2.1 AA scan of every tab, before and after a conversion, in DE and EN. */
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { convert, fixture, openApp, openTab, upload } from './helpers';

async function scan(page: Page) {
	const { violations } = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
		.analyze();
	// Readable failure: rule, impact, and the first offending selectors.
	expect(
		violations.map(
			(v) => `${v.id} [${v.impact}] ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3)}`
		)
	).toEqual([]);
}

const inputs = {
	tsv: ['#file-input', 'minimal.xlsx'],
	kobo: ['#kobo-xlsx', 'minimal.xlsx'],
	lime: ['#lime-tsv', 'minimal.tsv']
} as const;

for (const lang of ['DE', 'EN']) {
	for (const tab of ['tsv', 'kobo', 'lime'] as const) {
		test(`${lang} ${tab} tab: empty and with a result`, async ({ page }) => {
			await openApp(page);
			await page.getByRole('button', { name: lang, exact: true }).click();
			await openTab(page, tab);
			await scan(page);
			const [selector, file] = inputs[tab];
			await upload(page, selector, fixture(file));
			await convert(page);
			await scan(page);
		});
	}
}

test('imprint page', async ({ page }) => {
	await page.goto('/imprint');
	await page.waitForLoadState('networkidle');
	await scan(page);
});
