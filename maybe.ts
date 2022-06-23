import { create } from "./internal/object.ts";
import { makeMatchFn, Matchable } from "./matchable.ts";

const nothingSymbol = Symbol("maybe::none");
const justSymbol = Symbol("maybe::just");

export interface Maybe<TVal> extends Matchable<void | TVal> {
  bind<TOther>(fn: (val: TVal) => Maybe<TOther>): Maybe<TOther>;
}

export const nothing = Object.assign(
  function nothing<TVal = unknown>(_: void): Maybe<TVal> {
    const obj = create<Maybe<TVal>>({
      bind,
      match: makeMatchFn(nothingSymbol, void 0),
    });
    return obj;
    function bind<TOther>(): Maybe<TOther> {
      return obj as Maybe<unknown> as Maybe<TOther>;
    }
  },
  { type: nothingSymbol },
);

export function isNothing<T>(x: Matchable<T>) {
  try {
    return x.match([nothingSymbol, () => true]);
  } catch {
    return false;
  }
}

export const just = Object.assign(
  function just<TVal>(val: TVal): Maybe<TVal> {
    return create<Maybe<TVal>>({
      bind: (fn) => fn(val),
      match: makeMatchFn(justSymbol, val),
    });
  },
  { type: justSymbol },
);

export function isJust<T>(x: Matchable<T>) {
  try {
    return x.match([justSymbol, () => true]);
  } catch {
    return false;
  }
}

export function isMaybe<TVal>(x: Matchable<TVal>): x is Maybe<TVal> {
  try {
    return x.match([justSymbol, () => true], [nothingSymbol, () => true]);
  } catch {
    return false;
  }
}

/**
 * ```ts
 * import {Maybe, wrap} from "./maybe.ts"
 * const x: Maybe<number> = wrap(() => {
 *   const val = Math.random();
 *   if (val > 0.5) throw new Error();
 *   return val;
 * });
 * ```
 */
export function wrap<TVal>(fn: () => TVal): Maybe<TVal> {
  try {
    return just(fn());
  } catch {
    return nothing();
  }
}
