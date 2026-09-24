<script lang="ts">
	import '$lib/styles/gen_tokens.css';
	import '@correlaid/cdl-design/fonts.css';
	import '@correlaid/cdl-design/typography.css';
	import { LanguageSwitcher } from '@correlaid/cdl-design';
	import { locale, t, type Locale } from '$lib/i18n';

	let { children } = $props();

	const locales = [
		{ code: 'de', label: 'DE' },
		{ code: 'en', label: 'EN' }
	];

	function switchLocale(lang: string) {
		locale.set(lang as Locale);
	}

	$effect(() => {
		document.documentElement.lang = $locale;
	});
</script>

<svelte:head></svelte:head>

<div class="app-layout">
	<LanguageSwitcher {locales} currentLocale={$locale} onLocaleChange={switchLocale} />
	<div class="main-content">
		{@render children()}
	</div>

	<footer>
		<div class="container">
			<nav>
				<a href="/imprint">{$t('layout.imprint')}</a>
			</nav>
		</div>
	</footer>
</div>

<style>
	.app-layout {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.main-content {
		flex: 1;
	}

	footer {
		background-color: var(--color-surface-1);
		padding: 1rem 0;
		margin-top: 0;
		position: relative;
		z-index: 100;
	}

	footer .container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1.5rem;
		display: flex;
		justify-content: flex-end;
		align-items: center;
	}

	footer p {
		margin: 0;
		color: var(--color-text-2);
		font-size: 0.875rem;
	}

	footer nav {
		display: flex;
		gap: 1.5rem;
	}

	footer a {
		color: var(--color-text-2);
		text-decoration: none;
		font-size: 0.875rem;
		transition: color 0.2s ease;
	}

	footer a:hover {
		color: var(--color-text-1);
	}
</style>
