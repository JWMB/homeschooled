export class DraggableX {
    static registerDragging(el: HTMLElement) {
        // el.ondragstart.
        el.addEventListener("ondragstart", (e: DragEvent) => { 
            console.log(e); 
            e.dataTransfer.dropEffect = "move";
        });
    }
    static unregisterDragging(el: HTMLElement) {
    }
}