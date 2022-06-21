/** @internal */
export function create<T>(o: T, freeze?: false | undefined): T;
/** @internal */
export function create<T>(o: T, freeze?: true): Readonly<T>;
/** @internal */
export function create<T>(o: T, freeze = true): T | Readonly<T> {
  const obj = Object.assign(Object.create(null), o);
  return freeze ? Object.freeze(obj) : obj;
}
