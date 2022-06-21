import {
  assertEquals,
  assertNotEquals,
  assertThrows,
} from "deno/testing/asserts.ts";
import {
  assertLeft,
  assertRight,
  Either,
  left,
  right,
  wrap,
} from "./either.ts";
import { extract } from "./bindable.ts";
import {
  assertFirstLaw,
  assertSecondLaw,
  assertThirdLaw,
} from "./internal/test_utils.ts";

function makeDouble(unit: typeof left | typeof right) {
  return (val: number) => unit(val);
}

function makeToggle(unit: typeof left | typeof right) {
  if (unit === left) return right;
  else return left;
}

Deno.test(async function testFirstLaw(t) {
  for (const unit of [right, left]) {
    await t.step({
      name: unit.name,
      fn: () => assertFirstLaw(Math.random(), unit, makeDouble(unit)),
    });
  }
});

Deno.test(async function testSecondLaw(t) {
  for (const unit of [left, right]) {
    await t.step({
      name: unit.name,
      fn: () => assertSecondLaw(Math.random(), unit),
    });
  }
});

Deno.test(async function testThirdLaw(t) {
  for (const unit of [left, right]) {
    await t.step({
      name: unit.name,
      fn: () => {
        assertThirdLaw(Math.random(), unit, makeDouble(unit), makeToggle(unit));
      },
    });
  }
});

Deno.test(function testWrap() {
  assertEquals(
    extract(right(42)),
    extract<unknown>(wrap(() => 42)),
  );
  assertEquals(
    extract(left(new Error("expected"))),
    extract(wrap(() => {
      throw new Error("expected");
    })),
  );
});

Deno.test(function testUnit() {
  assertNotEquals(
    right(42),
    left(42) as Either<number, number>,
  );
});

Deno.test(function testAssertions() {
  assertRight(right(42));
  assertLeft(left(42));
  assertThrows(() => assertRight(left(42)));
  assertThrows(() => assertLeft(right(42)));
});
