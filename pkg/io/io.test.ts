import { assert, assertEquals, assertFalse, assertStrictEquals } from "../../deps/std/testing/asserts.ts";
import IO from "./io.ts";
import { Consolable } from "./global_types.ts";
import { doubleUnit, inc, incUnit } from "../../internal/test_utils.ts";

function consoleProxy(fn: (p: string | symbol) => (...args: unknown[]) => void) {
	return new Proxy(globalThis.console, {
		get: (_, p: string | symbol) => fn(p),
	});
}

Deno.test("IO", async (t) => {
	await t.step("Unit Rules", async (t) => {
		await t.step("unit is a left-identity for bind: unit(x) >>= f <-> f(x)", async () => {
			const value = 21;
			const f = doubleUnit(IO.unit);
			assertStrictEquals(
				await IO.unit(value).bind(f).run(void 0),
				await f(value).run(void 0),
			);
		});

		await t.step("unit is also a right-identity for bind: ma >>= unit <-> ma", async () => {
			const s = Symbol("foo");
			const m = IO.unit(s);
			assertStrictEquals(await m.bind(IO.unit).run(void 0), await m.run(void 0));
		});

		await t.step("bind is essentially associative: ma >>= λx → (f(x) >>= g) <-> (ma >>= f) >>= g", async () => {
			const value = 20;
			const m = IO.unit(value);
			const f = incUnit(IO.unit);
			const g = doubleUnit(IO.unit);
			assertEquals(
				await m.bind((x) => f(x).bind(g)).run(void 0),
				await m.bind(f).bind(g).run(void 0),
			);
		});
	});

	await t.step("fold", async () => {
		assertStrictEquals(
			await IO.unit(41).lift(inc).run(void 0),
			42,
		);
	});

	await t.step("lift (<$>)", async () => {
		assertStrictEquals(
			await IO.unit(41).lift(inc).run(void 0),
			42,
		);
	});

	await t.step("concat (>>)", async () => {
		let [flag1, flag2] = [false, false];

		const [s1, s2] = [Symbol("s1"), Symbol("s2")];
		const [io1, io2] = [
			IO.fromEffect(() => {
				flag1 = true;
				return s1;
			}),
			IO.fromEffect(() => {
				flag2 = true;
				return s2;
			}),
		];

		assertFalse(flag1 && flag2, "one of the flags is true before running");
		assertStrictEquals(await io1.concat(io2).run(void 0), s2);
		assert(flag1 && flag2, "flags of the flags is false after running");
	});

	await t.step("Environment Injection", async () => {
		await IO.fromEffect<Consolable, void>(({ console }) => {
			console.log("from IO");
		}).run({
			console: consoleProxy((p) => {
				assertEquals(p, "log");
				return (...args) => assertEquals(args, ["from IO"]);
			}),
		});
	});
});
