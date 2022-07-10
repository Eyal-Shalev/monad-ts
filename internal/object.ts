/** @internal */
export function create<T>(o: T, freeze?: false | undefined): T;
/** @internal */
export function create<T>(o: T, freeze?: true): Readonly<T>;
/** @internal */
export function create<T>(o: T, freeze = true): T | Readonly<T> {
  const obj = Object.assign(Object.create(null), o);
  return freeze ? Object.freeze(obj) : obj;
}

export type RecordIdentifier = string | number | symbol;

export function merge<
  TBase,
  TOther,
>(
  base: TBase,
  other: TOther,
  freeze?: false | undefined,
): TBase & TOther;
export function merge<
  TBase,
  TOther,
>(
  base: TBase,
  other: TOther,
  freeze?: true,
): Readonly<TBase & TOther>;
export function merge<
  TBase,
  TOther,
>(
  base: TBase,
  other: TOther,
  freeze = true,
): (TBase & TOther) | Readonly<TBase & TOther> {
  return freeze
    ? create({ ...base, ...other }, freeze)
    : create({ ...base, ...other });
}
