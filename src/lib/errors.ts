/** The message to show for a failed conversion: no "Error:" prefix, line breaks kept. */
export function errorMessage(e: unknown): string {
	return e instanceof Error ? e.message : String(e);
}
