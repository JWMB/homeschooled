import { Tools } from "./tools";

export class HtmlTools {
    static parseHtml(html: string) {
        const doc = (new window.DOMParser()).parseFromString(html, "text/html");
        const parseErrors = HtmlTools.getParseError(doc);
        if (parseErrors.length) {
            console.log(parseErrors);
            return null;
        }
        return doc;
    }
    static nodesToArray(nodes: NodeListOf<ChildNode>) {
        const entries = nodes.entries();
        return Tools.iteratorToArray(() => entries.next(), v => !!v.done).map(o => <HTMLElement>o.value[1]);
    }
    static childNodesToArray(parent: HTMLElement) {
        const entries = parent.childNodes.entries();
        return Tools.iteratorToArray(() => entries.next(), v => !!v.done).map(o => <HTMLElement>o.value[1]);
    }
    static getNodesXPath(doc: Document, xpath: string, parentNode: Node = null) {
        const iterator = doc.evaluate(xpath, parentNode || doc, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
        return Tools.iteratorToArray(() => <HTMLImageElement>iterator.iterateNext());
        // //external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse4.mm.bing.net%2Fth%3Fid%3DOIP.0HfCPE3NPYmPo76MPQQUJAHaE7%26pid%3DApi&f=1
        // console.log(nodes);
        // return nodes.map(n => ({ 
        //     src: new URL(n.getAttribute("src"), "https://localhost").searchParams.get("u"), 
        //     alt : n.getAttribute("alt")
        // }));
    }

    static getParseError(parsedDocument: Document) {
        // parser and parsererrorNS could be cached on startup for efficiency
        const parser = new DOMParser(),
            errorneousParse = parser.parseFromString('<', 'application/xml'),
            parsererrorNS = errorneousParse.getElementsByTagName("parsererror")[0].namespaceURI;
        const errorElements: HTMLCollectionOf<Element> = 
            parsererrorNS === 'http://www.w3.org/1999/xhtml' 
                ? parsedDocument.getElementsByTagName("parsererror") // In PhantomJS the parseerror element doesn't seem to have a special namespace, so we are just guessing here :(
                : parsedDocument.getElementsByTagNameNS(parsererrorNS, 'parsererror');

        const errors: string[] = [];
        for (let i = 0; i < errorElements.length; i++) {
            const item = errorElements.item(i);;
            for (let j = 0; j < item.children.length; j++) {
                const child = item.children.item(j);
                if (child.nodeName === "div") {
                    errors.push(child.innerHTML);
                }
            }
        }
        return errors;
    }
}