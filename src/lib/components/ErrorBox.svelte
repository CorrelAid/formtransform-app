<script lang="ts">
	import { t } from '$lib/i18n';

	/** Subset violations, listed one per line; take precedence over `error`. */
	let { error = null, issues = [] }: { error?: string | null; issues?: string[] } = $props();
</script>

{#if issues.length}
	<div class="error" role="alert">
		<strong>{$t('page.issues')}</strong>
		<ul>
			{#each issues as issue, i (i)}
				<li>{issue}</li>
			{/each}
		</ul>
	</div>
{:else if error}
	<div class="error" role="alert"><strong>{$t('page.error')}</strong> {error}</div>
{/if}

<style>
	.error {
		white-space: pre-line;
		padding: 1rem;
		background: #ffebee;
		border-left: 4px solid #f44336;
		color: #c62828;
		border-radius: var(--radius-md);
		margin-bottom: 1rem;
	}
	ul {
		white-space: normal;
		margin: 0.5rem 0 0;
		padding-left: 1.25rem;
	}
</style>
