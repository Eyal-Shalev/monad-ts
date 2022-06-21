import {
  assertEquals,
  assertNotEquals,
  assertThrows,
} from "deno/testing/asserts.ts";
import {
  assertJust,
  assertNothing,
  just,
  Nothing,
  nothing,
  wrap,
} from "./maybe.ts";
import { extract } from "./bindable.ts";
import {
  assertFirstLaw,
  assertSecondLaw,
  assertThirdLaw,
} from "./internal/test_utils.ts";

const double = (val: number) => just(val * 2);

Deno.test(async function testFirstLaw(t) {
  await t.step({
    name: just.name,
    fn: () => assertFirstLaw(Math.random(), just, double),
  });
  await t.step({
    name: nothing.name,
    fn: () => assertFirstLaw<void, Nothing>(void 0, nothing, nothing),
  });
});

Deno.test(async function testSecondLaw(t) {
  await t.step({
    name: just.name,
    fn: () => assertSecondLaw(Math.random(), just),
  });
  await t.step({
    name: nothing.name,
    fn: () => assertSecondLaw<void, Nothing>(void 0, nothing),
  });
});

Deno.test(async function testThirdLaw(t) {
  await t.step({
    name: just.name,
    fn: () => assertThirdLaw(Math.random(), just, double, double),
  });
  await t.step({
    name: nothing.name,
    fn: () => assertThirdLaw<void, Nothing>(void 0, nothing, nothing, nothing),
  });
});

Deno.test(function testWrap() {
  assertEquals(
    extract(just(42)),
    extract<unknown>(wrap(() => 42)),
  );
  assertEquals(
    extract(nothing()),
    extract(wrap(() => {
      throw new Error("expected");
    })),
  );
});

Deno.test(function testUnit() {
  assertNotEquals(
    extract(just(42)),
    extract<unknown>(nothing()),
  );
});

Deno.test(function testAssertions() {
  assertJust(just(42));
  assertNothing(nothing());
  assertEquals(nothing(), Nothing);
  assertThrows(() => assertJust(nothing()));
  assertThrows(() => assertNothing(just(42)));
});
