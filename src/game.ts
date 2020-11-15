import { onMount } from "svelte";
import { CountryInfoX, CountryInfoCollection } from "./countryInfo";
import { Flags } from "./flags";
import { MyMap } from "./map";
import { Ranges } from "./ranges";
import { Tools } from "./tools";

interface CountriesFilter {
  countries: (country: CountryInfoX) => boolean;
  sizePercentiles?: string;
}

export class Game {
    score: number = 0;
    correctHistory: boolean[] = [];
    map: MyMap;
    countries: CountryInfoX[] = [];
    countriesCollection = new CountryInfoCollection();
    flags: Flags;
    lang = "sv";
    selectedCountry: CountryInfoX = null;
    acceptResponse: boolean = false;
    popupWindow: Window;
  
    async init() {
      this.map = new MyMap();
      const jsons = await Tools.fetchMultipleJson({
        // "sv": "/data/countries-sv.json", // https://github.com/stefangabos/world_countries/tree/master/data // pretty crap coverage, some 20-30 countries missing...
        // "en": "/data/countries-en.json", 
        "geo": "/data/geo.all-50.json" // https://geojson-maps.ash.ms/
      });
      this.flags = new Flags();
      await this.flags.load("/data/flags.xml");
  
      this.countriesCollection.init(await (await fetch("/data/countries-data.json")).json());

      this.countriesCollection.setTranslations(await Tools.fetchMultipleJson({ "sv": "/data/countries-sv.json" }));
      //Remove if we have no flag or translation
      console.log("No translation:", this.countriesCollection.get().filter(c => c.names[this.lang] == null));
      this.countriesCollection.remove(c => c.names[this.lang] == null);
      console.log("No flag:", this.countriesCollection.get().filter(c => this.flags.getSvg(c.cca2) == null));
      this.countriesCollection.remove(c => this.flags.getSvg(c.cca2) == null);

      //console.log(this.countriesCollection.get().map(c => `${c.cca2} ${c.name.common} ${c.names.sv}`));
      await this.map.create(this.countriesCollection, jsons["geo"]);
      await Tools.sleep(500);
  
  
      this.countries = this.countriesCollection.get()
        .filter(ci => this.map.getCountryBounds(ci.cca2) != null)
        .filter(ci => this.flags.getSvg(ci.cca2) != null);
      // countries = countriesCollection.getCountryNames(lang)
      //   .filter(name => map.getCountryData(name) !== null)
      //   .filter(name => flags.getSvg(countriesCollection.getCountryEntry(name).alpha2) !== null);
    }
  
    async selectCountry(target: any) {
        await this.generateProblem(target.selectedOptions[0].value);
    }
  
    getRandomUniqueItems<T>(arr:T[], numItems: number): T[] {
        const indices = new Array(numItems).fill(0).map((v, i) => Math.floor(Math.random() * (arr.length - i)));
        const copy = arr.concat([]);
        const result: T[] = [];
        for (let i = 0; i < numItems; i++) {
            const index = indices[i];
            result.push(copy[index]);
            copy.splice(index, 1);
        }
        return result;
    }

  correctAlternativeForShow: { id: string, name: string, flag: string };
  alternatives: { id: string, name: string, selected: boolean, flag: string }[] = [];
  private previousCorrectAnswers: CountryInfoX[] = [];

  async generateProblem(level: number = 1) {
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
        question: { countries: (country: CountryInfoX) => true }
      },
    ];

    const levelData = levelsData[Math.max(0, Math.min(levelsData.length - 1, level))];
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
        var r = Ranges.parse(filter.sizePercentiles);
        inLevel = inLevel.filter((c, i) => r.isIncluded(100 * i / inLevel.length));
      }
      return inLevel;
    }

    const questionSelection = createSelection(this.countries, levelData.question);
    const dontUseLatest = Tools.sliceFromEnd(this.previousCorrectAnswers, 3).map(o => o.cca2);
    this.selectedCountry = this.getRandomUniqueItems(questionSelection.filter(o => dontUseLatest.indexOf(o.cca2) < 0), 1)[0];
    // selectedCountry = "Ryssland"; // !!correctPreset ? this.countriesCollection.getCountryEntry(correctPreset) : 
    this.previousCorrectAnswers.push(this.selectedCountry);

    const possibleAlternatives = levelData.alternatives == null ? questionSelection : createSelection(this.countries, levelData.alternatives);
    const sortedByDistance = this.countriesCollection.getCenterDistances(this.selectedCountry, possibleAlternatives).sort((a, b) => a.dist - b.dist);
    // console.log(sortedByDistance);

    // Filter out non-complete countries
    const closeCountries = sortedByDistance.slice(0, Math.min(20, sortedByDistance.length - 1))
      .map(o => this.countriesCollection.getCountryName(o.name, this.lang)).filter(o => o != null);
    this.alternatives = this.generateAlternatives(closeCountries, this.selectedCountry);
  
    if (true) {
        this.correctAlternativeForShow = { ...this.alternatives.find(o => o.name === this.selectedCountry.names[this.lang])};
        if (false) {
        } else {
            this.correctAlternativeForShow.flag = null;
            this.alternatives.forEach(o => o.name = "");
        }
    }
  
    if (true) {
        document.getElementById("map").style.visibility = "hidden";
    } else {
    }
    this.acceptResponse = true;
  }
  
  generateAlternatives(fromCountries: string[], correctCountry: CountryInfoX, numTotalAlternatives: number = 3) {
    const selectedNames = this.getRandomUniqueItems(fromCountries.filter(c => c !== correctCountry.names[this.lang]), numTotalAlternatives - 1);
  
    // insert correct in random place:
    const index = Math.floor(Math.random() * (selectedNames.length + 1));
    if (index >= selectedNames.length) { selectedNames.push(correctCountry.names[this.lang]); }
    else { selectedNames.splice(index, 0, correctCountry.names[this.lang]); }
  
    const tmp = selectedNames.map(name => ({ translation: name, data: this.map.getCountryData(name)}));
    // const notFound = tmp.filter(o => !o.data || !this.flags.getSvg(o.data.entry.alpha2));
    // if (notFound.length) console.log("Not found:", notFound.map(o => o.translation + "/" + o.data.entry.alpha2), notFound.map(o => this.flags.getSvg(o.data.entry.alpha2)));
    return tmp.filter(o => !!o.data)
      .map(ctry => ({ id: ctry.data.entry.cca2, name: ctry.translation, flag: this.flags.getSvg(ctry.data.entry.cca2), selected: false, contour: ctry.data.feature }))
      .filter(o => !!o.flag && !!o.contour);
  }

  registerResponse(id: string): boolean {
    if (!this.acceptResponse) return false;
  
    this.alternatives.forEach(o => {
      o.name = this.countriesCollection.getCountryEntry(o.id).names[this.lang];
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
}
