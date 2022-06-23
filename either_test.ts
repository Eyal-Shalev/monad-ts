import { assertEquals, assertThrows } from "deno/testing/asserts.ts";
import { left, right, wrap } from "./either.ts";
import { identity } from "./internal/pure.ts";
import { Matchable } from "./matchable.ts";

function extract<T, M extends Matchable<T>>(m: M): [T | void, symbol] {
  return m.match(
    [right.type, (val) => [val, right.type]],
    [left.type, (val) => [val, left.type]],
  );
}

const half = (val: number) => right(val / 2);
const inc3 = (val: number) => right(val + 3);

Deno.test(function testFirstLaw() {
  const init = Math.random();
  assertEquals(
    extract(half(init)),
    extract(right(init).bind(half)),
    `${right.name} is a left-identity for bind`,
  );
});

Deno.test(function testSecondLaw() {
  const ma = right(Math.random());
  assertEquals(
    extract(ma),
    extract(ma.bind(right)),
    `${right.name} is a right-identity for bind`,
  );
});

Deno.test(function testThirdLaw() {
  const ma = right(Math.random());
  assertEquals(
    extract(ma.bind(half).bind(inc3)),
    extract(ma.bind((x) => half(x).bind(inc3))),
    `${right.name} is essentially associative`,
  );
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

Deno.test(function testMatch() {
  assertEquals(right(42).match([right.type, identity]), 42);
  assertEquals(left(42).match([left.type, identity]), 42);
  assertThrows(() => right(42).match([left.type, identity]));
  assertThrows(() => left(42).match([right.type, identity]));
  assertEquals(
    right(42).match([left.type, identity], [right.type, identity]),
    42,
  );
});
