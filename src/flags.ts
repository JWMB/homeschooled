import { HtmlTools } from "./htmlTools";
import { Tools } from "./tools";

export class Flags {
    private codeToSvg: {[name: string]: Element};

    async load(url: string) {
        if (false) {
            // // create joined flags xml
            // const flagUrls = this.countryInfos.get().map(o => o.alpha2).map(o => ({ code: o, url: `/data/svg/${o}.svg`}));
            // const loaded = await Tools.fetchMultiple(Tools.arrayToObject(flagUrls, o => o.code, o => o.url), async r => await r.text());
            // const joinedFlagsSvgs = Object.keys(loaded).map(k => `<div id="${k}"> ${(<string><any>loaded[k])}</div>`).join("\n");
            // // console.log(joinedFlagsSvgs);
        } else {
            const xml = await (await fetch(url)).text();
            // const flagsDocument = (new window.DOMParser()).parseFromString(`<html>${xml}</html>`, "text/xml");
            const document = HtmlTools.parseHtml(`<html>${xml}</html>`);
            //const titles = HtmlTools.getNodesXPath(document, "//title"); // TODO: why doesn't this work?
            const divs = HtmlTools.childNodesToArray(document.body).filter(o => o.nodeName === "DIV");
            // divs.forEach(d => console.log(HtmlTools.nodesToArray(d.childNodes).find(n => n.nodeName === "svg")));
            this.codeToSvg = Tools.arrayToObject(divs, o => o.id, o => HtmlTools.nodesToArray(o.childNodes).find(n => n.nodeName === "svg"));
        }
    }

    getSvg(codeAlpha2: string): string | null {
        return this.codeToSvg[codeAlpha2.toLowerCase()].outerHTML;
    }
}