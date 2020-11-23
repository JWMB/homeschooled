import { HtmlTools } from "../htmlTools";
import { Tools } from "../tools";

export class WordImport {
	static importFromWordClassJson(json: {[wordClass: string]: [string, string][]}) {
		//const words: { class: string, word: string, explanation: string}[] = [];
		const words = Tools.flatten(Object.keys(json).map(wordClass => {
			return json[wordClass].map(o => ({ class: wordClass, word: o[0], explanation: o[1]}));
		}), 1);
		return words;
	}
	static async importFromHtml() {
		const all = ["adjective", "noun", "verb", "expression", "other"].map(async wordClass => {
			let cnt = 1;
			let allInClass = [];
			while (true) {
				let response: Response;
				try {
					response = await fetch(`/data/words/${wordClass}-${cnt}.txt`);
				} catch (err) {
					break;
				}
				if (!response.ok) break;
				const html = await response.text();
				const document = HtmlTools.parseHtml(html);

				// const nodes = HtmlTools.getNodesXPath(document, "//*[@data-column-a]//div[contains(@class, 'col_a') or contains(@class, 'col_b')]")
				const nodes = <HTMLDivElement[]>HtmlTools.getNodesXPath(document, "//*[@data-column-a]//div[contains(@class, 'text-text')]");
				allInClass = allInClass.concat(nodes.map(n => {
					const children = HtmlTools.collectionToArray(n.children);
					const colA = <HTMLDivElement>children.find(c => c.className.indexOf("col_a") >= 0);
					const colB = <HTMLDivElement>children.find(c => c.className.indexOf("col_b") >= 0); 
					return [colA.innerText, colB.innerText];
				}));
				cnt++;
			}
			return { wordClass: wordClass, words: allInClass };
		});
		const xx = await Promise.all(all);
		const obj = Tools.arrayToObject(xx, o => o.wordClass, o => o.words);
		console.log(obj);
	}
}