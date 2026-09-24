import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'fs';

// Try system chromium first, fallback to Playwright's bundled browser
// https://gist.github.com/mewset/44d4b5f21d3d00587a50190aa85cb692
const getChromiumPath = () => {
	const systemPath = '/usr/bin/chromium';
	return existsSync(systemPath) ? systemPath : undefined;
};

export default defineConfig({
	testDir: './tests',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: 'list',
	timeout: 60000, // Increase timeout to 60 seconds
	expect: { timeout: 10_000 },
	use: {
		baseURL: 'http://localhost:5173',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure'
	},

	projects: [
		{
			name: 'chromium',
			testIgnore: /.*accessibility.*\.spec\.ts/,
			use: {
				...devices['Desktop Chrome'],

				launchOptions: {
					executablePath: getChromiumPath()
				}
			}
		},
		{
			name: 'accessibility',
			use: {
				...devices['Desktop Chrome'],
				launchOptions: {
					executablePath: getChromiumPath()
				}
			},
			testMatch: /.*accessibility.*\.spec\.ts/
		}
	],

	webServer: {
		command: 'bun run dev',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI,
		timeout: 120 * 1000
	}
});
