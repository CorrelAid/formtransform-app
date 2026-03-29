<script lang="ts">
	import '$lib/styles/gen_tokens.css';
	import '@correlaid/cdl-design/fonts.css';
	import '@correlaid/cdl-design/typography.css';
	import { locale, t, type Locale } from '$lib/i18n';

	let { children } = $props();

	function switchLocale(lang: Locale) {
		locale.set(lang);
	}
</script>

<svelte:head>
</svelte:head>

<div class="app-layout">
	<div class="lang-switcher">
		<button class:active={$locale === 'en'} onclick={() => switchLocale('en')}>EN</button>
		<button class:active={$locale === 'de'} onclick={() => switchLocale('de')}>DE</button>
	</div>
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
	.lang-switcher {
		display: flex;
		justify-content: flex-end;
		gap: 0;
		padding: 0.75rem 1.5rem 0;
	}

	.lang-switcher button {
		background: var(--color-white, #fff);
		border: 1px solid var(--color-text-primary);
		padding: 0.35rem 0.75rem;
		cursor: pointer;
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--color-text-primary);
	}

	.lang-switcher button:first-child {
		border-radius: 4px 0 0 4px;
		border-right: none;
	}

	.lang-switcher button:last-child {
		border-radius: 0 4px 4px 0;
	}

	.lang-switcher button:hover {
		background: #f0ecf0;
	}

	.lang-switcher button.active {
		background: var(--color-text-primary);
		color: var(--color-white, #fff);
		font-weight: 600;
	}

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
