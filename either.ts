import { Bindable } from "./bindable.ts";
import { AssertionError } from "./internal/errors.ts";
import { create } from "./internal/object.ts";
import { ensureError } from "./internal/pure.ts";

const leftSymbol = Symbol("either::left");
const rightSymbol = Symbol("either::right");

export interface Right<R> extends Bindable<R> {
  readonly val: R;
  type: typeof rightSymbol;
  isRight: true;
}
export function right<R>(val: R) {
  return create<Right<R>>({
    val,
    isRight: true,
    type: rightSymbol,
    bind: (fn) => fn(val),
  });
}

export interface Left<L> extends Bindable<L> {
  readonly val: L;
  isRight: false;
  type: typeof leftSymbol;
}
export function left<L>(val: L) {
  return create<Left<L>>({
    val,
    isRight: false,
    type: leftSymbol,
    bind: (fn) => fn(val),
  });
}

export type Either<L, R> = Left<L> | Right<R>;

export const isRight = <L, R>(x: Either<L, R>): x is Right<R> => x.isRight;
export const isLeft = <L, R>(x: Either<L, R>): x is Left<L> => !x.isRight;

export function assertRight<L, R>(
  x: Either<L, R>,
  msg?: string,
): asserts x is Right<R> {
  if (!isRight(x)) throw new AssertionError(msg);
}

export function assertLeft<L, R>(
  x: Either<L, R>,
  msg?: string,
): asserts x is Left<L> {
  if (isRight(x)) throw new AssertionError(msg);
}

/**
 * ```ts
 * import {Either, wrap} from "./either.ts"
 * const x: Either<Error, number> = wrap(() => {
 *   const val = Math.random();
 *   if (val > 0.5) throw new Error();
 *   return val;
 * });
 * ```
 */
export function wrap<R>(fn: () => R): Either<Error, R> {
  try {
    return right(fn());
  } catch (err) {
    return left(ensureError(err));
  }
}
