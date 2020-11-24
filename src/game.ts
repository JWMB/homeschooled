export interface Stimulus {
	id: string;
	title: string;
	text?: string;
	html: string;
	selected: boolean;
}

export interface ProblemGenerator {
	stimuli: Stimulus[];
	inputs: Stimulus[];

	init(settings: any): Promise<void>;
	generateTask(level: number);
	registerResponse(inputId: any): { awaitingFurtherRespone: boolean, wasCorrect: boolean };
	responseFeedback(wasCorrect: boolean, chosenId: string): Promise<void>;
}

// export interface Game {
// 	init(baseUrl: string): Promise<void>;
// 	generateProblem(level: number);
// 	registerResponse(alternativeId: any);
// 	responseFeedback(wasCorrect: boolean, chosenId: string): Promise<void>;
// 	score: number;
// 	correctHistory: boolean[];
// 	acceptResponse: boolean;

// 	alternatives: Stimulus[];
// 	correctAlternativeForShow: Stimulus;
// }

export class Game {
    score: number = 0;
    correctHistory: boolean[] = [];
    acceptResponse: boolean = false;

	stimuli: Stimulus[] = [];
	inputs: Stimulus[] = [];
  
	generator: ProblemGenerator;

  generateProblem(level: number = 0) {
	this.acceptResponse = true;

	this.generator.generateTask(level);
	this.inputs = this.generator.inputs;
	this.stimuli = this.generator.stimuli;
  }

  registerResponse(id: string): boolean {
    if (!this.acceptResponse) return false;
  
	const result = this.generator.registerResponse(id);
    this.correctHistory.push(result.wasCorrect);

    this.acceptResponse = false;
    if (result.wasCorrect) {
        this.score += 10;
        return true;
    } else {
		this.score -= 5;
		this.inputs = this.generator.inputs; //In case collection was modified in generator
        const correctInputs = this.inputs.filter(o => this.stimuli.find(p => o.id === p.id) != null);
        correctInputs.forEach(o => o.selected = true);
    
        return false;
    }
  }

  async responseFeedback(wasCorrect: boolean, chosenId: string) {
		await this.generator.responseFeedback(wasCorrect, chosenId);
}
}
