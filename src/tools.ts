export class Tools {
    static async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }
    
    static async fetchMultipleX<T>(urls: string[], postProcess: (r: Response) => T) {
        const promises = urls.map(o => fetch(o));
        const results = await Promise.all(promises);
        const postProcessed = await Promise.all(results.map(async o => await postProcess(o)));
        return postProcessed;
    } 

    static async fetchMultiple<T>(idsUrls: {[name: string]: string}, 
        postProcess: (r: Response) => T)
        : Promise<{[name: string]: T}>
    {
        const asArray = Object.keys(idsUrls).map(k => ({ id: k, url: idsUrls[k] }));
        const promises = asArray.map(o => fetch(o.url));
        const results = await Promise.all(promises);
        const postProcessed = await Promise.all(results.map(async o => await postProcess(o)));
        const obj: {[name: string]: T} = {};
        asArray.forEach(async (v, i) => obj[v.id] = await postProcessed[i]);
        return obj;
    }
    static async fetchMultipleJson(idsUrls: {[name: string]: string}): Promise<{[name: string]: any}> {
        return await Tools.fetchMultiple(idsUrls, async r => await r.json());
    }
    static arrayToObject<T, U>(arr: U[], fGetKey: (obj: U) => string, fGetValue: (obj: U, index: number) => T) {
        const obj: {[name: string]: T} = {};
        arr.forEach((o, i) => obj[fGetKey(o)] = fGetValue(o, i));
        return obj;
    }
    static objectToArray<T>(obj: {[name: string]: any}, fCreateObj: (key: string, obj: any) => T) {
        return Object.keys(obj).map(k => fCreateObj(k, obj[k]));
    }

    static getInstancesOf<T>(items: any[], typeT: new (...params : any[]) => T): T[] {
        return items.filter(item => item instanceof typeT);
    }

    static sliceFromEnd<T>(items: T[], numFromEnd: number) {
        const len = items.length;
        return items.slice(len - Math.min(numFromEnd, len));
    }
    static distinctBy<T>(items: T[]): T[] {
        const found: T[] = [];
        items.forEach(item => {
            if (found.indexOf(item) < 0) found.push(item);
        });
        return found;
    }

    static iteratorToArray<T>(iterateNext: () => T, breakWhen: (item: T) => boolean = null) {
        const result: T[] = [];
        while (true) {
            const item = iterateNext();
            if (!item) break;
            if (!!breakWhen) {
                if (breakWhen(item)) {
                    break;
                }
            }
            result.push(item);
        }
        return result;
    }

    static insert<T>(arr: T[], index: number, ...items: T[]) {
        arr.splice(index, 0, ...items);
    }

    static flatten<T>(arr: T[][], depth: number = 1): T[] { 
        if (depth == 0) return <T[]><any>arr;
        return Tools.flatten([].concat.apply([], arr), depth - 1);
     }
    
    static getMinMax(arr: number[]) {
        return arr.reduce<{ min: number, max: number}>((p, c) => ({ min: Math.min(p.min, c), max: Math.max(p.max, c)}), { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY});
    }
    static getRandomUniqueItems<T>(arr:T[], numItems: number): T[] {
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

}
