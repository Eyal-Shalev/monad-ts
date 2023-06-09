export const identity = <T>(x: T) => x;
export const noop = (..._: unknown[]) => void 0;
export function partial<TArgs1 extends unknown[], TArgs2 extends unknown[], TReturn>(
	fn: (...args: [...TArgs1, ...TArgs2]) => TReturn,
	...args1: TArgs1
) {
	return function (...args2: TArgs2): TReturn {
		return fn(...args1, ...args2);
	};
}

export function compose2<T1 extends unknown[], T2, T3>(
	fn1: (..._: T1) => T2,
	fn2: (_: T2) => T3,
): (...args: T1) => T3 {
	return (...args) => fn2(fn1(...args));
}

export function isFunction(value: unknown): value is (..._: unknown[]) => unknown {
	return typeof value === "function";
}
