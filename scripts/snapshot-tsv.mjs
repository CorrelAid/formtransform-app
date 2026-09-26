import { readFile } from 'node:fs/promises';
import { xlsformToLstsv } from '@correlaid/formtransform';

const overrides = JSON.parse(process.argv[3] || '{}');
const config = {
	convertWelcomeNote: true,
	convertEndNote: true,
	convertOtherPattern: true,
	convertMarkdown: true,
	hideNoAnswer: true,
	hideQuestionTips: true,
	...overrides
};

const path = process.argv[2];
const buf = await readFile(path);
const tsv = await xlsformToLstsv(buf, config);
process.stdout.write(tsv);
