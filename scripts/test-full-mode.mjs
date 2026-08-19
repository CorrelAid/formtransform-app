import { readFile, writeFile } from 'node:fs/promises';
import {
	XLSLoader,
	buildDdiXml,
	extractVariables,
	choicesByListFromRows,
	buildDataCsv
} from '@correlaid/formtransform';

const xlsxPath = process.argv[2];
const csvPath = process.argv[3];
const outXml = process.argv[4];
const outCsv = process.argv[5];

const xlsxBytes = await readFile(xlsxPath);
const csvText = (await readFile(csvPath)).toString('utf8');

const stripBom = (s) => (s.charCodeAt(0) === 0xfeff ? s.slice(1) : s);
const splitCsv = (line) => {
	const out = [];
	let cur = '';
	let inQuote = false;
	for (let i = 0; i < line.length; i++) {
		const c = line[i];
		if (inQuote) {
			if (c === '"' && line[i + 1] === '"') {
				cur += '"';
				i++;
			} else if (c === '"') {
				inQuote = false;
			} else cur += c;
		} else {
			if (c === '"') inQuote = true;
			else if (c === ',') {
				out.push(cur);
				cur = '';
			} else cur += c;
		}
	}
	out.push(cur);
	return out;
};
const lines = csvText.split(/\r?\n/).filter((l) => l.length > 0);
const headers = splitCsv(lines[0]).map(stripBom);
const submissions = lines.slice(1).map((line) => {
	const cells = splitCsv(line);
	const row = {};
	for (let i = 0; i < headers.length; i++) row[headers[i]] = cells[i] ?? '';
	return row;
});

const { surveyData, choicesData, settingsData } = XLSLoader.parseXLSData(new Uint8Array(xlsxBytes));
const variables = extractVariables(surveyData, choicesByListFromRows(choicesData));

const xml = buildDdiXml(surveyData, choicesData, {
	settings: settingsData[0],
	submissions
});
const csv = buildDataCsv(variables, submissions);

await writeFile(outXml, xml, 'utf8');
await writeFile(outCsv, csv, 'utf8');
console.log(`xml: ${xml.length} bytes -> ${outXml}`);
console.log(`csv: ${csv.length} bytes -> ${outCsv}`);
console.log('--- csv head ---');
console.log(csv);
