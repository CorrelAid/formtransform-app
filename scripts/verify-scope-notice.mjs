import { chromium } from 'playwright';

const url = process.argv[2] || 'http://127.0.0.1:5175/';

const browser = await chromium.launch();
const page = await browser.newContext().then((c) => c.newPage());
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
	if (m.type() === 'error') errors.push(`console.error: ${m.text()}`);
});
for (const loc of ['en', 'de']) {
	if (loc === 'en') {
		await page.goto(url, { waitUntil: 'networkidle' });
	} else {
		await page.goto(url, { waitUntil: 'networkidle' });
		// Click the DE language switcher
		await page.getByRole('button', { name: 'DE', exact: true }).click();
	}
	await page.waitForTimeout(500);
	const html = await page.locator('.scope-notice').first().innerHTML();
	console.log(`--- locale: ${loc} ---`);
	console.log(html);
	const noticeBeforeTabs = await page.evaluate(() => {
		const notice = document.querySelector('.scope-notice');
		const tabs = document.querySelector('.tab-nav');
		if (!notice || !tabs) return false;
		return !!(notice.compareDocumentPosition(tabs) & Node.DOCUMENT_POSITION_FOLLOWING);
	});
	console.log(`notice appears before tabs: ${noticeBeforeTabs}`);
}
console.log('--- errors ---');
for (const e of errors) console.log(e);
await browser.close();
