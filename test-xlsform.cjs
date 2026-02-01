// Test with CommonJS syntax
const { XLSFormParser } = require('xlsform2lstsv');
console.log('✓ XLSFormParser imported successfully');
console.log('XLSFormParser:', typeof XLSFormParser);

if (typeof XLSFormParser.convertXLSDataToTSV === 'function') {
    console.log('✓ convertXLSDataToTSV method is available');
} else {
    console.log('✗ convertXLSDataToTSV method is not available');
}