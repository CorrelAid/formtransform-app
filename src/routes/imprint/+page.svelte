<script lang="ts">
	import { page } from "$app/stores";
</script>

<svelte:head>
	<title>Imprint & Disclaimer</title>
</svelte:head>

<main class="container">
	<h1>Imprint & Disclaimer</h1>
	
	<section>
		<h2>Tool Owner</h2>
		<p>This XLSForm to LimeSurvey conversion tool is provided by CorrelAid.</p>
		<p>For organizational information: <a href="https://correlaid.org/en/imprint/" target="_blank" rel="noopener noreferrer">https://correlaid.org/en/imprint/</a></p>
	</section>
	
	<section>
		<h2>Usage at Your Own Risk</h2>
		<p>This tool is provided "as is" without any warranties, express or implied. The use of this conversion tool and any resulting files is entirely at your own risk.</p>
		<p>CorrelAid accepts no liability for:</p>
		<ul>
			<li>Data loss or corruption during conversion</li>
			<li>Errors or incompatibilities in the generated TSV files</li>
			<li>Any issues arising from importing converted files into LimeSurvey</li>
			<li>Consequences of using this tool for critical or sensitive surveys</li>
		</ul>
		<p>Always thoroughly test converted files in a non-production environment before actual use.</p>
	</section>
	
	<section>
		<h2>No Guarantee of Functionality</h2>
		<p>While we strive to maintain this tool, we cannot guarantee its continuous availability, accuracy, or suitability for any particular purpose. The tool may be modified, suspended, or discontinued at any time without notice.</p>
	</section>
	
	<section>
		<h2>Copyright</h2>
		<p>© {new Date().getFullYear()} CorrelAid. All rights reserved.</p>
		<p>The tool and its code are subject to the licenses of their respective components.</p>
	</section>
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
	
	p, ul {
		margin-bottom: 1rem;
		line-height: 1.6;
	}
	
	ul {
		padding-left: 1.5rem;
	}
	
	a {
		color: #007bff;
		text-decoration: none;
	}
	
	a:hover {
		text-decoration: underline;
	}
</style>