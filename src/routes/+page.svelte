<script lang="ts">
	import { browser } from '$app/environment';
	import { XLSFormParser } from 'xlsform2lstsv';
	import { locale, t } from '$lib/i18n';
	import { content } from 'virtual:cdl-content';

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

		{#if tsvContent && stats}
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



		<footer>
			<p>
				{$t('page.footerText')} <a href="https://github.com/CorrelAid/xlsform2lstsv" target="_blank">{$t('page.repoLink')}</a> {$t('page.footerSuffix')}
			</p>
		</footer>
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




	footer {
		text-align: center;
		color: #555;
		padding: 2rem 0;
		font-size: 0.9rem;
	}

	footer p {
		margin: 0;
	}

	footer a {
		color: var(--color-text-primary);
		text-decoration: underline;
	}

	footer a:hover {
		opacity: 0.8;
	}
</style>
