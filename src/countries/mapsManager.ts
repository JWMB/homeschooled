import * as Leaf from "leaflet";

export class MapsManager {
	constructor() {
		const map = new Leaf.Map("div");
		map.createPane("labels");
	}
}
