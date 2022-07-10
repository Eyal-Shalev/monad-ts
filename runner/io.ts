import { create } from "../internal/object.ts";
import { makeMatchFn, Matchable } from "../base/matchable.ts";

export type GlobalThis = typeof globalThis;

const ioSymbol = Symbol("io");

export interface IO<TOut, TWorld = GlobalThis>
  extends Matchable<(w: TWorld) => TOut> {
  bind<TOther>(
    fn: (_: TOut) => IO<TOther, TWorld>,
  ): IO<TOther, TWorld>;
  bind<TOther>(_: IO<TOther, TWorld>): IO<TOther, TWorld>;
  run(w: TWorld): TOut;
}

/**
 * Example:
 * ```typescript
 * import { io } from "./io.ts";
 * import { isJust, just, Maybe, nothing } from "../data/maybe.ts";
 *
 * function log(msg?: string) {
 *   return io((w) => w.console.log(msg));
 * }
 * function prompt(msg?: string, defaultValue?: string) {
 *   return io((w): Maybe<string> => {
 *     const name = w.prompt(msg, defaultValue);
 *     return name ? just(name) : nothing();
 *   });
 * }
 *
 * const ask = prompt("What is your name?");
 * const greet = (maybeName: Maybe<string>) => {
 *   return maybeName.match(
 *     [just.type, (name) => log(`Greeting ${name}`)],
 *     [nothing.type, () => log("No need to be rude")],
 *   );
 * };
 *
 * ask.bind(greet).bind(log("Goodbye")).run(globalThis);
 * ```
 */
export function io<TOut, TWorld = GlobalThis>(
  val: (w: TWorld) => TOut,
): IO<TOut, TWorld> {
  return create({
    run: val,
    match: makeMatchFn(ioSymbol, val),
    bind(fnOrIO) {
      if (typeof fnOrIO === "function") {
        return io((w) => fnOrIO(val(w)).run(w));
      } else {
        return io((w) => (val(w), fnOrIO.run(w)));
      }
    },
  });
}
