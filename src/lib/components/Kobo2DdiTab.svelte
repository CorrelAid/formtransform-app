<script lang="ts">
	import { browser } from '$app/environment';
	import {
		XLSLoader,
		xlsformToDdi,
		extractVariables,
		choicesByListFromRows,
		buildDataCsv,
		parseResponses,
		type Diagnostic
	} from '@correlaid/formtransform';
	import ErrorBox from './ErrorBox.svelte';
	import { t } from '$lib/i18n';
	import { describeFailure, messages } from '$lib/errors';

	let xlsxFile = $state<File | null>(null);
	let csvFile = $state<File | null>(null);
	let title = $state('');
	let converting = $state(false);
	let progress = $state<string | null>(null);
	let error = $state<string | null>(null);
	let issues = $state<string[]>([]);
	let warnings = $state<string[]>([]);
	let result = $state<{ xml: string; csv: string | null } | null>(null);

	let mode = $derived(csvFile ? 'full' : 'metadata');

	function pickXlsx(e: Event) {
		const f = (e.target as HTMLInputElement).files?.[0] ?? null;
		xlsxFile = f;
		result = null;
		error = null;
	}
	function pickCsv(e: Event) {
		const f = (e.target as HTMLInputElement).files?.[0] ?? null;
		csvFile = f;
		result = null;
		error = null;
	}

	async function convert() {
		if (!xlsxFile || !browser) return;
		converting = true;
		error = null;
		issues = [];
		warnings = [];
		result = null;
		progress = null;
		const findings: Diagnostic[] = [];
		try {
			// LimeSurvey's naming rules (short alphanumeric names and codes) don't
			// apply to DDI, which keeps Kobo names as they are; the TSV tab stays strict.
			const xlsx = await xlsxFile.arrayBuffer();
			const form = XLSLoader.parseXLSData(xlsx, { skipValidation: true });
			// xlsformToDdi checks the DDI subset itself (registered types, resolvable
			// lists, unique names, no LimeSurvey length limits), throws with every
			// finding in details, and reports warnings through onWarning.
			const options = {
				assetName: title || undefined,
				onWarning: (w: Diagnostic) => findings.push(w)
			};
			if (mode === 'metadata') {
				result = { xml: xlsformToDdi(form, options), csv: null };
			} else {
				const submissions = parseResponses(await csvFile!.text(), csvFile!.name);
				const variables = extractVariables(
					form.surveyData,
					choicesByListFromRows(form.choicesData)
				);
				const xml = xlsformToDdi(form, { ...options, submissions });
				result = { xml, csv: buildDataCsv(variables, submissions) };
			}
		} catch (e) {
			({ error, issues } = describeFailure(e));
			console.error(e);
		} finally {
			warnings = messages(findings, 'warning');
			converting = false;
			progress = null;
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
	<p class="hint">{$t('kobo.hint')}</p>

	<div class="mode-banner mode-{mode}">
		{mode === 'full' ? $t('kobo.modeFull') : $t('kobo.modeMetadata')}
	</div>

	<div class="file-input-wrapper">
		<label for="kobo-xlsx" class="file-label required">
			<span class="badge required-badge">{$t('kobo.required')}</span>
			{xlsxFile ? xlsxFile.name : $t('kobo.xlsxLabel')}
		</label>
		<input
			id="kobo-xlsx"
			type="file"
			accept=".xlsx,.xls"
			onchange={pickXlsx}
			disabled={converting}
		/>
	</div>

	<div class="file-input-wrapper">
		<label for="kobo-csv" class="file-label optional" class:has-file={!!csvFile}>
			<span class="badge optional-badge">{$t('kobo.optional')}</span>
			{csvFile ? csvFile.name : $t('kobo.csvLabel')}
		</label>
		<input id="kobo-csv" type="file" accept=".csv" onchange={pickCsv} disabled={converting} />
	</div>

	<details class="options-section">
		<summary>{$t('kobo.advancedOptions')}</summary>
		<div class="options-grid">
			<label class="title-input">
				<span>{$t('kobo.titleLabel')}</span>
				<input
					type="text"
					bind:value={title}
					placeholder={$t('kobo.titlePlaceholder')}
					disabled={converting}
				/>
				<span class="hint">{$t('kobo.titleHint')}</span>
			</label>
		</div>
	</details>

	<button onclick={convert} disabled={!xlsxFile || converting} class="convert-btn">
		{converting
			? (progress ?? $t('kobo.converting'))
			: mode === 'full'
				? $t('kobo.convert')
				: $t('kobo.convertMetadata')}
	</button>
</div>

<ErrorBox {error} {issues} {warnings} />

{#if result}
	<div class="result-box">
		<div class="result-box-header"><span>{$t('page.result')}</span></div>
		<div class="result-box-body">
			<button
				class="download-btn"
				onclick={() => download(result!.xml, 'survey.xml', 'application/xml')}
			>
				{$t('kobo.downloadXml')}
			</button>
			{#if result.csv}
				<button
					class="download-btn"
					onclick={() => download(result!.csv!, 'survey.csv', 'text/csv')}
				>
					{$t('kobo.downloadCsv')}
				</button>
			{/if}
			<details>
				<summary>{$t('kobo.previewXml')}</summary>
				<pre class="tsv-preview">{result.xml}</pre>
			</details>
			{#if result.csv}
				<details>
					<summary>{$t('kobo.previewCsv')}</summary>
					<pre class="tsv-preview">{result.csv}</pre>
				</details>
			{/if}
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
	.file-label.optional {
		border-style: dotted;
		opacity: 0.85;
	}
	.file-label.optional.has-file {
		opacity: 1;
		border-style: dashed;
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
	.optional-badge {
		background: #eee;
		/* Dark enough for 4.5:1 even under .file-label.optional's opacity. */
		color: #333;
	}
	.mode-banner {
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-md);
		font-size: 0.85rem;
	}
	.mode-banner.mode-full {
		background: #e8f5e9;
		color: #1b5e20;
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
	.mode-banner.mode-metadata {
		background: #fff8e1;
		color: #7a5a00;
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
		align-self: flex-start;
	}
	.convert-btn:disabled {
		background: #ccc;
		cursor: not-allowed;
	}
	.download-btn {
		margin: 0 0.5rem 0.5rem 0;
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
