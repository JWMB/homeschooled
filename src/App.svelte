<script lang="ts">
	import { onMount } from "svelte";
	import Alternative from "./alternative.svelte";
	import CardComponent from "./cardComponent.svelte";
	import TailwindCSS from "./style/TailwindCSS.svelte";
	import { Tools } from "./tools";
	import { DropZone, Game as SortingGame } from "./sorting/game";
	import { Game } from "./game";
	import { CountryProblemGenerator } from "./countries/countryProblems";

	let game: Game;
	let alternatives = [];
	let correctAlternativeForShow;
	let score = 0;
	let partCorrect = "";
	let images: { src: string; alt: string }[] = [];

	onMount(async () => {
		// const words = await (await fetch(`/data/words/difficult-words-sv.json`)).json();
		// const flat = WordImport.importFromWordClassJson(words);
		await startSorting();
	
		const baseUrl = window.location.hostname === "localhost" ? "/data/" : "https://raw.githubusercontent.com/JWMB/game-level-contrib/master/countries/";
		const generator = new CountryProblemGenerator();
		await generator.init({ baseUrl: baseUrl });
		game = new Game();
		game.generator = generator;
		generateProblem();
	});

	function speak(phrase: string) {
		if (!window.SpeechSynthesisUtterance || !window.speechSynthesis) return;
		let utterance = new SpeechSynthesisUtterance(phrase);
		speechSynthesis.speak(utterance);
	}
	function getVoices() {
		if (!window.SpeechSynthesisUtterance || !window.speechSynthesis)
			return null;
		speechSynthesis.addEventListener("voiceschanged", () => {
			const voices = speechSynthesis.getVoices();
			// console.log(voices);
			voices.forEach((v, i) => console.log(v.lang, v.name));
		});
		// console.log(speechSynthesis.getVoices());
	}

	let level: number = 0;
	function generateProblem() {
		game.generateProblem(level);
		// speak(game.selectedCountry.names.en);
		alternatives = [...game.alternatives]; // Trigger DOM
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
			try {
				game.correctHistory.splice(0, game.correctHistory.length);
			} catch (e) {
				console.log(e);
			}
		}
		if (!result) {
			alternatives = [...game.alternatives]; // Trigger DOM
			await game.responseFeedback(result, alternativeId);
		}
		generateProblem();
	}

	function onUserLevelChange() {
		self.setTimeout(() => generateProblem());
	}


	let cards: any[] = []; //Card - error: 'Card' is not exported by src\sorting\game.ts, imported by src\App.svelt
	let sortingGame: SortingGame;
	async function startSorting() {
		sortingGame = new SortingGame(new DropZone(document.getElementById("dropZone")));
		// await sortingGame.loadTsv("https://raw.githubusercontent.com/JWMB/game-level-contrib/master/sorting-cards/cards.tsv");
		await sortingGame.loadMarkdown("https://raw.githubusercontent.com/JWMB/game-level-contrib/master/sorting-cards/cards.md");
		const level = sortingGame.generate();
		const itemsParent = document.getElementById("sorting");
		itemsParent.childNodes.forEach(c => c.remove())
		cards = level.items;
	}
</script>

<style>
	main { @apply p-4; }
	h1, p { @apply text-gray-600; }
	:global(.response-option.selected) { border-width: 5px; border-color: brown; }
	:global(.response-option .title) { font-size: x-large; font-weight: bold; }
	:global(.response-option .text) { font-size: large; font-weight: bold; }
	:global(.response-option .html) { width: 200px; height: 170px; }
</style>

<link rel="stylesheet" crossorigin="" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
	integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=="
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
			<input type="number" id="quantity" name="quantity" min="0" max="5" on:input={onUserLevelChange} bind:value={level}>
			<!-- on:change="{e => onUserLevelChange()}"-->
		<!-- <div style="font-size: xx-large;">Level {level} -->
		</div>
		<div style="font-size: xx-large;">{score}</div>
		<div style="">{partCorrect}</div>
		{#if !!correctAlternativeForShow}
			<div>
				<Alternative
					alternativeId="{correctAlternativeForShow.id}"
					text="{correctAlternativeForShow.title}"
					html="{correctAlternativeForShow.html}"
				/>
				<br />
			</div>
		{/if}
		{#each alternatives as item}
			<Alternative
				selected="{item.selected}"
				alternativeId="{item.id}"
				text="{item.title}"
				html="{item.html}"
				on:message="{(e) => registerResponse(e.detail.alternativeId)}"
			/>
			<br/>
		{/each}
	</div>

	<div id="dropZone" style="
	display: inline-block;
	position: absolute;
	left: 800px;
	top: 250px;
	background-color: #AAF3CC;
	border: #DFBC6A 1px solid;
    width: 1000px;
	height: 250px;
    padding: 8px;
    font-size: 18px;
    text-align: center;
">
	</div>

	<div id="sorting">
		{#each cards as card}
		<CardComponent title={card.title} body={card.body} value={card.value1} imageUrl={(card.images || [null])[0]}
			on:mount={e => sortingGame.makeElementDraggable(e.detail.element)}></CardComponent>
		{/each}
	</div>
</main>
