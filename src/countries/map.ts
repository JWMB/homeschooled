import * as L from 'leaflet';
import type { CountryInfoCollection } from './countryInfo';
import { Tools } from '../tools';

export class MyMap {
    async testA() {
        const mymap = L.map('map').setView([51.505, -0.09], 13);

        L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
            maxZoom: 18,
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            id: 'mapbox/streets-v11',
            tileSize: 512,
            zoomOffset: -1
        }).addTo(mymap);
    }

    async testB() {
        const map = L.map('map').setView([51.505, -0.09], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

        L.marker([51.5, -0.09]).addTo(map)
            .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
            .openPopup();
    }

    private countriesBorders: L.Polyline[];
    private map: L.Map;
    // private countryNames: CountryInfo[]; //{ names: any, alpha2: string }[]//{[key: string]: { names: any, alpha2: string}};
    private countryInfos: CountryInfoCollection;

    async create(countryInfos: CountryInfoCollection, geoJsonData: any) {
        this.countryInfos = countryInfos;
        return new Promise<void>(async (res, rej) => {
            await this._create(geoJsonData, () => res());
        });
    }
    async _create(geoJsonData: any, readyCallback?: () => void) {
        const map = new L.Map("map", { zoomControl: false, scrollWheelZoom: false });
        map.dragging.disable();

        const p = map.createPane('labels');
        p.style.zIndex = "650";
        p.style.pointerEvents = 'none';

        // any preload for tileLayers..?
        // https://leaflet-extras.github.io/leaflet-providers/preview/
        const tiles = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain-background/{z}/{x}/{y}{r}.png', {
        	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	        subdomains: 'abcd',
	        minZoom: 0,
	        maxZoom: 18,
            // ext: 'png'
        });
        // const tiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', { attribution: '©OpenStreetMap, ©CartoDB'});
        
        tiles.addTo(map);

        //const xx = "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png";
        // await fetch(xx);
        // const labels = L.tileLayer(xx, { attribution: '©OpenStreetMap, ©CartoDB', pane: 'labels'});
        // labels.addTo(map);
        //labels.on("load", () => console.log("all visible tiles have been loaded"));

        // https://github.com/hjnilsson/country-flags


        // const zgeojson = L.geoJSON(jsons["geo"], { style: { opacity: 0}, onEachFeature: f => console.log("feature", f) });
        const geojson = L.geoJSON(geoJsonData); //, { style: { opacity: 0, fill: false } });
        geojson.addTo(map);

        this.countriesBorders = Tools.getInstancesOf(geojson.getLayers(), L.Polyline);
        this.countryInfos.setBorders(this.countriesBorders);
        // this.countriesBorders = Tools.getInstancesOf(geojson.getLayers(), L.Polyline);
        // this.countriesBorders.forEach(pl => pl.bindPopup(pl.feature.properties.name));
        this.countriesBorders.forEach(l => l.setStyle({ stroke: false, color: "#ff0000", fill: false, fillColor: "#ff000088" }));

        // const country = this.countriesBorders.find(pl => pl.feature.properties.name == "Sweden");
        // const bounds = !!country ? country.getBounds() : geojson.getBounds();
        const bounds = geojson.getBounds();

        //geojson.getLayers().filterInstancesOf(L.Polyline).forEach(pl => pl.bindPopup(pl.feature.properties.name))
        map.fitBounds(bounds);
        this.map = map;
        if (!!readyCallback) {
            map.whenReady(() => {
                map.setZoom(1);
                // map.getRenderer(geojson.getLayer())
                // const r: L.Renderer = (<any>map)._renderer;
                //r.once("update", e => { console.log("lsls"); readyCallback(); });
                readyCallback();
            });
        }
    }

    private setCountryHilight(codeAlpha2OrName: string, highlight: boolean) {
        // const c = this.countryInfos.getCountryEntry(codeAlpha2OrName);
        // if (!c) return;
        const cd = this.getCountryData(codeAlpha2OrName);
        if (!cd) return;
        // const f = this.countriesBorders.find(pl => pl.feature.properties.name == c.names["en"]);
        cd.feature.setStyle({ stroke: highlight, fill: highlight });
    }

    private selectedCountries: string[] = [];

    selectCountry(codeAlpha2OrName: string | null) {
        this.selectedCountries.forEach(code => this.setCountryHilight(code, false));

        if (codeAlpha2OrName == null) {
            this.selectedCountries = [];
            return true;
        }

        const cd = this.getCountryData(codeAlpha2OrName);
        if (!cd) {
            console.log("Country not found", codeAlpha2OrName);
            return false;
        }

        this.selectedCountries = [cd.entry.cca2];
        this.selectedCountries.forEach(code => this.setCountryHilight(code, true));

        // document.getElementById("country-flag").innerHTML = this.getFlagSvg(codeAlpha2OrName) || "";

        return true;
    }

    getCountryData(codeAlpha2OrName: string, nullIfAnyEmpty: boolean = true) {
        const countryEntry = this.countryInfos.getCountryEntry(codeAlpha2OrName);
        const alpha2 = !!countryEntry ? countryEntry.cca2.toUpperCase(): null; //.names["en"]
        const found = this.countriesBorders.find(pl => pl.feature.properties.iso_a2 === alpha2); //name == name);
        return nullIfAnyEmpty && (!countryEntry || !found) ? null : { entry: countryEntry, feature: found };
    }

    getCountryBounds(country: string) {
        const cd = this.getCountryData(country);
        if (!cd) return null;
        const bounds = cd.feature.getBounds();
        // TODO: sometimes wraps around with bounds being larger than world?!
        return bounds;
    }

    fitCountries(codeAlpha2OrNames: string[]) {
        const bounds = codeAlpha2OrNames.map(o => this.getCountryBounds(o)).reduce((p, c) => c.extend(p));
        this.map.fitBounds(bounds);
    }
    
    async fitCountry(codeAlpha2OrName: string): Promise<void> {
        return new Promise<void>((res, rej) =>{
            let bounds = this.getCountryBounds(codeAlpha2OrName);
            if (!bounds) {
                rej("Country not found");
                return;
            }
            // const size = { 
            //     lat: Math.abs(bounds.getSouthEast().lat - bounds.getNorthWest().lat),
            //     lng: Math.abs(bounds.getSouthEast().lng - bounds.getNorthWest().lng)
            // };
            // Andorra: { lat: 0.208251953125, lng: 0.32539062499998295 }
            // Afghanistan: { lat: 9.064453125, lng: 14.405566406249996 }
    
            if (bounds.getEast() - bounds.getWest() > 180) {
                bounds = new L.LatLngBounds([bounds.getSouth(), bounds.getWest() + 360], [bounds.getNorth(), bounds.getEast()]);
            }
            // this.map.once("update", e => console.log("pda", e));
            const r: L.Renderer = (<any>this.map)._renderer;
            r.once("update", e => res());
            this.map.fitBounds(bounds);
        });
    }
    flyTo(country: string): Promise<void> {
        return new Promise<void>((res, rej) => {
            const bounds = this.getCountryBounds(country);
            this.map.once("zoomend", () => res());
            this.map.flyToBounds(bounds, { duration: 5 });
        });
    }
    zoomOut() {
        const bounds = this.map.getBounds();
        const finalZoom = 3; 
        const delta = this.map.getZoom() - finalZoom;
        const duration = delta * 2;
        // this.map.once("zoomend", () => { console.log("zoomend"); });

        this.map.flyTo(bounds.getCenter(), finalZoom, { duration: duration });
    }

}
