import { HtmlTools } from "../htmlTools";
import type { LatLng } from "leaflet";
import { Tools } from "../tools";

export interface CountryInfoZZ {
    continent: string;
    subregion: string;
    alpha2: string;
    names: {[name: string]: string}; // translations
    center: LatLng;
}

export interface CountryInfoX {
    name: { 
        common: string, 
        official: string, 
        native: {[language: string]: {official: string, common: string }},
    };
    names: {[language: string]: string}; // not in json, added here rename translations
    tld: string[];
    cca2: string; // transformed to lowercase
    ccn3: string;
    cca3: string; 
    cioc: string;
    independent: boolean;
    status: "officially-assigned"; //
    unMember: boolean;
    currencies: {[code: string] : { name: string, symbol: string}};
    idd: { root: string, suffixes: string[]};
    capital: string[];
    altSpellings: string[];
    region: string;
    subregion: string;
    languages: {[code: string]: string};
    translations: {[code: string]: {official: string, common: string}};
    latlng: [number, number];
    landlocked: boolean;
    borders: string[]; //ccn3 codes? ["BWA","MOZ","ZAF","ZMB"]
    area: number;
    flag: string;
    demonyms: {[lang: string]: {f: string, m: string}};
    callingCodes: string[];
}

type TranslationEntry = {id: number, name: string, alpha2: string, alpha3: string};

export class CountryInfoCollection {
    private countries: CountryInfoX[];

    get() { return this.countries.slice(); }
    remove(func: (country: CountryInfoX) => boolean) {
        for (let i = this.countries.length - 1; i >= 0; i--) {
            if (func(this.countries[i])) {
                this.countries.splice(i, 1);
            }
        }
    }

    init(data: CountryInfoX[]) {
        data.forEach(c => {
            c.names = { "en": c.name.common };
            c.cca2 = c.cca2.toLowerCase();
        } );
        this.countries = data;
    }

    async loadImagesForCountry(country: string) {
        const searchPhrase = this.getSearchPhrase(this.getCountryName(country, "en"), "nature");
        const search = { 
          url: `https://google.com/search?q=${searchPhrase}&tbm=isch`,
          parser: CountryInfoCollection.getGoogleImageUrls
        };
        // const search = { 
        //   url: `https://duckduckgo.com/?q=${searchPhrase}&t=h_&iax=images&ia=images`,
        //   parser: CountryInfoCollection.getDDGImageUrls
        // };
      
        const endpoint = "http://localhost:5001/Scrape?url=" + encodeURIComponent(search.url);

        return new Promise<{ src: string, alt: string}[]>((res, rej) => {
            fetch(endpoint).then(r => r.text()).then(r => {
                const images = search.parser(r).filter(o => o.alt.toLowerCase().indexOf("map") < 0).slice(0, 5);
                res(images);
            });
        });
    }
    
    // https://raw.githubusercontent.com/mledoze/countries/master/dist/countries.json
    // TODO: fetch data from wikipedia?
    getSearchPhrase(country: string, what?: string) {
        country = this.getCountryEntry(country).names["en"];;
        what = what || ["nature", "buildings", "food", "clothing"][0];
        return `country "${country}" iconic ${what[0]} -site:pinterest.com -map`.replace(/ /g, "+");
    }

    static getGoogleImageUrls(html: string) {
        const doc = HtmlTools.parseHtml(html);
        const nodes = <HTMLImageElement[]>HtmlTools.getNodesXPath(doc, "//img[starts-with(@src,'data:image') and @data-atf='true']");
        return nodes.map(n => ({ 
            src: n.getAttribute("src"), 
            alt : n.getAttribute("alt")
        }));
    }
    static getDDGImageUrls(html: string) {
        const doc = HtmlTools.parseHtml(html);
        const nodes = <HTMLImageElement[]>HtmlTools.getNodesXPath(doc, "//img[contains(@class, 'tile')]");
        return nodes.map(n => ({ 
            src: new URL(n.getAttribute("src"), "https://localhost").searchParams.get("u"), 
            alt : n.getAttribute("alt")
        }));
    }

    borders: L.Polyline[];
    setBorders(borders: L.Polyline[]) {
        this.borders = borders;
        borders.forEach(b => {
            const ci = this.getCountryEntryByIso2(b.feature.properties.iso_a2);
            if (!ci) {
                // console.log("ftr", b.feature.properties.iso_a2.toLowerCase(), b.feature.properties.name);
                return;
            }
            // ci.continent = b.feature.properties.continent;
            ci.subregion = b.feature.properties.subregion;
        });
    }

    getCenterDistances(country: string | CountryInfoX, otherCountries: CountryInfoX[] = null) {
        const alpha2 = (typeof country === "string" ? this.getCountryEntry(country) : country).cca2.toUpperCase();
        const found = this.borders.find(pl => pl.feature.properties.iso_a2 === alpha2);
        if (!found) console.log("NOT FOUND", country);
        const center = found.getCenter();

        const borders = otherCountries == null ? this.borders
            : this.borders.filter(b => this.getCountryEntryByIso2(b.feature.properties.iso_a2) != null);

        return borders.map(b => ({ dist: CountryInfoCollection.getDistance(b.getCenter(), center), country: this.getCountryEntryByIso2(b.feature.properties.iso_a2) }));
    }

    static getDistance(c1: LatLng, c2: LatLng) {
        const R = 6371e3; // metres
        const φ1 = c1.lat * Math.PI/180; // φ, λ in radians
        const φ2 = c2.lat * Math.PI/180;
        const Δφ = (c2.lat-c1.lat) * Math.PI/180;
        const Δλ = (c2.lng-c1.lng) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c; // in metres
    }

    addTranslations(jsons: {[language: string]: TranslationEntry[]}) {
        // [{"id":20,"name":"Andorra","alpha2":"ad","alpha3":"and"},
        // const codeToIndex: {[key: string]: number} = {};
        // jsons["en"].forEach((v, i) => { codeToIndex[v.alpha2] = i; });
        // const countryNames = jsons["en"].map(o => ({ names: { "en": o.name, "sv": "" }, alpha2: o.alpha2 }));
        // jsons["sv"].forEach(o => {
        //     const index = codeToIndex[o.alpha2];
        //     if (index >= 0) countryNames[index].names["sv"] = o.name;
        //     else console.log(o.alpha2);
        // });
        Object.keys(jsons).forEach(lang => {
            const forLang = jsons[lang].filter(o => o.alpha2.length != 0);
            forLang.forEach(entry => {
                const found = this.countries.find(c => c.cca2.toLowerCase() == entry.alpha2.toLowerCase());
                if (!!found) {
                    found.names[lang] = entry.name;
                } else {
                    console.log("translation / not found", entry.alpha2.toLowerCase());
                }
            });
        });
    }

    getCountryEntryByIso2(iso2: string) {
        iso2 = iso2.toLowerCase();
        return this.countries.find(o => o.cca2 === iso2);
    }
    getCountryEntry(codeAlpha2OrName: string) {
        if (codeAlpha2OrName == null) return null;
        codeAlpha2OrName = codeAlpha2OrName.trim();
        return this.countries.find(o => 
            Tools.objectToArray(o.names, (k, obj) => <string>obj).concat(o.cca2).indexOf(codeAlpha2OrName) >= 0); //alpha2
    }
    getCountryNames(lang: string) {
        return this.get().map(o => o.names[lang]).sort();
    }
    getCountryName(country: string, lang: string) {
        return this.getCountryEntry(country)?.names[lang];
    }
}