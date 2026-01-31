<script lang="ts">
	import { browser } from '$app/environment';
	import { XLSFormParser } from 'xlsform2lstsv'; // New import

	let file = $state<File | null>(null);
	let converting = $state(false);
	let error = $state<string | null>(null);
	let tsvContent = $state<string | null>(null);
	let stats = $state<{ questions: number; groups: number } | null>(null);

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
				// @ts-expect-error -- xlsform2lstsv uses alert, which is not available in all contexts
				globalThis.alert = () => {};
			}

			const arrayBuffer = await file.arrayBuffer(); // Convert File to ArrayBuffer

			// Use the client-side converter directly
			// @ts-expect-error -- xlsform2lstsv is not typed
			tsvContent = await XLSFormParser.convertXLSDataToTSV(arrayBuffer); // Pass ArrayBuffer

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
	<title>XLSForm to LimeSurvey TSV Converter</title>
</svelte:head>

<main>
	<div class="container">
		<h1>XLSForm to LimeSurvey TSV Converter</h1>
		<p class="description">
			Upload an XLSForm file to convert it to LimeSurvey TSV format for easy import
		</p>



		<div class="form-section">
			<div class="file-input-wrapper">
				<label for="file-input" class="file-label">
					{file ? file.name : 'Choose XLSForm file (.xlsx, .xls)'}
				</label>
				<input
					id="file-input"
					type="file"
					accept=".xlsx,.xls"
					onchange={handleFileChange}
					disabled={converting}
				/>
			</div>

			<button onclick={convertForm} disabled={!file || converting} class="convert-btn">
				{#if converting}
					Converting...
				{:else}
					Convert to LimeSurvey TSV
				{/if}
			</button>
		</div>

		{#if error}
			<div class="error">
				<strong>Error:</strong>
				{error}
			</div>
		{/if}

		{#if tsvContent && stats}
			<div class="success">
				<h2>Conversion Successful!</h2>
				<p class="stats">
					Converted {stats.questions} question{stats.questions !== 1 ? 's' : ''}
					{stats.groups > 0 ? `in ${stats.groups} group${stats.groups !== 1 ? 's' : ''}` : ''}
				</p>

				<button onclick={downloadTsv} class="download-btn"> Download TSV (.txt) </button>

				<details>
					<summary>Preview TSV</summary>
					<pre class="tsv-preview">{tsvContent}</pre>
				</details>

				<details class="help-section">
					<summary>How to import into LimeSurvey</summary>
					<ol>
						<li>Download the .txt file above</li>
						<li>Log in to your LimeSurvey installation</li>
						<li>Go to <strong>Survey → Import</strong></li>
						<li>Select <strong>TSV survey structure</strong></li>
						<li>Upload the downloaded .txt file</li>
						<li>Review and confirm the import</li>
					</ol>
				</details>
			</div>
		{/if}



		<footer>
			<p>
				For current limitations of converting, see
				<a href="https://github.com/CorrelAid/xlsform2lstsv" target="_blank"
					>xlsform2lstsv GitHub repository</a
				>.
			</p>
		</footer>
	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		font-family: var(--typography-body-font-family);
		background: var(--color-background-primary);
		color: var(--color-text-primary);
		line-height: var(--typography-body-line-height);
		font-size: var(--dimension-font-size-base);
	}

	main {
		padding: 2rem;
	}

	.container {
		max-width: var(--dimension-content-max-width);
		margin: 0 auto;
		background: var(--color-white);
		padding: var(--dimension-spacing-lg);
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	h1 {
		margin: 0 0 var(--dimension-spacing-sm) 0;
		color: var(--color-primary-darker);
		font-family: var(--typography-heading-h1-font-family);
		font-size: var(--typography-heading-h1-font-size);
		font-weight: var(--typography-heading-h1-font-weight);
		line-height: var(--typography-heading-h1-line-height);
	}

	.description {
		color: var(--color-text-primary);
		margin: 0 0 var(--dimension-spacing-md) 0;
	}

	.info-box {
		background: var(--color-background-primary);
		border-left: 4px solid var(--color-primary-darker);
		padding: var(--dimension-spacing-sm);
		margin-bottom: var(--dimension-spacing-lg);
		border-radius: 4px;
	}

	.info-box h3 {
		margin: 0 0 var(--dimension-spacing-xs) 0;
		color: var(--color-primary-darker);
		font-size: var(--dimension-font-size-small-min);
	}

	.info-box p {
		margin: var(--dimension-spacing-xs) 0;
		font-size: var(--dimension-font-size-small-min);
		color: var(--color-text-primary);
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
		border: 2px dashed #ccc;
		border-radius: 4px;
		text-align: center;
		cursor: pointer;
		transition: all 0.2s;
	}

	.file-label:hover {
		border-color: #ff9800;
		background: #f9f9f9;
	}

	.convert-btn,
	.download-btn {
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
		font-weight: 500;
	}

	.convert-btn {
		background: var(--color-primary);
		color: var(--color-text-secondary);
	}

	.convert-btn:hover:not(:disabled) {
		background: var(--color-primary-darker);
	}

	.convert-btn:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.download-btn {
		background: var(--color-tertiary);
		color: var(--color-text-primary);
		margin-bottom: var(--dimension-spacing-sm);
	}

	.download-btn:hover {
		opacity: 0.8; /* Simple hover effect */
	}

	.error {
		padding: 1rem;
		background: #ffebee;
		border-left: 4px solid #f44336;
		color: #c62828;
		border-radius: 4px;
		margin-bottom: 1rem;
	}

	.success {
		padding: 1rem;
		background: #fff3e0;
		border-left: 4px solid #ff9800;
		border-radius: 4px;
	}

	.success h2 {
		margin: 0 0 0.5rem 0;
		color: #e65100;
		font-size: 1.25rem;
	}

	.stats {
		color: #666;
		margin: 0 0 1rem 0;
		font-size: 0.95rem;
	}

	details {
		margin-top: 1rem;
	}

	summary {
		cursor: pointer;
		padding: 0.5rem;
		background: #f5f5f5;
		border-radius: 4px;
		font-weight: 500;
	}

	summary:hover {
		background: #ececec;
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

	.help-section ol {
		margin: 1rem 0 0 0;
		padding-left: 1.5rem;
	}

	.help-section li {
		margin: 0.5rem 0;
		color: #555;
	}

	.type-mapping {
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid #eee;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 1rem;
		font-size: 0.9rem;
	}

	th,
	td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid #eee;
	}

	th {
		background: #f5f5f5;
		font-weight: 600;
		color: #333;
	}

	tr:hover {
		background: #fafafa;
	}

	td:first-child {
		font-family: monospace;
		color: #d32f2f;
	}

	td:nth-child(2) {
		font-family: monospace;
		color: #1976d2;
	}

	td:nth-child(3) {
		color: #666;
		font-size: 0.85rem;
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
		color: #2196f3;
		text-decoration: underline;
	}

	footer a:hover {
		opacity: 0.8;
	}
</style>
