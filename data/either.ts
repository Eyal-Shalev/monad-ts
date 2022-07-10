import { create } from "../internal/object.ts";
import { ensureError } from "../internal/pure.ts";
import { makeMatchFn, Matchable } from "../base/matchable.ts";

export const leftSymbol = Symbol("either::left");
export const rightSymbol = Symbol("either::right");

export interface Either<TLeft, TRight> extends Matchable<TLeft | TRight> {
  bind<TOther>(
    fn: (val: TRight) => Either<TLeft, TOther>,
  ): Either<TLeft, TOther>;
}

export const left = Object.assign(
  function left<TLeft, TRight = unknown>(val: TLeft): Either<TLeft, TRight> {
    const obj = create<Either<TLeft, TRight>>({
      bind,
      match: makeMatchFn(leftSymbol, val),
    });
    return obj;
    function bind<TOther>(): Either<TLeft, TOther> {
      return obj as Either<TLeft, unknown> as Either<TLeft, TOther>;
    }
  },
  { type: leftSymbol },
);

export function isLeft<T>(x: Matchable<T>) {
  try {
    return x.match([leftSymbol, () => true]);
  } catch {
    return false;
  }
}

export const right = Object.assign(
  function right<TRight, TLeft = unknown>(val: TRight): Either<TLeft, TRight> {
    return create<Either<TLeft, TRight>>({
      bind: (fn) => fn(val),
      match: makeMatchFn(rightSymbol, val),
    });
  },
  { type: rightSymbol },
);

export function isRight<T>(x: Matchable<T>) {
  try {
    return x.match([rightSymbol, () => true]);
  } catch {
    return false;
  }
}

export function isEither<T>(x: Matchable<T>): x is Either<T, T> {
  try {
    return x.match([rightSymbol, () => true], [leftSymbol, () => true]);
  } catch {
    return false;
  }
}

export function match<TLeft, TRight, TOut>(
  m: Either<TLeft, TRight>,
  onLeft: (_: TLeft) => TOut,
  onRight: (_: TRight) => TOut,
): TOut {
  return m.match(
    [leftSymbol, (x) => onLeft(x as TLeft)],
    [rightSymbol, (x) => onRight(x as TRight)],
  );
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
export function wrap<TRightVal>(fn: () => TRightVal): Either<Error, TRightVal> {
  try {
    return right(fn());
  } catch (err) {
    return left(ensureError(err));
  }
}
