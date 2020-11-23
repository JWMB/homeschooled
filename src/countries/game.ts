import { onMount } from "svelte";
import { CountryInfoX, CountryInfoCollection } from "./countryInfo";
import { Flags } from "./flags";
import { MyMap } from "./map";
import { Ranges } from "../ranges";
import { Tools } from "../tools";
import type { Stimulus, Game as GameBase, ProblemGenerator } from "../game";

interface CountriesFilter {
  countries: (country: CountryInfoX) => boolean;
  sizePercentiles?: string;
}

export class CountryProblemGenerator implements ProblemGenerator {
  stimuli: Stimulus[];
  inputs: Stimulus[];

  private previousCorrectAnswers: any[];

  async init() {
  }
  generateTask(level: number) {
  }
  registerResponse(inputId: any): { awaitingFurtherRespone: boolean; wasCorrect: boolean; } {
    throw new Error("Method not implemented.");
  }
}

export class Game implements GameBase {
    score: number = 0;
    correctHistory: boolean[] = [];
    map: MyMap;
    // countries: CountryInfoX[] = [];
    countriesCollection = new CountryInfoCollection();
    flags: Flags;
    lang = "sv";
    selectedCountry: CountryInfoX = null;
    acceptResponse: boolean = false;
    popupWindow: Window;
  
    async init(baseUrl: string) {
      this.map = new MyMap();
       // https://geojson-maps.ash.ms/ https://www.naturalearthdata.com/downloads/
      const jsons = await Tools.fetchMultipleJson({"geo": `${baseUrl}geo.all-50.json`});

      this.countriesCollection.init(await (await fetch(`${baseUrl}countries-data.json`)).json());

      this.flags = new Flags();
      //await this.flags.loadSeparate("/data/svg/", this.countriesCollection.get().map(o => o.cca2));
      await this.flags.load(`${baseUrl}flags.xml`);

      this.countriesCollection.addTranslations(await Tools.fetchMultipleJson({ "sv": `${baseUrl}countries-sv.json` }));
      //Remove if we have no flag or translation
      // console.log("No translation:", this.countriesCollection.get().filter(c => c.names[this.lang] == null).map(c => `"name":"${c.name.common}","alpha2":"${c.cca2}"`));
      this.countriesCollection.remove(c => c.names[this.lang] == null);
      // console.log("No flag:", this.countriesCollection.get().filter(c => this.flags.getSvg(c.cca2) == null));
      this.countriesCollection.remove(c => this.flags.getSvg(c.cca2) == null);
      this.countriesCollection.remove(c => !c.independent);

      //console.log(this.countriesCollection.get().map(c => `${c.cca2} ${c.name.common} ${c.names.sv}`));
      await this.map.create(this.countriesCollection, jsons["geo"]);
      await Tools.sleep(500);
  
      // this.countries = this.countriesCollection.get()
      //   .filter(ci => this.map.getCountryBounds(ci.cca2) != null);
    }
  
    investigateSplitRegions(geo: any) {
      const xx = geo.features.filter(o => o.type == "Feature" && o.geometry.type == "MultiPolygon")
        .filter(o => o.properties.name == "France");
      console.log(xx.map(o => `${o.properties.iso_a2} ${o.properties.name} ${XX(o.geometry.coordinates)}`).join("\n"));
  
      function XX(coordinates: [number, number][][][]) {
      const allBounds = coordinates.map(cset => {
        const bounds = cset.map(sub => {
          const longs = Tools.getMinMax(sub.map(o => o[0]));
          const lats = Tools.getMinMax(sub.map(o => o[1]));
          return { w: longs.min, e: longs.max, n: lats.max, s: lats.min };
          //return `long:${longs.min} - ${longs.max} lat:${lats.min} - ${lats.max}`;
        });
        return bounds;
      });
  
      const flattened = Tools.flatten(allBounds, 2);
      const boundsAreas = flattened.map(b => (b.e - b.w) * (b.n - b.s));
      const ordered = boundsAreas.sort((a, b) => b - a);
      const factors = ordered.map(o => o / ordered[0]);
      return "ordered: " + factors.join(",");
      }
    }
  
  correctAlternativeForShow: Stimulus; // { id: string, title: string, html: string };
  alternatives: Stimulus[] = []; //{ id: string, title: string, selected: boolean, html: string }[] = [];
  private previousCorrectAnswers: CountryInfoX[] = [];

  generateProblem(level: number = 0) {
    // TODO: Difficulty level based on 
    // * Correct country: size, distance from home
    // * Alternatives: country size, distance from correct
  
    function fRegion(ci: CountryInfoX) { return `${ci.region}/${ci.subregion}/${ci.names["en"]}`; }
    function fRegionMatch(matches: RegExp[], ci: CountryInfoX) {
      const forMatch = fRegion(ci);
      return matches.find(m => m.test(forMatch)) != null;
    }

    const levelsData: {question: CountriesFilter, alternatives?: CountriesFilter}[] = [
      {
        question: {
          countries: (country: CountryInfoX) => fRegionMatch([/Europe\/Northern/], country),
          sizePercentiles: "50-" },
        alternatives: {
          countries: (country: CountryInfoX) => fRegionMatch([/Europe\/(Northern)/], country),
        }
      },
      {
        question: { countries: (country: CountryInfoX) => fRegionMatch([/Europe\/(Northern|Western)/], country) }
      },
      {
        question: { countries: (country: CountryInfoX) => fRegionMatch([/Europe\//], country) }//Southern Western
      },
      { 
        question: { countries: (country: CountryInfoX) => fRegionMatch([/Americas\/(Northern|South)/], country) }
      },
      { 
        question: { countries: (country: CountryInfoX) => fRegionMatch([/Asia\/(Eastern|South-Eastern)/], country) }
      },
      { 
        question: { countries: (country: CountryInfoX) => true }
      },
    ];

    const inLevelVariants = 3;
    const xLevel = Math.floor(level / inLevelVariants);
    const levelData = levelsData[Math.max(0, Math.min(levelsData.length - 1, xLevel))];
    // 0: "Africa/Eastern Africa"
    // 1: "Africa/Middle Africa"
    // 2: "Africa/Northern Africa"
    // 3: "Africa/Southern Africa"
    // 4: "Africa/Western Africa"
    // 5: "Americas/Caribbean"
    // 6: "Americas/Central America"
    // 7: "Americas/Northern America"
    // 8: "Americas/South America"
    // 9: "Asia/Central Asia"
    // 10: "Asia/Eastern Asia"
    // 11: "Asia/South-Eastern Asia"
    // 12: "Asia/Southern Asia"
    // 13: "Asia/Western Asia"
    // 14: "Europe/Eastern Europe"
    // 15: "Europe/Northern Europe"
    // 16: "Europe/Southern Europe"
    // 17: "Europe/Western Asia"
    // 18: "Europe/Western Europe"
    // 19: "Oceania/Australia and New Zealand"
    // 20: "Oceania/Melanesia"
    // 21: "Oceania/Micronesia"
    // 22: "Oceania/Polynesia"
        // const matches = [
    //   /(Africa\/[^\/]*\/(South Africa|Morocco|Ethiopia|Egypt))/,
    //   /Europe\//,
    //   /Oceania\/Australia and New Zealand/,
    //   /North America\/(Northern|Central)/,
    // ];
    // console.log(Tools.distinctBy(this.countries.map(ci => `${ci.region}/${ci.subregion}`).sort()));

    function createSelection(countries: CountryInfoX[], filter: CountriesFilter) {
      let inLevel = countries.filter(filter.countries).sort((a, b) => b.area - a.area);
      if (!!filter.sizePercentiles) {
        const r = Ranges.parse(filter.sizePercentiles);
        inLevel = inLevel.map((c, i) => ({ country: c, percentile: 100 * (1 - i / inLevel.length) }))
          .filter(o => r.isIncluded(o.percentile))
          .map(o => o.country);
      }
      return inLevel;
    }

    const questionSelection = createSelection(this.countriesCollection.get(), levelData.question);
    this.map.fitCountries(questionSelection.map(o => o.cca2));
    // console.log(level, questionSelection);
    const dontUseLatest = Tools.sliceFromEnd(this.previousCorrectAnswers, 3).map(o => o.cca2);
    this.selectedCountry = Tools.getRandomUniqueItems(questionSelection.filter(o => dontUseLatest.indexOf(o.cca2) < 0), 1)[0];
    // selectedCountry = "Ryssland"; // !!correctPreset ? this.countriesCollection.getCountryEntry(correctPreset) : 
    this.previousCorrectAnswers.push(this.selectedCountry);

    const possibleAlternatives = levelData.alternatives == null ? questionSelection : createSelection(this.countriesCollection.get(), levelData.alternatives);
    const sortedByDistance = this.countriesCollection.getCenterDistances(this.selectedCountry, possibleAlternatives).sort((a, b) => a.dist - b.dist);
    // console.log(sortedByDistance);

    // Filter out non-complete countries
    const closeCountries = sortedByDistance.slice(0, Math.min(20, sortedByDistance.length - 1))
      .map(o => this.countriesCollection.getCountryName(o.name, this.lang)).filter(o => o != null);
    this.alternatives = this.generateAlternatives(closeCountries, this.selectedCountry);
  
    const variant = level % inLevelVariants;
    this.correctAlternativeForShow = { ...this.alternatives.find(o => o.title === this.selectedCountry.names[this.lang])};
    if (variant === 0) {
      this.correctAlternativeForShow.html = null;
      this.alternatives.forEach(o => o.title = "");
      this.map.selectCountry(this.selectedCountry.cca2);

    } else if (variant === 1) {
      this.correctAlternativeForShow.title = "";
      this.alternatives.forEach(o => o.html = null);
      this.map.selectCountry(this.selectedCountry.cca2);

    } else {
      this.correctAlternativeForShow.title = this.selectedCountry.capital[0];
      this.correctAlternativeForShow.html = null;
      this.alternatives.forEach(o => o.title = "");
      this.map.selectCountry(null);
    }
    // this.map.fitCountry(this.selectedCountry.cca2);
    // this.map.zoomOut();

    this.acceptResponse = true;
  }
  
  generateAlternatives(fromCountries: string[], correctCountry: CountryInfoX, numTotalAlternatives: number = 3) {
    const selectedNames = Tools.getRandomUniqueItems(fromCountries.filter(c => c !== correctCountry.names[this.lang]), numTotalAlternatives - 1);
  
    // insert correct in random place:
    const index = Math.floor(Math.random() * (selectedNames.length + 1));
    if (index >= selectedNames.length) { selectedNames.push(correctCountry.names[this.lang]); }
    else { selectedNames.splice(index, 0, correctCountry.names[this.lang]); }
  
    const tmp = selectedNames.map(name => ({ translation: name, data: this.map.getCountryData(name)}));
    // const notFound = tmp.filter(o => !o.data || !this.flags.getSvg(o.data.entry.alpha2));
    // if (notFound.length) console.log("Not found:", notFound.map(o => o.translation + "/" + o.data.entry.alpha2), notFound.map(o => this.flags.getSvg(o.data.entry.alpha2)));
    return tmp.filter(o => !!o.data)
      .map(ctry => ({ id: ctry.data.entry.cca2, title: ctry.translation, html: this.flags.getSvg(ctry.data.entry.cca2), selected: false, contour: ctry.data.feature }))
      .filter(o => !!o.html && !!o.contour);
  }

  registerResponse(id: string): boolean {
    if (!this.acceptResponse) return false;
  
    this.alternatives.forEach(o => {
      o.title = this.countriesCollection.getCountryEntry(o.id).names[this.lang];
    });

    const wasCorrect = id === this.selectedCountry.cca2;
    this.correctHistory.push(wasCorrect);

    this.acceptResponse = false;
    if (wasCorrect) {
        this.score += 10;
        return true;
    } else {
        this.score -= 5;
        const correctAlternative = this.alternatives.find(o => o.id == this.selectedCountry.cca2);
        correctAlternative.selected = true;
    
        this.map.selectCountry(id);
        return false;
    }
  }

  async responseFeedback(wasCorrect: boolean, chosenId: string) {
    if (!wasCorrect) {
      await this.map.flyTo(chosenId);
      await Tools.sleep(1000);
      }
    }

}
