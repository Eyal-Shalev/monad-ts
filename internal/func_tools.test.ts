import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { partial } from "./func_tools.ts";

Deno.test(function testPartial() {
	const add = (a: number, b: number) => a + b;
	const sum = (...xs: number[]) => xs.reduce(add, 0);

	assertEquals(partial(sum)(), 0);
	assertEquals(partial(sum)(1), 1);
	assertEquals(partial(sum, 1)(), 1);
	assertEquals(partial(sum, 1)(2), 3);
	assertEquals(partial(sum, 1, 2)(), 3);
	assertEquals(partial(sum, 1, 2)(3), 6);
});
