export function ensureError(error: unknown): Error {
	return error instanceof Error ? error : new Error(String(error));
}

export type MaybePromise<T> = T | Promise<T>;
