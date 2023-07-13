import { assertEquals, assertStrictEquals } from "deno-std/testing/asserts.ts";
import { describe, it } from "deno-std/testing/bdd.ts";
import { fromComputation, fromValue, isState, unit } from "./state.ts";

describe("State", () => {
	describe("3 monadic laws", () => {
		it("unit is a left-identity for bind: unit(x) >>= f <-> f(x)", () => {
			const value = Math.random();
			const f = (x: number) => unit(x + 1);
			assertEquals(unit(value).bind(f).computation(void 0), f(value).computation(void 0));
		});
		it("unit is right-identity for bind: ma >>= unit <-> ma", () => {
			const m = unit(Symbol("value"));
			assertEquals(m.bind(unit).computation(void 0), m.computation(void 0));
		});
		it("bind is associative: ma >>= λx → (f(x) >>= g) <-> (ma >>= f) >>= g", () => {
			const value = Math.random();
			const m = unit(value);
			const f = (x: number) => unit(x + 1);
			const g = (x: number) => unit(x * 2);
			assertEquals(
				m.bind((x) => f(x).bind(g)).computation(void 0),
				m.bind(f).bind(g).computation(void 0),
			);
		});
	});

	it("lift lifts a function into the State monad", () => {
		const value = Math.random();
		const f = (x: number) => x + 1;
		assertEquals(unit(value).lift(f).computation(void 0), fromValue(f(value)).computation(void 0));
	});

	it("concat concatenates two State values", () => {
		const value = Math.random();
		const f = (x: number) => unit(x + 1);
		const g = (x: number) => unit(x * 2);
		assertEquals(
			unit(value).bind(f).concat(unit(value).bind(g)).computation(void 0),
			unit(value).bind((x) => f(x).concat(g(x))).computation(void 0),
		);
	});

	it("get returns the state", () => {
		const state = Symbol("state");
		assertEquals(unit<void, unknown>(void 0).get().run(state), [state, state]);
	});
	it("put sets the state", () => {
		const state = Symbol("state");
		const newState = Symbol("newState");
		assertEquals(unit<void, unknown>(void 0).put(newState).exec(state), newState);
	});
	it("modify applies a function to the state", () => {
		const initial = Math.random();
		const f = (x: number) => x + 1;
		assertEquals(unit<void, number>(void 0).modify(f).exec(initial), f(initial));
	});

	describe("State execution", () => {
		it("exec executes the computation and returns the state", () => {
			const state = Symbol("state");
			assertEquals(unit(42).exec(state), state);
		});
		it("run executes the computation and returns the result and the state", () => {
			let data: undefined | symbol = undefined;
			const state = Symbol("state");
			const stateMonad = fromComputation((s: symbol) => {
				data = s;
				return [42, s];
			});
			assertEquals(stateMonad.run(state), [42, state]);
			assertEquals(data, state);
		});
		it("eval executes the computation and returns the result", () => {
			assertEquals(unit(42).eval(Symbol("state")), 42);
		});
	});

	describe("Guard functions work as expected", () => {
		it("isState returns true for State values", () => {
			assertStrictEquals(isState(unit(42)), true);
		});
		it("isState returns false for non-State values", () => {
			for (const value of [42, "42", {}, [], null, undefined]) {
				assertStrictEquals(isState(value), false);
			}
		});
	});
});
