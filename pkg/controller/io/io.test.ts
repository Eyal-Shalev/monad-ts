import { assertEquals, assertStrictEquals } from "deno-std/testing/asserts.ts";
import { describe, it } from "deno-std/testing/bdd.ts";
import { isIO, unit } from "./io.ts";

const unitVoidEnv = <T>(x: T) => unit<T, void>(x);

describe("IO", () => {
	describe("bind (>>=)", () => {
		it("unit is a left-identity for bind: unit(x) >>= f <-> f(x)", () => {
			const value = Math.random();
			const f = (x: number) => unitVoidEnv(x + 1);
			assertEquals(unitVoidEnv(value).bind(f).run(void 0), f(value).run(void 0));
		});
		it("unit is right-identity for bind: ma >>= unit <-> ma", () => {
			const m = unitVoidEnv(Symbol("value"));
			assertEquals(m.bind(unitVoidEnv).run(void 0), m.run(void 0));
		});
		it("bind is associative: ma >>= λx → (f(x) >>= g) <-> (ma >>= f) >>= g", () => {
			const value = Math.random();
			const m = unitVoidEnv(value);
			const f = (x: number) => unitVoidEnv(x + 1);
			const g = (x: number) => unitVoidEnv(x * 2);
			assertEquals(
				m.bind((x) => f(x).bind(g)).run(void 0),
				m.bind(f).bind(g).run(void 0),
			);
		});
	});

	it("lift (<$>) lifts a function into the State monad", () => {
		const value = Math.random();
		const f = (x: number) => x + 1;
		assertEquals(unitVoidEnv(value).lift(f).run(void 0), unitVoidEnv(f(value)).run(void 0));
	});

	it("concat (<>) concatenates two State values", () => {
		const value = Math.random();
		const f = (x: number) => unitVoidEnv(x + 1);
		const g = (x: number) => unitVoidEnv(x * 2);
		assertEquals(
			unitVoidEnv(value).bind(f).concat(unitVoidEnv(value).bind(g)).run(void 0),
			unitVoidEnv(value).bind((x) => f(x).concat(g(x))).run(void 0),
		);
	});

	it("run executes the computation and returns the result", async () => {
		assertEquals(await unit(42).run(globalThis), 42);
	});

	describe("Guard functions work as expected", () => {
		it("isIO returns true for IO values", () => {
			assertStrictEquals(isIO(unit(42)), true);
		});
		it("isIO returns false for non-IO values", () => {
			for (const value of [42, "42", {}, [], null, undefined]) {
				assertStrictEquals(isIO(value), false);
			}
		});
	});

	it("handles large call stacks", async () => {
		let m = unit<number, number>(0);
		for (let i = 0; i < 10000; i++) {
			m = m.bind((x) => unit(x + 1));
		}
		assertEquals(await m.run(0), 10000);
	});
});
