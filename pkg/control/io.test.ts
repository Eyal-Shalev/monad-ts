import { fromEffect, unit } from "./io.ts";
import { assert, assertEquals, assertFalse, assertMatch, assertStrictEquals } from "../../deps/std/testing/asserts.ts";
import { assertSpyCalls, returnsNext, spy } from "../../deps/std/testing/mock.ts";
import { $alert, $prompt, HasAlert, HasPrompt } from "../system/window.ts";
import { doubleUnit, inc, incUnit } from "../../internal/test_utils.ts";
import { HasConsole } from "../system/shared_globals.ts";

function consoleProxy(fn: (p: string | symbol) => (...args: unknown[]) => void) {
	return new Proxy(globalThis.console, {
		get: (_, p: string | symbol) => fn(p),
	});
}

Deno.test("IO", async (t) => {
	await t.step("Unit Rules", async (t) => {
		await t.step("unit is a left-identity for bind: unit(x) >>= f <-> f(x)", async () => {
			const value = 21;
			const f = doubleUnit(unit);
			assertStrictEquals(
				await unit(value).bind(f).run(void 0),
				await f(value).run(void 0),
			);
		});

		await t.step("unit is also a right-identity for bind: ma >>= unit <-> ma", async () => {
			const s = Symbol("foo");
			const m = unit(s);
			assertStrictEquals(await m.bind(unit).run(void 0), await m.run(void 0));
		});

		await t.step("bind is essentially associative: ma >>= λx → (f(x) >>= g) <-> (ma >>= f) >>= g", async () => {
			const value = 20;
			const m = unit(value);
			const f = incUnit(unit);
			const g = doubleUnit(unit);
			assertEquals(
				await m.bind((x) => f(x).bind(g)).run(void 0),
				await m.bind(f).bind(g).run(void 0),
			);
		});
	});

	await t.step("fold", async () => {
		assertStrictEquals(
			await unit(41).lift(inc).run(void 0),
			42,
		);
	});

	await t.step("lift", async () => {
		assertStrictEquals(
			await unit(41).lift(inc).run(void 0),
			42,
		);
	});

	await t.step("concat (>>)", async () => {
		let [flag1, flag2] = [false, false];

		const [s1, s2] = [Symbol("s1"), Symbol("s2")];
		const [io1, io2] = [
			fromEffect(() => {
				flag1 = true;
				return s1;
			}),
			fromEffect(() => {
				flag2 = true;
				return s2;
			}),
		];

		assertFalse(flag1 && flag2, "one of the flags is true before running");
		assertStrictEquals(await io1.concat(io2).run(void 0), s2);
		assert(flag1 && flag2, "flags of the flags is false after running");
	});

	await t.step("Environment Injection", async () => {
		await fromEffect<HasConsole, void>(({ console }) => {
			console.log("from IO");
		}).run({
			console: consoleProxy((p) => {
				assertEquals(p, "log");
				return (...args) => assertEquals(args, ["from IO"]);
			}),
		});
	});

	await t.step("flow", async () => {
		const promptResults = ["Foo", "Bar"];
		const env = {
			alert: spy(),
			prompt: spy(returnsNext(promptResults)),
		};

		await $alert<HasAlert & HasPrompt>("Welcome to the information center!")
			.concat($prompt("Please enter your name:"))
			.bind((name) => $alert(`Hello ${name}!`))
			.concat($prompt("What is your favorite color?"))
			.bind((color) => $alert(`Nice choice! ${color} is a great color.`))
			.concat($alert("Thank you for sharing. Have a great day!"))
			.run(env);

		assertSpyCalls(env.prompt, 2);
		assertSpyCalls(env.alert, 4);
		assertMatch(env.alert.calls[1].args[0], RegExp("(Foo)"));
		assertMatch(env.alert.calls[2].args[0], RegExp("(Bar)"));
	});
});
