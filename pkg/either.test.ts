import { assertEquals, assertStrictEquals, fail } from "../deps/std/testing/asserts.ts";
import Either from "./either.ts";
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
			const f = incUnit(Either.unit);
			assertStrictEquals(foldRight(f(value)), foldRight(Either.unit(value).bind(f)));
		});

		await t.step("unit is also a right-identity for bind: ma >>= unit <-> ma", () => {
			const m = Either.unit(Symbol("value"));
			assertStrictEquals(foldRight(m.bind(Either.unit)), foldRight(m));
		});

		await t.step("bind is essentially associative: ma >>= λx → (f(x) >>= g) <-> (ma >>= f) >>= g", () => {
			const value = 20;
			const m = Either.unit(value);
			const f = incUnit(Either.unit);
			const g = doubleUnit(Either.unit);
			assertEquals(
				foldRight(m.bind((x) => f(x).bind(g))),
				foldRight(m.bind(f).bind(g)),
			);
		});
	});

	await t.step("left ignores bind: Left a >>= f => Left a", () => {
		const m = Either.left(Symbol("left"));
		assertStrictEquals(foldLeft(m.bind(() => Either.left(Symbol("otherLeft")))), foldLeft(m));
		assertStrictEquals(foldLeft(m.bind(() => Either.right(Symbol("right")))), foldLeft(m));
	});

	await t.step("concat", () => {
		assertEquals(
			foldRight(Either.unit([1, 2]).concat(Either.unit([3, 4]))),
			[1, 2, 3, 4],
		);
		assertStrictEquals(
			foldRight(Either.unit("hello ").concat(Either.unit("world"))),
			"hello world",
		);
		assertStrictEquals(
			foldLeft(Either.right("world").concat(Either.left("goodbye"))),
			"goodbye",
		);
		assertStrictEquals(
			foldLeft(Either.left<string, string>("goodbye").concat(Either.right("hello "))),
			"goodbye",
		);
	});

	await t.step("lift (<$>)", async (t) => {
		await t.step("Right x <$> f => Right f(x)", () => {
			assertStrictEquals(foldRight(Either.right(41).lift(inc)), 42);
		});
		await t.step("Left x <$> f => Left x", () => {
			assertStrictEquals(foldLeft(Either.left<41, number>(41).lift(inc)), 41);
		});
	});

	await t.step("ap (<*>)", async (t) => {
		await t.step("Right (a->b) <*> Right a => Right b", () => {
			assertStrictEquals(foldRight(Either.right(inc).ap(Either.right(41))), 42);
		});
		await t.step("Either e (a->b) <*> Right a => Left e", () => {
			assertStrictEquals(foldLeft(Either.left<Error, typeof inc>(expectedError).ap(Either.right(41))), expectedError);
		});
		await t.step("Right (a->b) <*> Left e => Left e", () => {
			assertStrictEquals(foldLeft(Either.right(inc).ap(Either.left<Error, number>(expectedError))), expectedError);
		});
	});

	await t.step("Either.safeRun", () => {
		assertStrictEquals(foldRight(Either.safeRun(() => 1)), 1);
		assertStrictEquals(
			foldLeft(Either.safeRun(() => {
				throw expectedError;
			})),
			expectedError,
		);
	});

	await t.step("Either.safeWrap", () => {
		assertStrictEquals(foldRight(Either.safeWrap(() => 1)()), 1);
		assertStrictEquals(
			foldLeft(
				Either.safeWrap(() => {
					throw expectedError;
				})(),
			),
			expectedError,
		);
	});

	await t.step("toString", () => {
		assertEquals(String(Either.left("foo")), "[Either.left foo]");
		assertEquals(String(Either.right("bar")), "[Either.right bar]");

		assertEquals(String(Either.left(Either.right("foo"))), "[Either.left [Either.right foo]]");
		assertEquals(String(Either.right(Either.left("bar"))), "[Either.right [Either.left bar]]");
	});
});
