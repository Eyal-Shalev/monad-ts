import { assertEquals } from "https://deno.land/std@0.144.0/testing/asserts.ts";
import { Bindable, extract } from "../bindable.ts";

/** @internal */
export function assertFirstLaw<T, M extends Bindable<T>>(
  init: T,
  unit: (_: T) => M,
  fn: (_: T) => M,
) {
  assertEquals(
    extract(fn(init)),
    extract(unit(init).bind(fn)),
    `${unit.name} is a left-identity for bind`,
  );
}

/** @internal */
export function assertSecondLaw<T, M extends Bindable<T>>(
  init: T,
  unit: (_: T) => M,
) {
  const ma = unit(init);
  assertEquals(
    extract(ma),
    extract(ma.bind(unit)),
    `${unit.name} is a right-identity for bind`,
  );
}

/** @internal */
export function assertThirdLaw<T, M extends Bindable<T>>(
  init: T,
  unit: (_: T) => M,
  f: (_: T) => M,
  g: (_: T) => M,
) {
  const ma = unit(init);
  assertEquals(
    extract(ma.bind(f).bind(g)),
    extract(ma.bind((x) => f(x).bind(g))),
    `${unit.name} is essentially associative`,
  );
}
