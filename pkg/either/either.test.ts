import { assert, assertEquals, assertStrictEquals, fail } from "deno-std/testing/asserts.ts";
import { describe, it } from "deno-std/testing/bdd.ts";
import { isEither, isLeft, isRight, Left, Right, safeExecute, safeExecuteAsync, unit } from "./either.ts";

describe("Either", () => {
	describe("Right", () => {
		it("Contains a value", () => {
			const value = Math.random();
			assertStrictEquals(Right(value).value, value);
		});
		it("isRight is true", () => {
			assertStrictEquals(Right(42).isRight, true);
		});
		it("isLeft is false", () => {
			assertStrictEquals(Right(42).isLeft, false);
		});
		it("bind (>>==) applies the function to the value", () => {
			const value = Math.random();
			const f = (x: number) => unit(x + 1);
			assertStrictEquals(Right(value).bind(f).value, f(value).value);
		});
		it("lift (>>=) applies the function to the value and wraps it in a Right", () => {
			const value = Math.random();
			const f = (x: number) => x + 1;
			assertStrictEquals(Right(value).lift(f).value, f(value));
		});
		it("concat (<>), when given another Either, returns the other Either", () => {
			const value = Math.random();
			const otherRight = Right(value + 1);
			const otherLeft = Left(new Error("test"));
			assertStrictEquals(Right(value).concat(otherRight), otherRight);
			assertStrictEquals(Right(value).concat(otherLeft), otherLeft);
		});
	});

	describe("Left", () => {
		const someError = new Error("test");
		const someLeft = Left(someError);
		it("Contains a value", () => {
			assertStrictEquals(someLeft.value, someError);
		});
		it("isLeft is true", () => {
			assertStrictEquals(someLeft.isLeft, true);
		});
		it("isRight is false", () => {
			assertStrictEquals(someLeft.isRight, false);
		});
		it("bind (>>==) ignores the function", () => {
			const f = (_: unknown) => fail("Expected Left to ignore bind");
			assertStrictEquals(someLeft.bind(f), someLeft);
		});
		it("lift (>>=) ignores the function", () => {
			const f = (_: unknown) => fail("Expected Left to ignore lift");
			assertStrictEquals(someLeft.lift(f), someLeft);
		});
		it("concat (<>) ignores the function", () => {
			for (const other of [Right(Math.random()), Left(new Error("test"))]) {
				assertStrictEquals(someLeft.concat(other), someLeft);
			}
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
		it("isEither returns true for Either values", () => {
			assertStrictEquals(isEither(Right(42)), true);
			assertStrictEquals(isEither(Left(69)), true);
		});
		it("isEither returns false for non-Either values", () => {
			for (const value of [42, "42", {}, [], null, undefined]) {
				assertStrictEquals(isEither(value), false);
			}
		});
		it("isRight returns true for Right values", () => {
			assertStrictEquals(isRight(Right(42)), true);
		});
		it("isRight returns false for Left", () => {
			assertStrictEquals(isRight(Left(new Error())), false);
		});
		it("isLeft returns true for Left", () => {
			assertStrictEquals(isLeft(Left(new Error())), true);
		});
		it("isLeft returns false for Right values", () => {
			assertStrictEquals(isLeft(Right(42)), false);
		});
	});

	describe("safeExecute", () => {
		it("returns a Right if the function does not throw", () => {
			const m = safeExecute(() => 42);
			assert(isRight(m));
			assertStrictEquals(m.value, 42);
		});
		it("returns a Left if the function throws", () => {
			const someError = new Error("test");
			const m = safeExecute(() => {
				throw someError;
			});
			assert(isLeft(m));
			assertStrictEquals(m.value, someError);
		});
	});

	describe("safeExecuteAsync", () => {
		it("returns a Right if the function does not throw", async () => {
			const m = await safeExecuteAsync(() => Promise.resolve(42));
			assert(isRight(m));
			assertStrictEquals(m.value, 42);
		});
		it("returns a Left if the function throws", async () => {
			const someError = new Error("test");
			const m = await safeExecuteAsync(() => Promise.reject(someError));
			assert(isLeft(m));
			assertStrictEquals(m.value, someError);
		});
	});
});
