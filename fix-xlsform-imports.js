import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// Fix the specific import issue in index.js
const indexPath = resolve('./node_modules/xlsform2lstsv/dist/index.js');
let indexContent = readFileSync(indexPath, 'utf8');

// Fix the xlsformConverter import by adding .js extension
const fixedIndexContent = indexContent.replace(
    /export { XLSFormToTSVConverter } from '\.\/xlsformConverter';/,
    "export { XLSFormToTSVConverter } from './xlsformConverter.js';"
);

if (fixedIndexContent !== indexContent) {
    writeFileSync(indexPath, fixedIndexContent);
    console.log('Fixed index.js import');
} else {
    console.log('index.js already has correct import');
}

// Also fix the ConfigManager import issue
const configManagerPath = resolve('./node_modules/xlsform2lstsv/dist/config/ConfigManager.js');
let configContent = readFileSync(configManagerPath, 'utf8');

const fixedConfigContent = configContent.replace(
    /import { deepMerge } from '\.\.\/utils\/helpers';/,
    "import { deepMerge } from '../utils/helpers.js';"
);

if (fixedConfigContent !== configContent) {
    writeFileSync(configManagerPath, fixedConfigContent);
    console.log('Fixed ConfigManager.js import');
} else {
    console.log('ConfigManager.js already has correct import');
}

console.log('Import fixes applied');