<script lang="ts">
	import { browser } from '$app/environment';
	import {
		XLSLoader,
		buildDdiXml,
		extractVariables,
		choicesByListFromRows,
		buildDataCsv
	} from '@correlaid/formtransform';
	import { t } from '$lib/i18n';

	let xlsxFile = $state<File | null>(null);
	let csvFile = $state<File | null>(null);
	let title = $state('');
	let converting = $state(false);
	let progress = $state<string | null>(null);
	let error = $state<string | null>(null);
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

	function parseKoboCsv(text: string): Record<string, string>[] {
		// Kobo exports are `;`- or `,`-separated; whichever delimiter
		// splits the header line into more columns wins. UTF-8-BOM is
		// stripped either way.
		const stripBom = (s: string) => (s.charCodeAt(0) === 0xfeff ? s.slice(1) : s);
		const split = (line: string, sep: string) => {
			const out: string[] = [];
			let cur = '';
			let inQuote = false;
			for (let i = 0; i < line.length; i++) {
				const c = line[i];
				if (inQuote) {
					if (c === '"' && line[i + 1] === '"') {
						cur += '"';
						i++;
					} else if (c === '"') {
						inQuote = false;
					} else {
						cur += c;
					}
				} else {
					if (c === '"') inQuote = true;
					else if (c === sep) {
						out.push(cur);
						cur = '';
					} else cur += c;
				}
			}
			out.push(cur);
			return out;
		};
		const parse = (sep: string) => {
			const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
			if (lines.length < 2) return { width: 0, rows: [] };
			const headers = split(lines[0], sep).map((h) => stripBom(h));
			const rows = lines.slice(1).map((line) => {
				const cells = split(line, sep);
				const row: Record<string, string> = {};
				for (let i = 0; i < headers.length; i++) row[headers[i]] = cells[i] ?? '';
				return row;
			});
			return { width: headers.length, rows };
		};
		const semi = parse(';');
		const comma = parse(',');
		return semi.width > comma.width ? semi.rows : comma.rows;
	}

	async function convert() {
		if (!xlsxFile || !browser) return;
		converting = true;
		error = null;
		result = null;
		progress = null;
		try {
			const xlsx = await xlsxFile.arrayBuffer();
			if (mode === 'metadata') {
				const { surveyData, choicesData, settingsData } = XLSLoader.parseXLSData(xlsx);
				const xml = buildDdiXml(surveyData, choicesData, {
					assetName: title || undefined,
					settings: settingsData[0]
				});
				result = { xml, csv: null };
			} else {
				const { surveyData, choicesData, settingsData } = XLSLoader.parseXLSData(xlsx);
				const submissions = parseKoboCsv(await csvFile!.text());
				const variables = extractVariables(surveyData, choicesByListFromRows(choicesData));
				const xml = buildDdiXml(surveyData, choicesData, {
					assetName: title || undefined,
					settings: settingsData[0],
					submissions
				});
				const csv = buildDataCsv(variables, submissions);
				result = { xml, csv };
			}
		} catch (e) {
			error = `${e}`;
			console.error(e);
		} finally {
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
