import { Tools } from "./tools";

export class MarkdownTable {
	static perRow<T>(text: string, f: (row: string) => T): T[] {
		let index = 0;
		const result: T[] = [];
		while (true) {
			let eol = text.indexOf("\n", index);
			if (eol === -1) eol = text.length;
			const row = text.substring(index, eol);
			result.push(f(row));

			index = eol + 1;
			if (index >= text.length) break;
		}
		return result;
	}

	static parse(text: string) {
		let headerRowDone = false;
		let headerSectionDone = false;

		const rows = MarkdownTable.perRow(text, r => {
			const items = MarkdownTable.parseRow(r);
			if (items.length > 0) {
				if (!headerSectionDone) {
					if (!headerRowDone) {
						headerRowDone = true;
						return items;
					} else {
						if (items.filter(o => /[^-]/.test(o)).length > 0) throw new Error("Sub-header row items can only contain '-'");
						headerSectionDone = true;
					}
				} else {
					return items;
				}
			}
		});
		// while (true) {
		// 	let eol = text.indexOf("\n", index);
		// 	if (eol === -1) eol = text.length;
		// 	const row = text.substring(index, eol);
		// 	const items = MarkdownTable.parseRow(row);
		// 	if (items.length > 0) {
		// 		if (!headerSectionDone) {
		// 			if (header.length === 0) {
		// 				header = items;
		// 			} else {
		// 				if (items.filter(o => /[^-]/.test(o)).length > 0) throw new Error("Sub-header row items can only contain '-'");
		// 				headerSectionDone = true;
		// 			}
		// 		} else {
		// 			// console.log(items);
		// 			rows.push(items);
		// 		}
		// 	}
		// 	index = eol + 1;
		// 	if (index >= text.length) break;
		// }

		return Table.fromRows(rows);
	}
	private static parseRow(row: string) {
		const items = row.split(/[\^\s]*\|[$\s]*/g).map(o => o.trim());  // /(^|\s+)\|(\s+|$)/);	
		return items.slice(1, items.length); //rx yield one empty item at start & end
	}

	static toString(table: Table) {
		const numColumns = table.header.length;
		return `${renderRow(table.header)}\n${renderRow(new Array(numColumns).fill("---"))}\n${table.data.map(r => renderRow(r)).join("\n")}`;

		function renderRow(items: any[]) {
			return `| ${items.join(" | ")}`;
		}
	}
}

export class TsvTable {
	static parse(text: string) {
		return Table.fromRows(MarkdownTable.perRow(text, r => r.split("\t")));
	}
	static toString(table: Table) {
		return [[table.header.join("\t")]]
			.concat(table.data.map(r =>r.join("\t")))
			.join("\n");
	}
}

export class Table {
	header: string[];
	data: any[][];
	columns: {[name: string]: number};

	static fromRows(rows: any[][]) {
		const t = new Table();
		t.header = rows[0].map(o => o.toString());
		t.columns = Tools.arrayToObject(t.header, o => o, (o, i) => i);
		t.data = rows.slice(1).filter(o => o != null && o.length > 0);
		return t;
	}
	
	getAsObjects() {
		return this.data.map(row => {
			const obj: any = {};
			this.header.forEach((h, i) => obj[h] = row[i]);
			return obj;
		});
	}
	static createFromObjects(objs: any[]) {
		const t = new Table();

		const columnNames: string[] = [];
		t.data = objs.map(o => {
			const keys = Object.keys(o);
			const row = [];
			keys.forEach(k => {
				let colIndex = columnNames.indexOf(k);
				if (colIndex < 0) {
					columnNames.push(k);
					colIndex = columnNames.length - 1;
				}
				row[colIndex] = o[k];
			});
			return row;
		});
		t.header = columnNames;
		return t;
	}
	getCell(columnName: string, rowOrRowIndex: any[] | number) {
		if (typeof rowOrRowIndex == "number") {
			rowOrRowIndex = this.data[rowOrRowIndex];
		}
		return rowOrRowIndex[this.columns[columnName]];
	}
}