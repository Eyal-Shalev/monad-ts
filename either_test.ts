import { assertEquals, assertNotEquals, fail } from "deno/testing/asserts.ts";
import { Either, either, EitherVal, left, right, wrap } from "./either.ts";
import { extract } from "./bindable.ts";
import {
  assertFirstLaw,
  assertSecondLaw,
  assertThirdLaw,
} from "./internal/test_utils.ts";
import { identity } from "./internal/pure.ts";

function double({ val, isRight }: EitherVal<number, number>) {
  return either({ val: val * 2, isRight });
}

function toggle({ val, isRight }: EitherVal<number, number>) {
  return either({ val, isRight: !isRight });
}

Deno.test(async function testFirstLaw(t) {
  for (const isRight of [true, false]) {
    await t.step({
      name: isRight ? "right" : "left",
      fn: () => assertFirstLaw({ isRight, val: Math.random() }, either, double),
    });
  }
});

Deno.test(async function testSecondLaw(t) {
  for (const isRight of [true, false]) {
    await t.step({
      name: isRight ? "right" : "left",
      fn: () => assertSecondLaw({ isRight, val: Math.random() }, either),
    });
  }
});

Deno.test(async function testThirdLaw(t) {
  for (const isRight of [true, false]) {
    await t.step({
      name: isRight ? "right" : "left",
      fn: () => {
        assertThirdLaw({ isRight, val: Math.random() }, either, double, toggle);
      },
    });
  }
});

Deno.test(function testWrap() {
  assertEquals(
    extract(right(42)),
    extract(wrap(() => 42)),
  );
  assertEquals(
    extract(left(new Error("expected"))),
    extract(wrap(() => {
      throw new Error("expected");
    })),
  );
});

Deno.test(function testUnit() {
  assertEquals(
    extract(right(42)),
    extract(either({ isRight: true, val: 42 })),
  );
  assertEquals(
    extract(left(42)),
    extract(either({ isRight: false, val: 42 })),
  );
  assertNotEquals(
    extract(right(42) as Either<number, number>),
    extract(left(42) as Either<number, number>),
  );
});

Deno.test(function testBind() {
  right(42).bindLeft(fail);
  left(42).bindRight(fail);

  right(42).bindBoth(fail, identity);
  left(42).bindBoth(identity, fail);
});
