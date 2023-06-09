import { assertEquals, assertStrictEquals, fail } from "../deps/std/testing/asserts.ts";
import Either from "./either.ts";
import { identity } from "../internal/func_tools.ts";

const expectedError = new Error("expected");
const inc = (x: number) => x + 1;

function foldLeft<TLeft, TRight>(m: Either<TLeft, TRight>): TLeft {
	return m.fold(identity, () => fail("Expected right, got left"));
}

function foldRight<TLeft, TRight>(m: Either<TLeft, TRight>): TRight {
	return m.fold(() => fail("Expected right, got left"), identity);
}

Deno.test("Either", async (t) => {
	await t.step(">>= (bind)", async (t) => {
		await t.step("unit is a left-identity for bind: unit(x) >>= f <-> f(x)", () => {
			const value = 21;
			const f = (x: number) => Either.right(x * 2);
			assertStrictEquals(foldRight(f(value)), foldRight(Either.right(value).bind(f)));
		});

		await t.step("unit is also a right-identity for bind: ma >>= unit <-> ma", () => {
			const m = Either.right(Symbol("right"));
			assertStrictEquals(foldRight(m.bind(Either.right)), foldRight(m));
		});

		await t.step("bind is essentially associative: ma >>= λx → (f(x) >>= g) <-> (ma >>= f) >>= g", () => {
			const [a, b, c] = [Symbol("a"), Symbol("b"), Symbol("c")];
			const m = Either.right(Object.freeze([a]));
			const appendB = (vals: readonly symbol[]) => Either.right(Object.freeze([...vals, b]));
			const appendC = (vals: readonly symbol[]) => Either.right(Object.freeze([...vals, c]));
			assertEquals(
				foldRight(m.bind((x) => appendB(x).bind(appendC))),
				foldRight(m.bind(appendB).bind(appendC)),
			);
		});

		await t.step("left ignores bind: Left a >>= f => Left a", () => {
			const m = Either.left(Symbol("left"));
			assertStrictEquals(foldLeft(m.bind(() => Either.left(Symbol("otherLeft")))), foldLeft(m));
			assertStrictEquals(foldLeft(m.bind(() => Either.right(Symbol("right")))), foldLeft(m));
		});
	});

	await t.step("<$> (lift)", async (t) => {
		await t.step("Right x <$> f => Right f(x)", () => {
			assertStrictEquals(foldRight(Either.right(41).lift(inc)), 42);
		});
		await t.step("Left x <$> f => Left x", () => {
			assertStrictEquals(foldLeft(Either.left<41, number>(41).lift(inc)), 41);
		});
	});

	await t.step("<*> (ap)", async (t) => {
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
