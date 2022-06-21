import { Bindable } from "./bindable.ts";
import { create } from "./internal/object.ts";
import { ensureError } from "./internal/pure.ts";

const leftSymbol = Symbol("either::left");
const rightSymbol = Symbol("either::right");

export type LeftVal<L> = { isRight: false; val: L };
export type RightVal<R> = { isRight: true; val: R };
export type EitherVal<L, R> = LeftVal<L> | RightVal<R>;

export interface Either<L, R> extends Bindable<EitherVal<L, R>> {
  readonly type: typeof leftSymbol | typeof rightSymbol;
  readonly isRight: boolean;
  readonly val: L | R;
  bindBoth<OL, OR>(
    leftFn: (val: L) => OL,
    rightFn: (val: R) => OR,
  ): Either<OL, OR>;
  bindLeft<OL>(fn: (val: L) => OL): Either<OL, R>;
  bindRight<OR>(fn: (val: R) => OR): Either<L, OR>;
}
export function either<L, R>(eitherVal: EitherVal<L, R>): Either<L, R> {
  const { val, isRight } = eitherVal;
  return create<Either<L, R>>({
    val,
    isRight,
    type: isRight ? rightSymbol : leftSymbol,
    bind: (fn) => fn(eitherVal),
    bindBoth(leftFn, rightFn) {
      return isRight ? right(rightFn(val)) : left(leftFn(val));
    },
    bindLeft: (fn) => isRight ? right(val) : left(fn(val)),
    bindRight: (fn) => isRight ? right(fn(val)) : left(val),
  });
}

type Left<L> = Either<L, never> & { isRight: false; val: L };
type Right<R> = Either<never, R> & { isRight: true; val: R };

export const left = <L, R>(val: L) =>
  either<L, R>({ isRight: false, val }) as Left<L>;
export const right = <L, R>(val: R) =>
  either<L, R>({ isRight: true, val }) as Right<R>;
export function wrap<R>(fn: () => R): Either<Error, R> {
  try {
    return right(fn());
  } catch (err) {
    return left(ensureError(err));
  }
}

export default create({ left, right, wrap });
