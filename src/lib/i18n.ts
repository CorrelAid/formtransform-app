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
		'scope.notice':
			'**Scope: the CDL survey ecosystem.** FormTransform is not a general-purpose XLSForm converter. It transforms only the question types, appearances and expression syntax registered in the CDL survey type registry, and it targets the LimeSurvey and DDI conventions used inside the Civic Data Lab. A form using anything outside that subset is rejected rather than converted — the tool refuses instead of guessing.',
		'scope.link': 'Supported subset',
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
		'page.footerText': 'This tool is based on',
		'page.repoLink': '@correlaid/formtransform',
		'page.footerSuffix': '. For limitations and supported functionality, see the repository.',

		// Imprint page
		'imprint.title': 'Imprint',
		'imprint.hostedBy': 'This tool is hosted by',
		'imprint.correlaid': 'CorrelAid',
		'imprint.partOfCdl': ' within the ',
		'imprint.cdl': 'Civic Data Lab',
		'imprint.referenceText': 'For the full imprint, please refer to',
		'imprint.liability': 'Liability',

		// Tabs
		'tabs.xlsform': 'XLSForm → LimeSurvey TSV',
		'tabs.kobo': 'Kobo → DDI',
		'tabs.limesurvey': 'LimeSurvey → DDI',

		// Kobo/LimeSurvey DDI
		'kobo.hint': 'Upload an XLSForm. CSV export is optional — without it, only DDI metadata is generated.',
		'kobo.xlsxLabel': 'Choose XLSForm (.xlsx, .xls)',
		'kobo.csvLabel': 'Choose Kobo CSV export (XML values and headers)',
		'kobo.advancedOptions': 'Advanced options',
		'kobo.titleLabel': 'Survey title (override)',
		'kobo.titleHint': 'Defaults to form_title from the XLSForm settings sheet.',
		'kobo.titlePlaceholder': 'Leave blank to use form_title',
		'kobo.required': 'Required',
		'kobo.optional': 'Optional',
		'kobo.modeFull': 'Full mode: DDI XML + response CSV',
		'kobo.modeMetadata': 'Metadata-only mode: DDI XML (no responses)',
		'kobo.convert': 'Convert to DDI + CSV',
		'kobo.convertMetadata': 'Generate DDI metadata',
		'kobo.converting': 'Converting…',
		'kobo.downloadXml': 'Download DDI XML',
		'kobo.downloadCsv': 'Download CSV',
		'kobo.previewXml': 'Preview XML',
		'kobo.previewCsv': 'Preview CSV'
	},
	de: {
		// Layout
		'layout.imprint': 'Impressum',

		// Main page
		'page.title': 'FormTransform',
		'page.description':
			'Laden Sie eine XLSForm-Datei hoch, um sie in das LimeSurvey-TSV-Format zu konvertieren.',
		'scope.notice':
			'**Geltungsbereich: das CDL-Umfrage-Ökosystem.** FormTransform ist kein allgemeiner XLSForm-Konverter. Umgewandelt werden ausschließlich die Fragetypen, Darstellungsoptionen und Ausdruckssyntax, die in der CDL-Registry für Umfragetypen erfasst sind; Zielformate sind die LimeSurvey- und DDI-Konventionen des Civic Data Lab. Formulare, die etwas außerhalb dieser Teilmenge verwenden, werden abgelehnt statt konvertiert — das Tool rät nicht.',
		'scope.link': 'Unterstützte Teilmenge',
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
		'page.footerText': 'Dieses Tool basiert auf',
		'page.repoLink': '@correlaid/formtransform',
		'page.footerSuffix': '. Einschränkungen und unterstützte Funktionen sind im Repository dokumentiert.',

		// Imprint page
		'imprint.title': 'Impressum',
		'imprint.hostedBy': 'Dieses Tool wird bereitgestellt von',
		'imprint.correlaid': 'CorrelAid',
		'imprint.partOfCdl': ', als Teil des',
		'imprint.cdl': 'Civic Data Lab',
		'imprint.referenceText': 'Das vollständige Impressum finden Sie unter',
		'imprint.liability': 'Haftungsausschluss',

		// Tabs
		'tabs.xlsform': 'XLSForm → LimeSurvey TSV',
		'tabs.kobo': 'Kobo → DDI',
		'tabs.limesurvey': 'LimeSurvey → DDI',

		// Kobo/LimeSurvey DDI
		'kobo.hint': 'XLSForm hochladen. CSV-Export ist optional — ohne CSV werden nur DDI-Metadaten erzeugt.',
		'kobo.xlsxLabel': 'XLSForm wählen (.xlsx, .xls)',
		'kobo.csvLabel': 'Kobo-CSV-Export wählen (XML-Werte und -Header)',
		'kobo.advancedOptions': 'Erweiterte Optionen',
		'kobo.titleLabel': 'Umfragetitel (überschreiben)',
		'kobo.titleHint': 'Standard: form_title aus dem XLSForm-Settings-Sheet.',
		'kobo.titlePlaceholder': 'Leer lassen für form_title',
		'kobo.required': 'Pflicht',
		'kobo.optional': 'Optional',
		'kobo.modeFull': 'Vollmodus: DDI-XML + Antwort-CSV',
		'kobo.modeMetadata': 'Nur-Metadaten-Modus: DDI-XML (keine Antworten)',
		'kobo.convert': 'In DDI + CSV konvertieren',
		'kobo.convertMetadata': 'DDI-Metadaten erzeugen',
		'kobo.converting': 'Konvertiere…',
		'kobo.downloadXml': 'DDI-XML herunterladen',
		'kobo.downloadCsv': 'CSV herunterladen',
		'kobo.previewXml': 'XML-Vorschau',
		'kobo.previewCsv': 'CSV-Vorschau'
	}
};

export const t = derived(locale, ($locale) => {
	return (key: string): string => {
		return translations[$locale][key] ?? key;
	};
});
