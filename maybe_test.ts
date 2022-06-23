import { assertEquals, assertThrows } from "deno/testing/asserts.ts";
import { identity } from "./internal/pure.ts";
import { Matchable } from "./matchable.ts";
import { just, nothing, wrap } from "./maybe.ts";

function extract<T, M extends Matchable<T>>(m: M): [T | void, symbol] {
  return m.match(
    [just.type, (val) => [val, just.type]],
    [nothing.type, (val) => [val, nothing.type]],
  );
}

const half = (val: number) => just(val / 2);
const inc3 = (val: number) => just(val + 3);

Deno.test(function testFirstLaw() {
  const init = Math.random();
  assertEquals(
    extract(half(init)),
    extract(just(init).bind(half)),
    `${just.name} is a left-identity for bind`,
  );
});

Deno.test(function testSecondLaw() {
  const ma = just(Math.random());
  assertEquals(
    extract(ma),
    extract(ma.bind(just)),
    `${just.name} is a right-identity for bind`,
  );
});

Deno.test(function testThirdLaw() {
  const ma = just(Math.random());
  assertEquals(
    extract(ma.bind(half).bind(inc3)),
    extract(ma.bind((x) => half(x).bind(inc3))),
    `${just.name} is essentially associative`,
  );
});

Deno.test(function testWrap() {
  assertEquals(
    extract(just(42)),
    extract(wrap(() => 42)),
  );
  assertEquals(
    extract(nothing()),
    extract(wrap(() => {
      throw new Error("expected");
    })),
  );
});

Deno.test(function testMatch() {
  assertEquals(just(42).match([just.type, identity]), 42);
  assertEquals(nothing().match([nothing.type, identity]), void 0);
  assertThrows(() => just(42).match([nothing.type, identity]));
  assertThrows(() => nothing().match([just.type, identity]));
  assertEquals(
    just(42).match([nothing.type, identity], [just.type, identity]),
    42,
  );
  assertEquals(
    nothing().match([nothing.type, identity], [just.type, identity]),
    void 0,
  );
});
