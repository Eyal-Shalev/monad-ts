/** @internal */
export function identity<T = unknown>(val: T) {
  return val;
}

/** @internal */
export function ensureError(err: unknown) {
  if (err instanceof Error) {
    return err;
  }
  return new Error(String(err));
}
