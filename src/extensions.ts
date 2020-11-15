// https://medium.com/my-coding-life/extension-method-in-typescript-66d801488589
declare global {
    interface Number {
        thousandsSeperator(): String;
    }
    interface Array<T> {
        filterInstancesOf<U>(typeT: new (...params : any[]) => U): U[];
    }
}
Number.prototype.thousandsSeperator = function(): string {
    return Number(this).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
Array.prototype.filterInstancesOf = function(typeT: new (...params : any[]) => any): any[] {
    console.log("FFF", this);
    return this.filter(item => item instanceof typeT);
    // static getInstancesOf<T>(items: any[], typeT: new (...params : any[]) => T): T[] {
    //return items.filter(item => item instanceof typeT)
};

export {};
