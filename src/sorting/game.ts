import { MarkdownTable, Table, TsvTable } from "../table";
import { Tools } from "../tools";

export interface Card {
	value1: number;
	value2?: number;
	unit?: string;
	tags?: string[];
	difficulty?: any;
	title?: string;
	body: string;
	images?: string[];
}

export class Game {
    dropZone: DropZone;
    constructor(dropZone: DropZone) {
		this.dropZone = dropZone;
		
		this.cards = [
            { value1: 843, title: "Treaty of Verdun", body: ""},
            { value1: 1461, title: "Louis XI", body: ""},
            { value1: 1789, title: "French Revolution", body: ""},
        ];
	}

	cards: Card[] = [];
	async loadTsv(url: string) {
		const text = await (await fetch(url)).text();
		const table = TsvTable.parse(text);
		const objs = table.getAsObjects();

		// const objsCopy = table.getAsObjects();
		// objsCopy.filter(o => o.Images?.length > 0).forEach(o => o.Images = markDownImagesString(o.Images.split(",").filter(img => img.length > 0)));
		// const tx = Table.createFromObjects(objsCopy);
		// console.log(MarkdownTable.toString(tx));

		this.loadObjs(objs, url);

		function markDownImagesString(images: string[]): string {
			return images.map(img => `![](${img})`).join(" ");
		}
	}

	async loadMarkdown(url: string) {
		const text = await (await fetch(url)).text();
		const table = MarkdownTable.parse(text);
		const objs = table.getAsObjects();
		objs.filter(o => o.Images?.length > 0).forEach(o => o.Images = parseImages(o.Images));

		// const tx = Table.createFromObjects(objs);
		// console.log(TsvTable.toString(tx));

		this.loadObjs(objs, url);

		function parseImages(str: string): string[] {
			if (str == null) return [];
			return str.split("![]").map(o => {
				const m = /\(([^\)]+)\)/.exec(o);
				return m == null ? null : m[1];
			}).filter(o => o != null);
		}
	}

	static makeRelUrlAbs(url: string, baseUrl: string) {
		return url.indexOf("//") < 0 ? `${baseUrl}/${url}` : url;
	}
	loadObjs(objs: any[], sourceUrl: string) {
		this.cards = objs.map(obj => {
			return <Card>{ 
				value1: parseDateToNumber(obj.Value1),
				value2: parseDateToNumber(obj.Value2),
				tags: obj.Tags.split(","),
				title: obj.Title,
				body: obj.Body,
				images: obj.Images
			};
		});

		const baseUrl = sourceUrl.substr(0, sourceUrl.lastIndexOf("/"));
		this.cards.filter(o => o.images?.length > 0).forEach(o => o.images = o.images.map(img => Game.makeRelUrlAbs(img, baseUrl)));

		function parseDateToNumber(str: string): number | null {
			const date = new Date(str);
			return isNaN(date.getDate()) ? null : date.valueOf();
		}
	}

    generate() {
		// e.g. this.cards.filter(c => c.tags == null || c.tags.indexOf("WWII") >= 0);
		const selected = Tools.getRandomUniqueItems(this.cards, 3);

        this.dropZone.setNumSlots(selected.length);

		// console.log(selected);
        return { items: selected };
    }

    makeElementDraggable(el: HTMLElement) {
		el.draggable = true;
		el.style.cursor = "move";
		el.addEventListener("dragstart", e => {
            // console.log(e);
            this.dropZone.startDrag(el);
			el.style.opacity = "0.1";
			e.dataTransfer.dropEffect = 'move';
		});
		el.addEventListener("drag", e => {
			if (this.dropZone.isInside(e.clientX, e.clientY)) {
				el.style.cursor = "copy";
				e.dataTransfer.dropEffect = "copy";
				this.dropZone.makePlaceFor(e.clientX, e.clientY, null);
			} else {
				el.style.cursor = "move";
				e.dataTransfer.dropEffect = "move";
			}
		});
		el.addEventListener("dragend", e => {
			el.style.opacity = "1";
			if (this.dropZone.isInside(e.clientX, e.clientY)) {
				this.dropZone.makePlaceFor(e.clientX, e.clientY, el);
			} else {
                console.log("Wasn't inside", e.clientX, e.clientY);
				// console.log(e);
				el.style.position = "absolute";
				el.parentElement.offsetTop
				el.style.left = `${e.clientX}px`;
				el.style.top = `${e.clientY}px`;
			}
		});
    }
}

export class DropZone {
    slots: (HTMLElement | null)[] = [];
    private elDropZone: HTMLElement;

    constructor(elDropZone: HTMLElement) {
        this.elDropZone = elDropZone;
    }

    get rect(): DOMRect { return this.elDropZone.getBoundingClientRect(); }

    setNumSlots(value: number) {
        this.slots = Array(value).fill(null);
    }

    startDrag(el: HTMLElement) {
        const index = this.slots.indexOf(el);
        if (index >= 0) {
            this.slots[index] = null;
        }
    }

    isInside(clientX: number, clientY: number) {
        const r = this.rect;
        const isInside = clientX >= r.left && clientX <= r.right
            && clientY >= r.top && clientY <= r.bottom;
        // if (!isInside) { console.log(r.left, r.top, r.right, r.bottom, clientX, clientY); }
        return isInside;
    }

    makePlaceFor(clientX: number, clientY: number, dropThis?: HTMLElement) {
		if (this.slots.indexOf(null) < 0) return false;
		const r = this.rect; 
		const wPerSlot = r.width / this.slots.length;
		const xInside = clientX - r.left;
		const originalSLots = this.slots.slice();
		const targetSlotIndex = Math.max(0, Math.min(this.slots.length - 1, Math.floor(xInside / wPerSlot)));
		 if (this.slots[targetSlotIndex] != null) {
			 // find closest empty slot
			for (let i = 0; i < this.slots.length * 2; i++) {
				// every other right left
				const direction = (i % 2 == 0 ? 1 : -1);
				const offset =  direction * Math.floor((i + 2) / 2);
				const index = targetSlotIndex + offset;
				if (index >= 0 && index < this.slots.length) {
					if (this.slots[index] == null) {
						// move slot contents
						if (index > targetSlotIndex) {
							for (let mi = index; mi > targetSlotIndex; mi--) {
								this.slots[mi] = this.slots[mi - 1];
							}
						} else {
							for (let mi = index; mi < targetSlotIndex; mi++) {
								this.slots[mi] = this.slots[mi + 1];
							}
						}

						break;
					}
				}
			 }
         }

		 if (dropThis != null) {
			this.slots[targetSlotIndex] = dropThis;
		 }

		 this.slots.forEach((o, i) => {
			 if (o != null) {
				o.style.position = "absolute";
				o.style.left = `${r.left + wPerSlot * i}px`;
				o.style.top = `${r.top}px`;
			 }
		 });

		 if (dropThis == null) { // reset to original if nothing is dropped
		 	this.slots = originalSLots;
		 }
		 return true;
    }
    
    isSortedAndFull() {
        return this.isSorted && this.slots.indexOf(null) < 0;
    }
    isSorted() {
        const vals = this.slots.filter(el => el != null).map(el => parseFloat(el.getAttribute("data-value")));
        const sorted = vals.slice().sort((a, b) => a - b);
        for (let i = 0; i < vals.length; i++) {
            if (vals[i] !== sorted[i]) {
                return false;
            }
        }
        return true;
    }
}