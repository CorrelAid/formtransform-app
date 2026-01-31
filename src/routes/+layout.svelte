<script lang="ts">
	import '$lib/styles/tokens.css';

	let { children } = $props();
</script>

<svelte:head>
</svelte:head>

<div class="app-layout">
	<div class="main-content">
		{@render children()}
	</div>
	
	<footer>
		<div class="container">
			<p>© {new Date().getFullYear()} CorrelAid.</p>
			<nav>
				<a href="/imprint">Imprint</a>
			</nav>
		</div>
	</footer>
</div>

<style>
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
		justify-content: space-between;
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
