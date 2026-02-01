// Simple test to check if xlsform2lstsv works in the current environment
try {
    const { XLSFormParser } = require('xlsform2lstsv');
    console.log('✓ XLSFormParser imported successfully');
    console.log('XLSFormParser:', typeof XLSFormParser);
    
    if (typeof XLSFormParser.convertXLSDataToTSV === 'function') {
        console.log('✓ convertXLSDataToTSV method is available');
    } else {
        console.log('✗ convertXLSDataToTSV method is not available');
    }
} catch (error) {
    console.error('✗ Failed to import xlsform2lstsv:', error.message);
    console.error('Stack:', error.stack);
}