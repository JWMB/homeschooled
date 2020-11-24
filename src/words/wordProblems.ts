import type { ProblemGenerator, Stimulus } from "../game";
import { Tools } from "../tools";
import { WordImport } from "./wordImport";

export class WordProblemGenerator implements ProblemGenerator {
	stimuli: Stimulus[];
	inputs: Stimulus[];

	private words: { class: string, word: string, explanation: string}[];
	// private wordsByClass: {[wordClass: string]: { word: string, explanation: string}}[];
	private wordClasses: string[];

	async init(settings: any) {
		const wordsSrc = await (await fetch(`${settings.baseUrl}words/difficult-words-sv.json`)).json();
		this.wordClasses = Object.keys(wordsSrc);
		this.words = WordImport.importFromWordClassJson(wordsSrc);
	}

	private createStimulus(item: {word: string, explanation: string}) {
		return <Stimulus>{ id: item.word, title: item.word, text: item.explanation };
	}

	generateTask(level: number) {
		const wordClass = Tools.getRandomUniqueItems(this.wordClasses, 1)[0]; //Object.keys(this.wordsByClass), 1)[0];
		const selection = this.words.filter(o => o.class === wordClass);

		const numAlternatives = 3;
		this.stimuli = Tools.getRandomUniqueItems(selection, 1).map(this.createStimulus);
		this.inputs = Tools.getRandomUniqueItems(selection, numAlternatives - 1).map(this.createStimulus);
		Tools.insert(this.inputs, Math.floor(Math.random() * numAlternatives), this.stimuli[0]);

		// Make copies so we can modify freely:
		this.stimuli = this.stimuli.map(o => ({...o}));
		this.inputs = this.inputs.map(o => ({...o}));

		this.stimuli.forEach(o => o.title = "");
		this.inputs.forEach(o => o.text = "");
	}

	registerResponse(inputId: any): { awaitingFurtherRespone: boolean, wasCorrect: boolean } {
		const wasCorrect = inputId === this.stimuli[0].id;
		if (!wasCorrect) {
			this.inputs = this.inputs.map(o => this.words.find(w => w.word == o.id)).map(this.createStimulus);
		}
		return { awaitingFurtherRespone: false, wasCorrect: wasCorrect };
	}
	async responseFeedback(wasCorrect: boolean, chosenId: string): Promise<void> {
		if (!wasCorrect) {
			// this.stimuli.forEach(o => o.title = "");
			await Tools.sleep(2500);
		}
		return new Promise<void>(res => res());
	}
}