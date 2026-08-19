// Main-thread proxy for the Pyodide worker. Keeps UI responsive while
// Python install + transforms run off-thread.

export type ProgressFn = (msg: string) => void;

type WorkerMessage =
	| { id: number; type: 'progress'; msg: string }
	| { id: number; type: 'result'; result: unknown }
	| { id: number; type: 'error'; error: string };

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<
	number,
	{ resolve: (v: unknown) => void; reject: (e: Error) => void; onProgress?: ProgressFn }
>();

function getWorker(): Worker {
	if (worker) return worker;
	worker = new Worker(new URL('./pyodide.worker.ts', import.meta.url), { type: 'module' });
	worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
		const { id, type } = e.data;
		const entry = pending.get(id);
		if (!entry) return;
		if (type === 'progress') {
			entry.onProgress?.(e.data.msg);
		} else if (type === 'result') {
			pending.delete(id);
			entry.resolve(e.data.result);
		} else {
			pending.delete(id);
			entry.reject(new Error(e.data.error));
		}
	};
	return worker;
}

function call<T>(
	cmd: 'kobo',
	xlsx: Uint8Array,
	csv: Uint8Array | null,
	title: string,
	onProgress?: ProgressFn
): Promise<T> {
	const id = ++nextId;
	return new Promise<T>((resolve, reject) => {
		pending.set(id, { resolve: resolve as (v: unknown) => void, reject, onProgress });
		getWorker().postMessage({ id, cmd, xlsx, csv, title });
	});
}

export function runKobo2Ddi(
	xlsxBytes: Uint8Array,
	csvBytes: Uint8Array | null,
	titleOverride: string,
	onProgress?: ProgressFn
): Promise<{ xml: string; csv: string | null }> {
	return call('kobo', xlsxBytes, csvBytes, titleOverride, onProgress);
}
