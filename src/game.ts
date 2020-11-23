export interface Game {
	init(baseUrl: string): Promise<void>;
	generateProblem(level: number);
	registerResponse(alternativeId: any);
	responseFeedback(wasCorrect: boolean, chosenId: string): Promise<void>;
	score: number;
	correctHistory: boolean[];
	acceptResponse: boolean;

	alternatives: Stimulus[];
	correctAlternativeForShow: Stimulus;
}

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

	init(): Promise<void>;
	generateTask(level: number);
	registerResponse(inputId: any): { awaitingFurtherRespone: boolean, wasCorrect: boolean };
}

export class GameOO implements Game {
    score: number = 0;
    correctHistory: boolean[] = [];
    acceptResponse: boolean = false;

	correctAlternativeForShow: Stimulus;
	alternatives: Stimulus[] = [];
  
	generator: ProblemGenerator;

    async init(baseUrl: string) {
	}

  generateProblem(level: number = 0) {
	this.acceptResponse = true;

	this.generator.generateTask(level);
	this.alternatives = this.generator.inputs;
	this.correctAlternativeForShow = this.generator.stimuli[0];
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
        const correctAlternative = this.alternatives.find(o => o.id == this.correctAlternativeForShow.id);
        correctAlternative.selected = true;
    
        // this.map.selectCountry(id);
        return false;
    }
  }

  async responseFeedback(wasCorrect: boolean, chosenId: string) {
    if (!wasCorrect) {
    //   await this.map.flyTo(chosenId);
    //   await Tools.sleep(1000);
	  }
	}
}
