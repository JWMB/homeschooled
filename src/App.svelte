<script lang="ts">
	import { onMount } from "svelte";
	import Alternative from "./alternative.svelte";
	import TailwindCSS from "./style/TailwindCSS.svelte";
	import { Tools } from "./tools";
	import { Game } from "./game";

	let game = new Game();
	export let alternatives = game.alternatives;
	export let correctAlternativeForShow;
	export let score = 0;
	export let partCorrect = "";
	export let images: { src: string; alt: string }[] = [];

	onMount(async () => {
		await game.init();
		// const select: any = document.getElementById("countries");
		//     if (!!select) {
		//       game.countries.forEach(ci => {
		//         const option = document.createElement("option");
		//         option.text = ci.names[this.lang];
		//         select.add(option);
		//     });
		//   }

		await generateProblem();
	});

	function speak(phrase: string) {
		if (!window.SpeechSynthesisUtterance || !window.speechSynthesis) return;
		let utterance = new SpeechSynthesisUtterance(phrase);
		// utterance.pitch = pitch.value;
		// utterance.rate = rate.value;
		speechSynthesis.speak(utterance);
	}
	function getVoices() {
		if (!window.SpeechSynthesisUtterance || !window.speechSynthesis)
			return null;
		speechSynthesis.addEventListener("voiceschanged", () => {
			const voices = speechSynthesis.getVoices();
			console.log(voices);
			voices.forEach((v, i) => console.log(v.lang, v.name));
		});
		console.log(speechSynthesis.getVoices());
	}

	export let level: number = 0;
	async function generateProblem() {
		await game.generateProblem(level);
		// speak(game.selectedCountry.names.en);
		alternatives = [...game.alternatives]; // Trigger DOM
		//correctAlternativeForShow = null;
		correctAlternativeForShow = game.correctAlternativeForShow; // Trigger DOM
		// game.countriesCollection.loadImagesForCountry(game.selectedCountry.alpha2).then(r => images = r);
	}
	async function registerResponse(alternativeId) {
		if (!game.acceptResponse) return;

		const result = game.registerResponse(alternativeId);
		score = game.score; // Trigger DOM
		const outOf = 10;
		const levelUpWhen = 9;
		const forPercentage = Array(outOf - game.correctHistory.length).fill(false).concat(Tools.sliceFromEnd(game.correctHistory, outOf));
		partCorrect = forPercentage.map((o) => (o ? "!" : ".")).join("") +
			` ${forPercentage.filter((o) => o).length} / ${outOf}`;
		if (forPercentage.filter((o) => o).length >= levelUpWhen) {
			level++;
			game.correctHistory.splice(0, game.correctHistory.length);
		}
		if (!result) {
			alternatives = [...game.alternatives]; // Trigger DOM
			await game.map.flyTo(alternativeId);
			await Tools.sleep(1000);
		}
		await generateProblem();
	}

	function onUserLevelChange() {
		generateProblem();
	}
</script>

<style>
	main {
		@apply p-4;
	}
	h1,
	p {
		@apply text-gray-600;
	}
	:global(.response-option.selected) {
		border-width: 5px;
		border-color: brown;
	}
	:global(.country-name) {
		font-size: large;
		font-weight: bold;
	}
	:global(.flag) {
		width: 200px;
		height: 170px;
	}
</style>

<link
	rel="stylesheet"
	href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
	integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=="
	crossorigin=""
/>
<!-- <select id="countries" on:change="{(e) => selectCountry(e.target)}"></select> -->

<TailwindCSS />
<main>
	<div style="float: right; overflow-y: auto; height: 100vh;">
		{#each images as image}
			<div style="width: 100%;">
				<img src="{image.src}" alt="{image.alt}" />
			</div>
		{/each}
	</div>
	<div id="map" style="float:left; height: 500px; width: 500px;"></div>
	<div style="float:left; padding-left: 50px">
		<div>Score</div>
		<div style="font-size: xx-large;">Level
			<input type="number" id="quantity" name="quantity" on:change="{e => onUserLevelChange()}" min="1" max="5" value={level}>
		<!-- <div style="font-size: xx-large;">Level {level} -->
		</div>
		<div style="font-size: xx-large;">{score}</div>
		<div style="">{partCorrect}</div>
		{#if !!correctAlternativeForShow}
			<div>
				<Alternative
					alternativeId="{correctAlternativeForShow.id}"
					country="{correctAlternativeForShow.name}"
					flagSvg="{correctAlternativeForShow.flag}"
				/>
				<br />
			</div>
		{/if}
		{#each alternatives as item}
			<Alternative
				selected="{item.selected}"
				alternativeId="{item.id}"
				country="{item.name}"
				flagSvg="{item.flag}"
				on:message="{(e) => registerResponse(e.detail.alternativeId)}"
			/>
		{/each}
	</div>
</main>
