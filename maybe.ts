import { Bindable } from "./bindable.ts";
import { AssertionError } from "./internal/errors.ts";
import { create } from "./internal/object.ts";

const nothingSymbol = Symbol("maybe::none");
const justSymbol = Symbol("maybe::just");

export interface Just<T> extends Bindable<T> {
  readonly val: T;
  type: typeof justSymbol;
}
export function just<T>(val: T) {
  return create<Just<T>>({
    val,
    type: justSymbol,
    bind: (fn) => fn(val),
  });
}

export interface Nothing extends Bindable<void> {
  type: typeof nothingSymbol;
}
export const Nothing = create<Nothing>({
  type: nothingSymbol,
  bind: (fn) => fn(),
});
export function nothing(_: void) {
  return Nothing;
}

export type Maybe<T> = Nothing | Just<T>;

export function isJust<T>(x: Maybe<T>): x is Just<T> {
  return x.type === justSymbol;
}
export function isNothing(x: Maybe<unknown>): x is Nothing {
  return x === Nothing;
}

export function assertJust<T>(x: Maybe<T>, msg?: string): asserts x is Just<T> {
  if (!isJust(x)) throw new AssertionError(msg);
}
export function assertNothing(
  x: Maybe<unknown>,
  msg?: string,
): asserts x is Nothing {
  if (!isNothing(x)) throw new AssertionError(msg);
}

export function wrap<T>(fn: () => T): Maybe<T> {
  try {
    return just(fn());
  } catch {
    return Nothing;
  }
}
