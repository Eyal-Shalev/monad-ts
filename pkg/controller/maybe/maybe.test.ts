import { assert, assertEquals, assertStrictEquals, assertThrows, fail } from "deno-std/testing/asserts.ts";
import { describe, it } from "deno-std/testing/bdd.ts";
import { isJust, isMaybe, isNothing, Just, Nothing, safeExecute, safeExecuteAsync, unit } from "./maybe.ts";

describe("Maybe", () => {
	describe("Just", () => {
		it("Contains a value", () => {
			const value = Math.random();
			assertStrictEquals(Just(value).value, value);
		});
		it("isJust is true", () => {
			assertStrictEquals(Just(42).isJust, true);
		});
		it("isNothing is false", () => {
			assertStrictEquals(Just(42).isNothing, false);
		});
		it("bind (>>==) applies the function to the value", () => {
			const value = Math.random();
			const f = (x: number) => unit(x + 1);
			assertStrictEquals(Just(value).bind(f).value, f(value).value);
		});
		it("lift (>>=) applies the function to the value and wraps it in a Just", () => {
			const value = Math.random();
			const f = (x: number) => x + 1;
			assertStrictEquals(Just(value).lift(f).value, f(value));
		});
		it("concat (<>), when given another Just, returns the other Just", () => {
			const value = Math.random();
			const other = Just(value + 1);
			assertStrictEquals(Just(value).concat(other).value, other.value);
		});
		it("concat (<>), when given Nothing, returns Nothing", () => {
			const value = Math.random();
			assertStrictEquals(Just(value).concat(Nothing), Nothing);
		});
	});

	describe("Nothing", () => {
		it("has no value", () => {
			assertThrows(() => Nothing.value);
		});
		it("isNothing is true", () => {
			assertStrictEquals(Nothing.isNothing, true);
		});
		it("isJust is false", () => {
			assertStrictEquals(Nothing.isJust, false);
		});
		it("bind (>>==) ignores the function", () => {
			const f = (_: unknown) => fail("Expected Nothing to ignore bind");
			assertStrictEquals(Nothing.bind(f), Nothing);
		});
		it("lift (>>=) ignores the function", () => {
			const f = (_: unknown) => fail("Expected Nothing to ignore lift");
			assertStrictEquals(Nothing.lift(f), Nothing);
		});
		it("concat (<>) ignores the function", () => {
			const other = Just(Math.random());
			assertStrictEquals(Nothing.concat(other), Nothing);
		});
	});

	describe("3 monadic laws", () => {
		it("unit is a left-identity for bind: unit(x) >>= f <-> f(x)", () => {
			const value = Math.random();
			const f = (x: number) => unit(x + 1);
			assertStrictEquals(unit(value).bind(f).value, f(value).value);
		});
		it("unit is right-identity for bind: ma >>= unit <-> ma", () => {
			const m = unit(Symbol("value"));
			assertStrictEquals(m.bind(unit).value, m.value);
		});
		it("bind is associative: ma >>= λx → (f(x) >>= g) <-> (ma >>= f) >>= g", () => {
			const value = Math.random();
			const m = unit(value);
			const f = (x: number) => unit(x + 1);
			const g = (x: number) => unit(x * 2);
			assertEquals(
				m.bind((x) => f(x).bind(g)).value,
				m.bind(f).bind(g).value,
			);
		});
	});

	describe("Guard functions work as expected", () => {
		it("isMaybe returns true for Maybe values", () => {
			assertStrictEquals(isMaybe(Just(42)), true);
			assertStrictEquals(isMaybe(Nothing), true);
		});
		it("isMaybe returns false for non-Maybe values", () => {
			for (const value of [42, "42", {}, [], null, undefined]) {
				assertStrictEquals(isMaybe(value), false);
			}
		});
		it("isJust returns true for Just values", () => {
			assertStrictEquals(isJust(Just(42)), true);
		});
		it("isJust returns false for Nothing", () => {
			assertStrictEquals(isJust(Nothing), false);
		});
		it("isNothing returns true for Nothing", () => {
			assertStrictEquals(isNothing(Nothing), true);
		});
		it("isNothing returns false for Just values", () => {
			assertStrictEquals(isNothing(Just(42)), false);
		});
	});

	describe("safeExecute", () => {
		it("returns a Just if the function does not throw", () => {
			const m = safeExecute(() => 42);
			assert(isJust(m));
			assertStrictEquals(m.value, 42);
		});
		it("returns a Nothing if the function throws", () => {
			const m = safeExecute(() => {
				throw new Error("test");
			});
			assert(isNothing(m));
		});
	});

	describe("safeExecuteAsync", () => {
		it("returns a Just if the function does not throw", async () => {
			const m = await safeExecuteAsync(() => Promise.resolve(42));
			assert(isJust(m));
			assertStrictEquals(m.value, 42);
		});
		it("returns a Nothing if the function throws", async () => {
			const m = await safeExecuteAsync(() => Promise.reject(new Error("test")));
			assert(isNothing(m));
		});
	});
});
