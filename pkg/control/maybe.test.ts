import { assert, assertEquals, assertStrictEquals, fail } from "../../deps/std/testing/asserts.ts";
import { identity } from "../../internal/func_tools.ts";
import { doubleUnit, inc, incUnit } from "../../internal/test_utils.ts";
import { isNothing, just, Maybe, nothing, safeRun, safeWrap, unit } from "./maybe.ts";

function foldNothing<T>(m: Maybe<T>): void {
	return m.fold(() => void 0, () => fail("expected nothing, got just"));
}
function foldJust<T>(m: Maybe<T>): T {
	return m.fold(() => fail("Expected just, got nothing"), identity);
}

Deno.test("Maybe", async (t) => {
	await t.step("Unit Rules", async (t) => {
		await t.step("unit is a left-identity for bind: unit(x) >>= f <-> f(x)", () => {
			const value = 21;
			const f = incUnit(unit);
			assertStrictEquals(foldJust(f(value)), foldJust(unit(value).bind(f)));
		});

		await t.step("unit is also a right-identity for bind: ma >>= unit <-> ma", () => {
			const m = unit(Symbol("value"));
			assertStrictEquals(foldJust(m.bind(unit)), foldJust(m));
		});

		await t.step("bind is essentially associative: ma >>= λx → (f(x) >>= g) <-> (ma >>= f) >>= g", () => {
			const value = 20;
			const m = unit(value);
			const f = incUnit(unit);
			const g = doubleUnit(unit);
			assertEquals(
				foldJust(m.bind((x) => f(x).bind(g))),
				foldJust(m.bind(f).bind(g)),
			);
		});
	});

	await t.step("nothing ignores bind: Maybe.nothing >>= f >>= Maybe.nothing", () => {
		assertStrictEquals(nothing<number>().bind(doubleUnit(unit)), nothing());
	});

	await t.step("concat", () => {
		assertEquals(
			foldJust(unit([1, 2]).concat(unit([3, 4]))),
			[1, 2, 3, 4],
		);
		assertStrictEquals(
			foldJust(unit("hello ").concat(unit("world"))),
			"hello world",
		);
		assert(isNothing(just("world").concat(nothing())));
		assert(isNothing(nothing<string>().concat(just("hello "))));
	});

	await t.step("lift (<$>)", async (t) => {
		await t.step("Maybe.just(x) <$> f => Maybe.just(f(x))", () => {
			assertStrictEquals(
				foldJust(just(41).lift(inc)),
				foldJust(just(inc(41))),
			);
		});
		await t.step("Maybe.just(x) <$> f => Maybe.nothing", () => {
			assertStrictEquals(nothing<number>().lift(inc), nothing());
		});
	});

	await t.step("ap (<*>)", async (t) => {
		await t.step("Right (a->b) <*> Right a => Right b", () => {
			assertStrictEquals(foldJust(just(inc).ap(just(41))), 42);
		});
		await t.step("Either e (a->b) <*> Right a => Left e", () => {
			assertStrictEquals(foldNothing(nothing<typeof inc>().ap(just(41))), void 0);
		});
		await t.step("Right (a->b) <*> Left e => Left e", () => {
			assertStrictEquals(foldNothing(just(inc).ap(nothing<number>())), void 0);
		});
	});

	await t.step("safeRun", () => {
		assertStrictEquals(foldJust(safeRun(() => 1)), 1);
		assertStrictEquals(
			foldNothing(safeRun(() => {
				throw new Error("expected");
			})),
			void 0,
		);
	});

	await t.step("safeWrap", () => {
		assertStrictEquals(foldJust(safeWrap(() => 1)()), 1);
		assertStrictEquals(
			foldNothing(
				safeWrap(() => {
					throw new Error("expected");
				})(),
			),
			void 0,
		);
	});

	await t.step("toString", () => {
		assertEquals(String(nothing()), "[Maybe.nothing]");
		assertEquals(String(just("bar")), "[Maybe.just bar]");

		assertEquals(String(just(nothing())), "[Maybe.just [Maybe.nothing]]");
	});
});
