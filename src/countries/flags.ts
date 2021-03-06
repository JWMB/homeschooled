import { HtmlTools } from "../htmlTools";
import { Tools } from "../tools";

export class Flags {
    private codeToSvg: {[name: string]: Element};

    async loadSeparate(path: string, cca2Array: string[]) {
        // create joined flags xml
        // https://github.com/hjnilsson/country-flags
        const flagUrls = cca2Array.map(o => ({ code: o, url: `${path}${o}.svg`}));
        const loaded = await Tools.fetchMultiple(Tools.arrayToObject(flagUrls, o => o.code, o => o.url), async r => await r.text());
        const joinedFlagsSvgs = Object.keys(loaded).map(k => {
            let xml = <string><any>loaded[k];
            xml = xml.replace(/<title>.+<\/title>/, "");
            if (xml.includes("xlink:href")) {
                const prefix = `svg_${k}_`;
                xml = xml.replace(/xlink:href=\"#([^\"])/g, `href=\"#${prefix}\$1`);
                xml = xml.replace(/\sid=\"([^\"])/g, ` id=\"${prefix}\$1`);
            }
            return `<div id="${k}"> ${xml}</div>`;
        }).join("\n");

        // console.log(joinedFlagsSvgs);
        this.loadDocument(joinedFlagsSvgs);
    }

    async load(url: string) {
        let xml = await (await fetch(url)).text();
        this.loadDocument(xml);
    }

    loadDocument(xml: string) {
        const document = HtmlTools.parseHtml(`<html>${xml}</html>`);
        const divs = HtmlTools.childNodesToArray(document.body).filter(o => o.nodeName === "DIV");
        this.codeToSvg = Tools.arrayToObject(divs, o => o.id, o => HtmlTools.nodesToArray(o.childNodes).find(n => n.nodeName === "svg"));
    }

    getSvg(codeAlpha2: string): string | null {
        return this.codeToSvg[codeAlpha2.toLowerCase()].outerHTML;
    }
}