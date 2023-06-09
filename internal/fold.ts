import { Decrement } from "./type_tools.ts";

type FoldParams<TReturn, TArr extends unknown[], max extends number, accumulator extends unknown[] = []> = max extends 0
	? accumulator
	: (
		TArr extends [infer T, ...(infer rest)] ? (
				FoldParams<TReturn, rest, Decrement[max], [...accumulator, (_: T) => TReturn]>
			)
			: accumulator
	);

export interface Fold<TVals extends unknown[]> {
	fold<TReturn>(...fns: FoldParams<TReturn, TVals, 10>): TReturn;
}
