<script lang="ts">
	import { browser } from '$app/environment';
	import { XLSFormParser } from '@correlaid/formtransform';
	import { marked } from 'marked';
	import { locale, t } from '$lib/i18n';
	import { content } from 'virtual:cdl-content';
	import Kobo2DdiTab from '$lib/components/Kobo2DdiTab.svelte';
	import Lstsv2DdiTab from '$lib/components/Lstsv2DdiTab.svelte';

	let activeTab = $state<'tsv' | 'kobo' | 'lime'>('tsv');

	let file = $state<File | null>(null);
	let converting = $state(false);
	let error = $state<string | null>(null);
	let tsvContent = $state<string | null>(null);
	let stats = $state<{ questions: number; groups: number } | null>(null);

	let config = $state({
		convertWelcomeNote: true,
		convertEndNote: true,
		convertOtherPattern: true,
		convertMarkdown: true,
		hideNoAnswer: true
	});

	function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			file = target.files[0];
			tsvContent = null;
			error = null;
			stats = null;
		}
	}

	async function convertForm() {
		if (!file) return;

		converting = true;
		error = null;
		tsvContent = null;
		stats = null;

		try {
			// Ensure we're running in a browser environment
			if (!browser) {
				throw new Error('XLSForm conversion can only be performed in a browser environment');
			}

			// Mock alert if it's not available in the current context (moved from xlsform-converter.js)
			if (typeof globalThis.alert === 'undefined') {
				globalThis.alert = () => {};
			}

			const arrayBuffer = await file.arrayBuffer(); // Convert File to ArrayBuffer

			// Use the client-side converter directly
			tsvContent = await XLSFormParser.convertXLSDataToTSV(arrayBuffer, config);

			// Calculate stats if tsvContent is not null
			if (tsvContent) {
				const lines = tsvContent.split('\n');
				const questionCount = lines.filter((line) => line.startsWith('Q\t')).length;
				const groupCount = lines.filter((line) => line.startsWith('G\t')).length;

				stats = {
					questions: questionCount,
					groups: groupCount
				};
			}
		} catch (e) {
			error = `Conversion failed: ${e}`;
			console.error(e);
		} finally {
			converting = false;
		}
	}

	function downloadTsv() {
		if (!tsvContent) return;

		// Add UTF-8 BOM for better compatibility with LimeSurvey
		const BOM = '\uFEFF';
		// Use Windows line endings (CRLF) which LimeSurvey expects
		const contentWithCRLF = tsvContent.replace(/\n/g, '\r\n');
		const blob = new Blob([BOM + contentWithCRLF], {
			type: 'text/tab-separated-values;charset=utf-8'
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = file?.name.replace(/\.(xlsx?|csv)$/i, '.txt') || 'survey.txt';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
</script>

<svelte:head>
	<title>{$t('page.title')}</title>
</svelte:head>

<main>
	<div class="container">
		<h1>{$t('page.title')}</h1>
		<div class="description">{@html content.formtransform[$locale]}</div>
		<aside class="scope-notice">
			<p>{@html marked.parse($t('scope.notice'), { async: false })}</p>
			<a href="https://github.com/CorrelAid/formtransform#supported-xlsform-subset" target="_blank" rel="noopener noreferrer"
				>{$t('scope.link')}</a
			>
		</aside>

		<div class="tab-nav" role="tablist">
			<button
				role="tab"
				class:active={activeTab === 'tsv'}
				aria-selected={activeTab === 'tsv'}
				onclick={() => (activeTab = 'tsv')}>{$t('tabs.xlsform')}</button
			>
			<button
				role="tab"
				class:active={activeTab === 'kobo'}
				aria-selected={activeTab === 'kobo'}
				onclick={() => (activeTab = 'kobo')}>{$t('tabs.kobo')}</button
			>
			<button
				role="tab"
				class:active={activeTab === 'lime'}
				aria-selected={activeTab === 'lime'}
				onclick={() => (activeTab = 'lime')}>{$t('tabs.limesurvey')}</button
			>
		</div>

		{#if activeTab === 'kobo'}
			<Kobo2DdiTab />
		{:else if activeTab === 'lime'}
			<Lstsv2DdiTab />
		{:else}
		<div class="form-section">
			<div class="file-input-wrapper">
				<label for="file-input" class="file-label">
					{file ? file.name : $t('page.fileLabel')}
				</label>
				<input
					id="file-input"
					type="file"
					accept=".xlsx,.xls"
					onchange={handleFileChange}
					disabled={converting}
				/>
			</div>

			<details class="options-section">
				<summary>{$t('page.conversionOptions')}</summary>
				<div class="options-grid">
					<label class="option">
						<input type="checkbox" bind:checked={config.convertWelcomeNote} />
						<div>
							<strong>{$t('page.convertWelcomeNote')}</strong>
							<span>{$t('page.convertWelcomeNoteDesc')}</span>
						</div>
					</label>
					<label class="option">
						<input type="checkbox" bind:checked={config.convertEndNote} />
						<div>
							<strong>{$t('page.convertEndNote')}</strong>
							<span>{$t('page.convertEndNoteDesc')}</span>
						</div>
					</label>
					<label class="option">
						<input type="checkbox" bind:checked={config.convertOtherPattern} />
						<div>
							<strong>{$t('page.convertOtherPattern')}</strong>
							<span>{$t('page.convertOtherPatternDesc')}</span>
						</div>
					</label>
					<label class="option">
						<input type="checkbox" bind:checked={config.convertMarkdown} />
						<div>
							<strong>{$t('page.convertMarkdown')}</strong>
							<span>{$t('page.convertMarkdownDesc')}</span>
						</div>
					</label>
					<label class="option">
						<input type="checkbox" bind:checked={config.hideNoAnswer} />
						<div>
							<strong>{$t('page.hideNoAnswer')}</strong>
							<span>{$t('page.hideNoAnswerDesc')}</span>
						</div>
					</label>
				</div>
			</details>

			<button onclick={convertForm} disabled={!file || converting} class="convert-btn">
				{#if converting}
					{$t('page.converting')}
				{:else}
					{$t('page.convert')}
				{/if}
			</button>
		</div>

		{#if error}
			<div class="error">
				<strong>{$t('page.error')}</strong>
				{error}
			</div>
		{/if}

		{#if tsvContent && stats && activeTab === 'tsv'}
			<div class="result-box">
				<div class="result-box-header">
					<span>{$t('page.result')}</span>
					<span class="result-stats">
						{stats.questions} {stats.questions !== 1 ? $t('page.questions') : $t('page.question')}{stats.groups > 0 ? `, ${stats.groups} ${stats.groups !== 1 ? $t('page.groups') : $t('page.group')}` : ''}
					</span>
				</div>
				<div class="result-box-body">
					<button onclick={downloadTsv} class="download-btn">{$t('page.download')}</button>

					<details>
						<summary>{$t('page.previewTsv')}</summary>
						<pre class="tsv-preview">{tsvContent}</pre>
					</details>
				</div>
			</div>
		{/if}
			<p class="tool-credit">
				{$t('page.footerText')} <a href="https://github.com/CorrelAid/formtransform" target="_blank">{$t('page.repoLink')}</a> {$t('page.footerSuffix')}
			</p>
		{/if}
	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		font-family: var(--font-family-body);
		background: var(--color-background-primary);
		color: var(--color-text-primary);
		line-height: var(--line-height-relaxed);
	}

	main {
		padding: 2rem;
	}

	.container {
		max-width: var(--dimension-content-max-width);
		margin: 0 auto;
		background: var(--color-white);
		padding: var(--spacing-2xl);
		border: var(--dimension-border-width) solid var(--color-text-primary);
		border-radius: var(--radius-xl);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
	}

	h1 {
		margin: 0 0 var(--spacing-base) 0;
		color: var(--color-text-primary);
	}

	.description {
		color: var(--color-text-primary);
		margin: 0 0 var(--spacing-lg) 0;
	}

	.scope-notice {
		margin: 0 0 var(--spacing-lg) 0;
		padding: var(--spacing-base);
		border-left: 4px solid var(--color-secondary);
		background: var(--color-background-primary);
		border-radius: var(--radius-md);
		color: var(--color-text-primary);
		font-size: 0.9rem;
		line-height: var(--line-height-relaxed);
	}
	.scope-notice p {
		margin: 0 0 var(--spacing-sm) 0;
	}
	.scope-notice a {
		color: var(--color-text-primary);
		font-weight: var(--font-weight-semibold);
	}



	.tab-nav {
		display: flex;
		gap: 0.5rem;
		margin: 0 0 var(--spacing-lg) 0;
		border-bottom: var(--dimension-border-width) solid var(--color-text-primary);
	}
	.tab-nav button {
		padding: 0.5rem 1rem;
		background: transparent;
		border: var(--dimension-border-width) solid transparent;
		border-bottom: none;
		border-radius: var(--radius-md) var(--radius-md) 0 0;
		cursor: pointer;
		font: inherit;
		color: var(--color-text-primary);
	}
	.tab-nav button.active {
		background: var(--color-white);
		border-color: var(--color-text-primary);
		font-weight: var(--font-weight-semibold);
	}

	.form-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.file-input-wrapper {
		position: relative;
	}

	#file-input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.file-label {
		display: block;
		padding: 1rem;
		border: 2px dashed var(--color-primary-darker);
		border-radius: var(--radius-md);
		text-align: center;
		cursor: pointer;
		transition: all 0.2s;
	}

	.file-label:hover {
		border-color: var(--color-text-primary);
		background: #f4f0f3;
	}

	.convert-btn,
	.download-btn {
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.2s;
		font-weight: var(--font-weight-semibold);
	}

	.convert-btn {
		background: var(--color-text-primary);
		color: var(--color-text-secondary);
		align-self: flex-start;
		width: auto;
	}

	.convert-btn:hover:not(:disabled) {
		opacity: 0.9;
	}

	.convert-btn:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.download-btn {
		background: var(--color-text-primary);
		color: var(--color-text-secondary);
		margin-bottom: var(--spacing-base);
	}

	.download-btn:hover {
		opacity: 0.9;
	}

	.error {
		padding: 1rem;
		background: #ffebee;
		border-left: 4px solid #f44336;
		color: #c62828;
		border-radius: var(--radius-md);
		margin-bottom: 1rem;
	}

	.result-box {
		background: var(--color-white);
		border: var(--dimension-border-width) solid var(--color-secondary);
		border-radius: var(--radius-lg);
		overflow: hidden;
		box-shadow: inset -8px 0 0 0 var(--color-secondary);
		font-family: var(--font-family-mono);
	}

	.result-box-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem var(--spacing-base);
		border-bottom: var(--dimension-border-width) solid var(--color-secondary);
		color: var(--color-secondary);
		font-weight: 600;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.result-stats {
		font-weight: 400;
		text-transform: none;
		letter-spacing: normal;
		color: #666;
		font-size: 0.85rem;
	}

	.result-box-body {
		padding: var(--spacing-base);
	}

	details {
		margin-top: 1rem;
	}

	summary {
		cursor: pointer;
		padding: 0.5rem var(--spacing-sm);
		background: #f0f0f5;
		border-radius: var(--radius-md);
		font-weight: 500;
		color: var(--color-text-primary);
	}

	summary:hover {
		background: #e4e0e8;
	}

	.tsv-preview {
		margin: 1rem 0 0 0;
		padding: 1rem;
		background: #f5f5f5;
		border-radius: 4px;
		overflow-x: auto;
		font-size: 0.8rem;
		line-height: 1.4;
		max-height: 400px;
		overflow-y: auto;
	}

	.options-section {
		margin: 0;
	}

	.options-grid {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
	}

	.option {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		cursor: pointer;
	}

	.option input[type='checkbox'] {
		margin-top: 0.25rem;
		flex-shrink: 0;
	}

	.option div {
		display: flex;
		flex-direction: column;
	}

	.option strong {
		font-size: 0.9rem;
	}

	.option span {
		font-size: 0.8rem;
		color: #555;
	}




	.tool-credit {
		margin: 1.5rem 0 0 0;
		padding-top: 1rem;
		border-top: 1px solid #eee;
		text-align: center;
		color: #555;
		font-size: 0.9rem;
	}

	.tool-credit a {
		color: var(--color-text-primary);
		text-decoration: underline;
	}

	.tool-credit a:hover {
		opacity: 0.8;
	}
</style>
