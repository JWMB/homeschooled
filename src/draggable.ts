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

// const dispatch = createEventDispatcher<{ type: DragEventType }>();

// function triggerEvent(type: DragEventType) {
//     dispatch("type", type);
//     activeEvent = type;
// }

// function handleDragStart(e: DragEvent) {
//     triggerEvent("start");
//     e.dataTransfer.dropEffect = "move";
//     const t: any = e.target;
//     e.dataTransfer.setData("text", t.getAttribute('id'));
// }

// function handleDragEnd(e: DragEvent) {
//     triggerEvent("end");
//     if (dropped_in == false) {
//         // status = "You let the " + e.target.getAttribute('id') + " go.";
//     }
//     dropped_in = false;
// }

// function handleTouchStart(e) {
//     console.log("handleTouchStart");
//     // status = "Touch start with element " + e.target.getAttribute('id');
//     originalX = (e.target.offsetLeft - 10) + "px";
//     originalY = (e.target.offsetTop - 10) + "px";
//     triggerEvent("start");
// }

// function handleTouchMove(e) {
//     console.log("handleTouchMove");
//     const touchLocation = e.targetTouches[0];
//     const pageX = Math.floor((touchLocation.pageX - 50)) + "px";
//     const pageY = Math.floor((touchLocation.pageY - 50)) + "px";
//     // status = "Touch x " + pageX + " Touch y " + pageY;
//     e.target.style.position = "absolute";
//     e.target.style.left = pageX;
//     e.target.style.top = pageY;
//     triggerEvent("move");
// }

// function handleTouchEnd(e) {
//     console.log("handleTouchEnd");
//     e.preventDefault();
//     if (activeEvent === 'move') {
//         const pageX = (parseInt(e.target.style.left) - 50);
//         const pageY = (parseInt(e.target.style.top) - 50);

//         if (detectTouchEnd(drop_zone.offsetLeft, drop_zone.offsetTop, pageX, pageY, drop_zone.offsetWidth, drop_zone.offsetHeight)) {
//             // dropped = dropped.concat(e.target.id);
//             e.target.style.position = "initial";
//             dropped_in = true;
//             console.log("Droped in");
//             // status = "You dropped " + e.target.getAttribute('id') + " into drop zone";
//         } else {
//             e.target.style.left = originalX;
//             e.target.style.top = originalY;
//             console.log("Droped out");
//             // status = "You let the " + e.target.getAttribute('id') + " go.";
//         }
//     }
// }

// function detectTouchEnd(x1, y1, x2, y2, w, h) {
//     if (x2 - x1 > w) return false;
//     if (y2 - y1 > h) return false;
//     return true;
// }