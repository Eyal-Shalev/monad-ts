import { assertEquals, assertStrictEquals, fail } from "../deps/std/testing/asserts.ts";
import { Either, left, right, safeRun, safeWrap, unit } from "./either.ts";
import { identity } from "../internal/func_tools.ts";
import { doubleUnit, inc, incUnit } from "../internal/test_utils.ts";

const expectedError = new Error("expected");

function foldLeft<TLeft, TRight>(m: Either<TLeft, TRight>): TLeft {
	return m.fold(identity, () => fail("Expected right, got left"));
}

function foldRight<TLeft, TRight>(m: Either<TLeft, TRight>): TRight {
	return m.fold(() => fail("Expected right, got left"), identity);
}

Deno.test("Either", async (t) => {
	await t.step("Unit Rules", async (t) => {
		await t.step("unit is a left-identity for bind: unit(x) >>= f <-> f(x)", () => {
			const value = 21;
			const f = incUnit(unit);
			assertStrictEquals(foldRight(f(value)), foldRight(unit(value).bind(f)));
		});

		await t.step("unit is also a right-identity for bind: ma >>= unit <-> ma", () => {
			const m = unit(Symbol("value"));
			assertStrictEquals(foldRight(m.bind(unit)), foldRight(m));
		});

		await t.step("bind is essentially associative: ma >>= λx → (f(x) >>= g) <-> (ma >>= f) >>= g", () => {
			const value = 20;
			const m = unit(value);
			const f = incUnit(unit);
			const g = doubleUnit(unit);
			assertEquals(
				foldRight(m.bind((x) => f(x).bind(g))),
				foldRight(m.bind(f).bind(g)),
			);
		});
	});

	await t.step("left ignores bind: Left a >>= f => Left a", () => {
		const m = left(Symbol("left"));
		assertStrictEquals(m.bind(() => left(Symbol("otherLeft"))), m);
		assertStrictEquals(m.bind(() => right(Symbol("right"))), m);
	});

	await t.step("concat", () => {
		assertEquals(
			foldRight(unit([1, 2]).concat(unit([3, 4]))),
			[1, 2, 3, 4],
		);
		assertStrictEquals(
			foldRight(unit("hello ").concat(unit("world"))),
			"hello world",
		);
		assertStrictEquals(
			foldLeft(right("world").concat(left("goodbye"))),
			"goodbye",
		);
		assertStrictEquals(
			foldLeft(left<string, string>("goodbye").concat(right("hello "))),
			"goodbye",
		);
	});

	await t.step("lift (<$>)", async (t) => {
		await t.step("Right x <$> f => Right f(x)", () => {
			assertStrictEquals(foldRight(right(41).lift(inc)), 42);
		});
		await t.step("Left x <$> f => Left x", () => {
			assertStrictEquals(foldLeft(left<41, number>(41).lift(inc)), 41);
		});
	});

	await t.step("ap (<*>)", async (t) => {
		await t.step("Right (a->b) <*> Right a => Right b", () => {
			assertStrictEquals(foldRight(right(inc).ap(right(41))), 42);
		});
		await t.step("Either e (a->b) <*> Right a => Left e", () => {
			assertStrictEquals(foldLeft(left<Error, typeof inc>(expectedError).ap(right(41))), expectedError);
		});
		await t.step("Right (a->b) <*> Left e => Left e", () => {
			assertStrictEquals(foldLeft(right(inc).ap(left<Error, number>(expectedError))), expectedError);
		});
	});

	await t.step("Either.safeRun", () => {
		assertStrictEquals(foldRight(safeRun(() => 1)), 1);
		assertStrictEquals(
			foldLeft(safeRun(() => {
				throw expectedError;
			})),
			expectedError,
		);
	});

	await t.step("Either.safeWrap", () => {
		assertStrictEquals(foldRight(safeWrap(() => 1)()), 1);
		assertStrictEquals(
			foldLeft(
				safeWrap(() => {
					throw expectedError;
				})(),
			),
			expectedError,
		);
	});

	await t.step("toString", () => {
		assertEquals(String(left("foo")), "[Either.left(foo)]");
		assertEquals(String(right("bar")), "[Either.right(bar)]");

		assertEquals(String(left(right("foo"))), "[Either.left([Either.right(foo)])]");
		assertEquals(String(right(left("bar"))), "[Either.right([Either.left(bar)])]");
	});
});
