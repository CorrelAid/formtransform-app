import { readFile, writeFile } from 'node:fs/promises';
import { XLSFormParser, XLSLoader, buildDdiXml, lstsvToDdiXml } from '@correlaid/formtransform';

const xlsxPath = process.argv[2];
const tsvPath = process.argv[3];
const outXlsxXml = process.argv[4];
const outTsvXml = process.argv[5];

const config = {
	convertWelcomeNote: true,
	convertEndNote: true,
	convertOtherPattern: true,
	convertMarkdown: true,
	hideNoAnswer: true,
	hideQuestionTips: true
};

if (typeof globalThis.alert === 'undefined') {
	globalThis.alert = () => {};
}

const xlsxBytes = await readFile(xlsxPath);
const tsvBytes = await readFile(tsvPath);

const tsv = tsvBytes.toString('utf8');

const { surveyData, choicesData, settingsData } = XLSLoader.parseXLSData(new Uint8Array(xlsxBytes));
const xlsxDdi = buildDdiXml(surveyData, choicesData, {
	assetName: undefined,
	settings: settingsData[0]
});

const tsvDdi = lstsvToDdiXml(tsv, { assetName: undefined });

await writeFile(outXlsxXml, xlsxDdi, 'utf8');
await writeFile(outTsvXml, tsvDdi, 'utf8');

console.log(`xlsx path:  ${xlsxDdi.length} bytes -> ${outXlsxXml}`);
console.log(`tsv path:   ${tsvDdi.length} bytes -> ${outTsvXml}`);
