export class Ranges {
    ranges: {startInc?: number, endInc?: number}[] = [];
    static parse(ranges: string) {
        const rs = ranges.split(",");
        const r = new Ranges();
        r.ranges = rs.map(r => r.split("-").map(o => parseFloat(o)).map(o => isNaN(o) ? null : o)).map(o => ({ startInc: o[0], endInc: o[1] }));
        return r;
    }

    isIncluded(val: number) {
        return this.ranges.find(r => {
            if (r.startInc == null) return val <= r.endInc;
            if (r.endInc == null) return val >= r.startInc;
            return val >= r.startInc && val <= r.endInc;
        }) != null;
    }
}