import type { ProblemGenerator, Stimulus } from "../game";

export class WordProblems implements ProblemGenerator {
	stimuli: Stimulus[];
	inputs: Stimulus[];

	async init() {
		// const words = await (await fetch(`/data/words/difficult-words-sv.json`)).json();
		// const flat = WordImport.importFromWordClassJson(words);
	}

	generateTask(level: number) {
	}
	registerResponse(inputId: any): { awaitingFurtherRespone: boolean, wasCorrect: boolean } {
		return { awaitingFurtherRespone: false, wasCorrect: inputId === this.stimuli[0].id };
	}
}