export class Game {
    dropZone: DropZone;
    constructor(dropZone: DropZone) {
        this.dropZone = dropZone;
    }
    generate() {
        const alternatives = [
            { "year": 843, "text": "Treaty of Verdun"},
            { "year": 1461, "text": "Louis XI"},
            { "year": 1789, "text": "French Revolution"},
        ];

        this.dropZone.setNumSlots(alternatives.length);

        return { sortBy: "year", items: alternatives };
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
        if (!isInside) {
            console.log(r.left, r.top, r.right, r.bottom, clientX, clientY);
        }
        return isInside;
    }

    makePlaceFor(clientX: number, clientY: number, dropThis?: HTMLElement) {
        let slots = this.slots;
		const r = this.rect; 
		const wPerSlot = r.width / slots.length;
		const xInside = clientX - r.left;
		const originalSLots = slots.slice();
		const targetSlotIndex = Math.max(0, Math.min(this.slots.length - 1, Math.floor(xInside / wPerSlot)));
		 if (slots[targetSlotIndex] != null) {
			let firstEmptyIndex = slots.indexOf(null, targetSlotIndex);
			if (firstEmptyIndex >= 0) {
				for (var i = firstEmptyIndex; i > targetSlotIndex; i--) {
					slots[i] = slots[i - 1];
				}
			} else {
				firstEmptyIndex = slots.slice(0, targetSlotIndex).indexOf(null);
				if (firstEmptyIndex < 0) {
                    console.log("No empty spot: ", this.slots);
					return false;
				}
				for (var i = firstEmptyIndex; i < targetSlotIndex; i++) {
					slots[i] = slots[i + 1];
				}
			}
         }
         console.log("targetSlotIndex", targetSlotIndex);
		 if (dropThis != null) {
			slots[targetSlotIndex] = dropThis;
		 }

		 slots.forEach((o, i) => {
			 if (o != null) {
				o.style.position = "absolute";
			o.style.left = `${r.left + wPerSlot * i}px`;
			o.style.top = `${r.top}px`;
			 }
		 });
		 if (dropThis == null) {
		 	slots = originalSLots;
		 }
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