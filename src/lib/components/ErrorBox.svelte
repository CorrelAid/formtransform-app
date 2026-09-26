<script lang="ts">
	import { t } from '$lib/i18n';

	/**
	 * `issues` (blocking, listed) take precedence over `error` (one message).
	 * `warnings` don't block and are shown alongside a result.
	 */
	let {
		error = null,
		issues = [],
		warnings = []
	}: { error?: string | null; issues?: string[]; warnings?: string[] } = $props();
</script>

{#if issues.length}
	<div class="box error" role="alert">
		<strong>{$t('page.issues')}</strong>
		<ul>
			{#each issues as issue, i (i)}
				<li>{issue}</li>
			{/each}
		</ul>
	</div>
{:else if error}
	<div class="box error" role="alert"><strong>{$t('page.error')}</strong> {error}</div>
{/if}

{#if warnings.length}
	<div class="box warnings" role="status">
		<strong>{$t('page.warnings')}</strong>
		<ul>
			{#each warnings as warning, i (i)}
				<li>{warning}</li>
			{/each}
		</ul>
	</div>
{/if}

<style>
	.box {
		white-space: pre-line;
		padding: 1rem;
		border-radius: var(--radius-md);
		margin-bottom: 1rem;
	}
	.error {
		background: #ffebee;
		border-left: 4px solid #f44336;
		color: #c62828;
	}
	.warnings {
		background: #fff8e1;
		border-left: 4px solid #f9a825;
		color: #5d4037;
	}
	ul {
		white-space: normal;
		margin: 0.5rem 0 0;
		padding-left: 1.25rem;
	}
</style>
