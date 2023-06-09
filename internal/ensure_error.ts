export function ensureError(error: unknown): Error {
	if (error === null || error === undefined) {
		return new Error();
	}
	if (error instanceof Error) {
		return error;
	}
	return new Error(String(error), { cause: error });
}
