import { writable, derived } from 'svelte/store';

export type Locale = 'en' | 'de';

export const locale = writable<Locale>('en');

const translations: Record<Locale, Record<string, string>> = {
	en: {
		// Layout
		'layout.imprint': 'Imprint',

		// Main page
		'page.title': 'FormTransform',
		'page.description': 'Upload an XLSForm file to convert it to LimeSurvey TSV format.',
		'page.fileLabel': 'Choose XLSForm file (.xlsx, .xls)',
		'page.conversionOptions': 'Conversion Options',
		'page.convertWelcomeNote': 'Convert welcome note',
		'page.convertWelcomeNoteDesc':
			'Promote a note named "welcome" to LimeSurvey\'s survey welcome text',
		'page.convertEndNote': 'Convert end note',
		'page.convertEndNoteDesc':
			'Promote a note named "end" to LimeSurvey\'s survey end text',
		'page.convertOtherPattern': 'Convert "other" pattern',
		'page.convertOtherPatternDesc':
			'Auto-detect the _other question pattern and set other=Y',
		'page.convertMarkdown': 'Convert Markdown',
		'page.convertMarkdownDesc': 'Parse labels/hints/notes as Markdown and convert to HTML',
		'page.hideNoAnswer': 'Hide "no answer"',
		'page.hideNoAnswerDesc':
			'Hide LimeSurvey\'s "no answer" option on non-mandatory questions',
		'page.convert': 'Convert',
		'page.converting': 'Converting...',
		'page.error': 'Error:',
		'page.result': 'Result',
		'page.question': 'question',
		'page.questions': 'questions',
		'page.group': 'group',
		'page.groups': 'groups',
		'page.download': 'Download TSV (.txt)',
		'page.previewTsv': 'Preview TSV',
		'page.footerText': 'This tool is based on the',
		'page.repoLink': 'xlsform2lstsv',
		'page.footerSuffix': 'package. For limitations and supported functionality, see the repository.',

		// Imprint page
		'imprint.title': 'Imprint',
		'imprint.hostedBy': 'This tool is hosted by',
		'imprint.correlaid': 'CorrelAid',
		'imprint.partOfCdl': ' within the ',
		'imprint.cdl': 'Civic Data Lab',
		'imprint.referenceText': 'For the full imprint, please refer to',
		'imprint.liability': 'Liability'
	},
	de: {
		// Layout
		'layout.imprint': 'Impressum',

		// Main page
		'page.title': 'FormTransform',
		'page.description':
			'Laden Sie eine XLSForm-Datei hoch, um sie in das LimeSurvey-TSV-Format zu konvertieren.',
		'page.fileLabel': 'XLSForm-Datei auswählen (.xlsx, .xls)',
		'page.conversionOptions': 'Konvertierungsoptionen',
		'page.convertWelcomeNote': 'Begrüßungsnotiz konvertieren',
		'page.convertWelcomeNoteDesc':
			'Eine Notiz mit dem Namen „welcome" als LimeSurvey-Begrüßungstext übernehmen',
		'page.convertEndNote': 'Endnotiz konvertieren',
		'page.convertEndNoteDesc':
			'Eine Notiz mit dem Namen „end" als LimeSurvey-Endtext übernehmen',
		'page.convertOtherPattern': '„Sonstige"-Muster konvertieren',
		'page.convertOtherPatternDesc':
			'Das _other-Fragemuster automatisch erkennen und other=Y setzen',
		'page.convertMarkdown': 'Markdown konvertieren',
		'page.convertMarkdownDesc':
			'Labels/Hinweise/Notizen als Markdown parsen und in HTML konvertieren',
		'page.hideNoAnswer': '„Keine Antwort" ausblenden',
		'page.hideNoAnswerDesc':
			'Die „Keine Antwort"-Option bei nicht-obligatorischen Fragen ausblenden',
		'page.convert': 'Konvertieren',
		'page.converting': 'Konvertiere...',
		'page.error': 'Fehler:',
		'page.result': 'Ergebnis',
		'page.question': 'Frage',
		'page.questions': 'Fragen',
		'page.group': 'Gruppe',
		'page.groups': 'Gruppen',
		'page.download': 'TSV herunterladen (.txt)',
		'page.previewTsv': 'TSV-Vorschau',
		'page.footerText': 'Dieses Tool basiert auf dem',
		'page.repoLink': 'xlsform2lstsv',
		'page.footerSuffix': 'Paket. Einschränkungen und unterstützte Funktionen sind im Repository dokumentiert.',

		// Imprint page
		'imprint.title': 'Impressum',
		'imprint.hostedBy': 'Dieses Tool wird bereitgestellt von',
		'imprint.correlaid': 'CorrelAid',
		'imprint.partOfCdl': ', als Teil des',
		'imprint.cdl': 'Civic Data Lab',
		'imprint.referenceText': 'Das vollständige Impressum finden Sie unter',
		'imprint.liability': 'Haftungsausschluss'
	}
};

export const t = derived(locale, ($locale) => {
	return (key: string): string => {
		return translations[$locale][key] ?? key;
	};
});
