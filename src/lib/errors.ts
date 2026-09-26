import { ConversionError, type Diagnostic } from '@correlaid/formtransform';

/** A failed conversion as the UI shows it: one message, or a list of problems. */
export interface Failure {
	error: string | null;
	issues: string[];
}

/** Messages of the findings with this severity, without duplicates. */
export function messages(findings: readonly Diagnostic[], severity: Diagnostic['severity']) {
	return [...new Set(findings.filter((d) => d.severity === severity).map((d) => d.message))];
}

/**
 * A ConversionError that summarises several findings becomes a list; anything
 * else becomes its message, without an "Error:" prefix and with line breaks kept.
 */
export function describeFailure(e: unknown): Failure {
	if (e instanceof ConversionError && e.details.length) {
		return { error: null, issues: messages(e.details, 'error') };
	}
	return { error: e instanceof Error ? e.message : String(e), issues: [] };
}
