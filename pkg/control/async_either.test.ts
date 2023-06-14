import { assertEquals, assertStrictEquals, fail } from "../../deps/std/testing/asserts.ts";
import { AsyncEither, left, right, safeRun, safeWrap, unit } from "./async_either.ts";
import { identity } from "../../internal/func_tools.ts";
import { doubleUnit, inc, incUnit } from "../../internal/test_utils.ts";

const expectedError = new Error("expected");

function foldLeft<TLeft, TRight>(m: AsyncEither<TLeft, TRight>): Promise<TLeft> {
	return m.fold(identity, () => fail("Expected right, got left"));
}

function foldRight<TLeft, TRight>(m: AsyncEither<TLeft, TRight>): Promise<TRight> {
	return m.fold(() => fail("Expected right, got left"), identity);
}

Deno.test("AsyncEither", async (t) => {
	await t.step("Unit Rules", async (t) => {
		await t.step("unit is a left-identity for bind: unit(x) >>= f <-> f(x)", async () => {
			const value = 21;
			const f = doubleUnit(unit);
			assertStrictEquals(
				await foldRight(f(value)),
				await foldRight(unit(value).bind(f)),
			);
		});

		await t.step("unit is also a right-identity for bind: ma >>= unit <-> ma", async () => {
			const m = unit(Symbol("value"));
			assertStrictEquals(await foldRight(m.bind(unit)), await foldRight(m));
		});

		await t.step("bind is essentially associative: ma >>= λx → (f(x) >>= g) <-> (ma >>= f) >>= g", async () => {
			const value = 20;
			const m = unit(value);
			const f = incUnit(unit);
			const g = doubleUnit(unit);
			assertEquals(
				await foldRight(m.bind((x) => f(x).bind(g))),
				await foldRight(m.bind(f).bind(g)),
			);
		});
	});

	await t.step("left ignores bind: Left a >>= f => Left a", async () => {
		const m = left(Symbol("left"));
		assertStrictEquals(await foldLeft(m.bind(() => left(Symbol("otherLeft")))), await foldLeft(m));
		assertStrictEquals(await foldLeft(m.bind(() => right(Symbol("right")))), await foldLeft(m));
	});

	await t.step("concat (<>)", async () => {
		assertEquals(
			await foldRight(unit([1, 2]).concat(unit([3, 4]))),
			[1, 2, 3, 4],
		);
		assertStrictEquals(
			await foldRight(unit("hello ").concat(unit("world"))),
			"hello world",
		);
		assertStrictEquals(
			await foldLeft(right("hello ").concat(left("goodbye"))),
			"goodbye",
		);
		assertStrictEquals(
			await foldLeft(left<string, string>("goodbye").concat(right("world"))),
			"goodbye",
		);
	});

	await t.step("lift", async (t) => {
		await t.step("Right x -> f => Right f(x)", async () => {
			assertStrictEquals(await foldRight(right(41).lift(inc)), 42);
		});
		await t.step("Left x -> f => Left x", async () => {
			assertStrictEquals(await foldLeft(left<41, number>(41).lift(inc)), 41);
		});
	});

	await t.step("ap (<*>)", async (t) => {
		await t.step("Right (a->b) <*> Right a => Right b", async () => {
			assertStrictEquals(
				await foldRight(right(inc).ap(right(41))),
				42,
			);
		});
		await t.step("AsyncEither e (a->b) <*> Right a => Left e", async () => {
			assertStrictEquals(
				await foldLeft(left<Error, typeof inc>(expectedError).ap(right(41))),
				expectedError,
			);
		});
		await t.step("Right (a->b) <*> Left e => Left e", async () => {
			assertStrictEquals(
				await foldLeft(right(inc).ap(left<Error, number>(expectedError))),
				expectedError,
			);
		});
	});

	await t.step("AsyncEither.safeRun", async () => {
		assertStrictEquals(await foldRight(safeRun(() => 1)), 1);
		assertStrictEquals(
			await foldLeft(safeRun(() => {
				throw expectedError;
			})),
			expectedError,
		);
	});

	await t.step("AsyncEither.safeWrap", async () => {
		assertStrictEquals(await foldRight(safeWrap(() => 1)()), 1);
		assertStrictEquals(
			await foldLeft(
				safeWrap(() => {
					throw expectedError;
				})(),
			),
			expectedError,
		);
	});

	await t.step("toString", () => {
		assertEquals(String(left("foo")), "[AsyncEither]");
		assertEquals(String(right("bar")), "[AsyncEither]");

		assertEquals(String(left(right("foo"))), "[AsyncEither]");
		assertEquals(String(right(left("bar"))), "[AsyncEither]");
	});
});
