import { assertEquals, assertStrictEquals } from "../../deps/std/testing/asserts.ts";
import { doubleUnit, incUnit } from "../../internal/test_utils.ts";
import { $get, $modify, $put, fromComputation, State, unit } from "./state.ts";

function extractValue<T>(s: State<T, void>): T {
	return s.run(void 0)[0];
}

Deno.test("State", async (t) => {
	await t.step("Unit Rules", async (t) => {
		await t.step("unit is a left-identity for bind: unit(x) >>= f <-> f(x)", () => {
			const value = 21;
			const f = incUnit(unit);
			assertStrictEquals(extractValue(f(value)), extractValue(unit(value).bind(f)));
		});

		await t.step("unit is also a right-identity for bind: ma >>= unit <-> ma", () => {
			const m = unit(Symbol("value"));
			assertStrictEquals(extractValue(m.bind(unit)), extractValue(m));
		});

		await t.step("bind is essentially associative: ma >>= λx → (f(x) >>= g) <-> (ma >>= f) >>= g", () => {
			const value = 20;
			const m = unit(value);
			const f = incUnit(unit);
			const g = doubleUnit(unit);
			assertEquals(
				extractValue(m.bind((x) => f(x).bind(g))),
				extractValue(m.bind(f).bind(g)),
			);
		});
	});

	await t.step("concat (>>)", () => {
		const m = fromComputation((s: number) => [s * 2, s + 400]).bind((s) => unit(s + 2));
		assertStrictEquals(m.exec(20), 420);
		assertStrictEquals(m.eval(20), 42);
		assertEquals(m.run(20), [42, 420]);

		const stateM = $get<number>()
			.bind((s) => $put<number>(s * 2))
			.concat($get())
			.bind((s) => $put(s + 2));
		assertStrictEquals(stateM.exec(20), 42);
	});

	await t.step("$get, $put and $modify", () => {
		const m = $modify((s: number) => s * 2)
			.concat($get())
			.bind((s) => $put(s + 2));
		assertStrictEquals(m.exec(20), 42);
		assertStrictEquals(m.eval(20), void 0);
		assertEquals(m.run(20), [void 0, 42]);
	});

	// await t.step("lift", async (t) => {
	// 	await t.step("Maybe.just(x) -> f => Maybe.just(f(x))", () => {
	// 		assertStrictEquals(
	// 			foldJust(just(41).lift(inc)),
	// 			foldJust(just(inc(41))),
	// 		);
	// 	});
	// 	await t.step("Maybe.just(x) -> f => Maybe.nothing", () => {
	// 		assertStrictEquals(nothing<number>().lift(inc), nothing());
	// 	});
	// });
});
