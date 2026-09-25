<script lang="ts">
	import { browser } from '$app/environment';
	import { lstsvToDdiXml } from '@correlaid/formtransform';
	import { t } from '$lib/i18n';
	import { errorMessage } from '$lib/errors';

	let tsvFile = $state<File | null>(null);
	let title = $state('');
	let converting = $state(false);
	let error = $state<string | null>(null);
	let result = $state<{ xml: string } | null>(null);

	function pickTsv(e: Event) {
		const f = (e.target as HTMLInputElement).files?.[0] ?? null;
		tsvFile = f;
		result = null;
		error = null;
	}

	async function convert() {
		if (!tsvFile || !browser) return;
		converting = true;
		error = null;
		result = null;
		try {
			const tsv = await tsvFile.text();
			const xml = lstsvToDdiXml(tsv, { assetName: title || undefined });
			result = { xml };
		} catch (e) {
			error = errorMessage(e);
			console.error(e);
		} finally {
			converting = false;
		}
	}

	function download(content: string, filename: string, mime: string) {
		const blob = new Blob([content], { type: mime });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
</script>

<div class="form-section">
	<p class="hint">{$t('lime.hint')}</p>

	<div class="file-input-wrapper">
		<label for="lime-tsv" class="file-label required">
			<span class="badge required-badge">{$t('kobo.required')}</span>
			{tsvFile ? tsvFile.name : $t('lime.fileLabel')}
		</label>
		<input id="lime-tsv" type="file" accept=".txt,.tsv" onchange={pickTsv} disabled={converting} />
	</div>

	<details class="options-section">
		<summary>{$t('lime.advancedOptions')}</summary>
		<div class="options-grid">
			<label class="title-input">
				<span>{$t('lime.titleLabel')}</span>
				<input
					type="text"
					bind:value={title}
					placeholder={$t('lime.titlePlaceholder')}
					disabled={converting}
				/>
				<span class="hint">{$t('lime.titleHint')}</span>
			</label>
		</div>
	</details>

	<button onclick={convert} disabled={!tsvFile || converting} class="convert-btn">
		{converting ? $t('lime.converting') : $t('lime.convert')}
	</button>
</div>

{#if error}
	<div class="error"><strong>{$t('page.error')}</strong> {error}</div>
{/if}

{#if result}
	<div class="result-box">
		<div class="result-box-header"><span>{$t('page.result')}</span></div>
		<div class="result-box-body">
			<button
				class="download-btn"
				onclick={() => download(result!.xml, 'survey.xml', 'application/xml')}
			>
				{$t('lime.downloadXml')}
			</button>
			<details>
				<summary>{$t('lime.previewXml')}</summary>
				<pre class="tsv-preview">{result.xml}</pre>
			</details>
		</div>
	</div>
{/if}

<p class="tool-credit">
	{$t('page.footerText')}
	<a href="https://github.com/CorrelAid/formtransform" target="_blank">@correlaid/formtransform</a>
	{$t('page.footerSuffix')}
</p>

<style>
	.form-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 2rem;
	}
	.hint {
		margin: 0;
		font-size: 0.9rem;
		color: #555;
	}
	.file-input-wrapper {
		position: relative;
	}
	input[type='file'] {
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
	.badge {
		display: inline-block;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
		margin-right: 0.5rem;
		vertical-align: middle;
	}
	.required-badge {
		background: var(--color-text-primary);
		color: var(--color-text-secondary);
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
	.options-grid .hint {
		font-size: 0.8rem;
		color: #555;
	}
	.title-input {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.9rem;
	}
	.title-input input {
		padding: 0.5rem;
		border: 1px solid var(--color-text-primary);
		border-radius: var(--radius-md);
		font: inherit;
	}
	.convert-btn,
	.download-btn {
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		font-weight: var(--font-weight-semibold);
		background: var(--color-text-primary);
		color: var(--color-text-secondary);
	}
	.convert-btn {
		align-self: start;
	}
	.convert-btn:disabled {
		background: #ccc;
		cursor: not-allowed;
	}
	.download-btn {
		margin: 0 0 0.5rem 0;
	}
	.error {
		white-space: pre-line;
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
		padding: 0.5rem var(--spacing-base);
		border-bottom: var(--dimension-border-width) solid var(--color-secondary);
		color: var(--color-secondary);
		font-weight: 600;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
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
</style>
