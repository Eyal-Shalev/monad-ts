import { MatchError } from "./internal/errors.ts";

export type Matcher<T, O> = [symbol, (_: T) => O];

export interface Matchable<T> {
  match<O>(matcher: Matcher<T, O>): O;
  match<O>(...matchers: Matcher<T, O>[]): O;
}

export function makeMatchFn<T>(targetType: symbol, val: T) {
  return function match<O>(
    matcher: Matcher<T, O>,
    ...matchers: Matcher<T, O>[]
  ) {
    matchers = [matcher, ...matchers];
    for (const [type, fn] of matchers) {
      if (type === targetType) return fn(val);
    }
    const [type, ...types] = matchers.map((x) => x[0]);
    throw new MatchError(type, ...types);
  };
}
