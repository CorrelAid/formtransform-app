<script lang="ts">
	import { locale, t } from '$lib/i18n';
	import { content } from 'virtual:cdl-content';
</script>

<svelte:head>
	<title>{$t('imprint.title')}</title>
</svelte:head>

<main class="container">
	<a href="/" class="back-link">&larr; {$t('page.title')}</a>
	<h1>{$t('imprint.title')}</h1>

	<section>
		<p>
			{$t('imprint.hostedBy')}
			<a href="https://correlaid.org" target="_blank" rel="noopener noreferrer"
				>{$t('imprint.correlaid')}</a
			>{$t('imprint.partOfCdl')}
			<a href="https://civic-data.de" target="_blank" rel="noopener noreferrer"
				>{$t('imprint.cdl')}</a
			>.
			{$t('imprint.referenceText')}
			<a href="https://civic-data.de/impressum/" target="_blank" rel="noopener noreferrer"
				>civic-data.de/impressum/</a
			>.
		</p>
	</section>

	<!-- Trusted: build-time snippet from CorrelAid/cdl-wp-eins. -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html content.liability[$locale]}
</main>

<style>
	main {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}

	h1 {
		font-size: 2rem;
		margin-bottom: 2rem;
	}

	h2 {
		font-size: 1.5rem;
		margin-top: 2rem;
		margin-bottom: 1rem;
	}

	p,
	ul {
		margin-bottom: 1rem;
		line-height: 1.6;
	}

	ul {
		padding-left: 1.5rem;
	}

	.back-link {
		display: inline-block;
		margin-bottom: 1rem;
		color: var(--color-text-primary);
		text-decoration: none;
		font-size: 0.9rem;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	a {
		color: #007bff;
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}
</style>
