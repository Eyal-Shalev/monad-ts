export type Decrement = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
export type Increment = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, never];

export type GetArrayItem<T> = T extends (infer I)[] ? I : never;
export type AsArray<T> = T & GetArrayItem<T>[];

export type AsArray2<T, TItem> = T extends TItem[] ? T & TItem[] : never;

export type AsString<T> = T extends string ? T & string : never;

export type AsFunc<T> = T extends (_: infer TParam) => infer TReturn ? T & ((_: TParam) => TReturn) : never;
export type GetParam<T> = T extends (_: infer TParam) => unknown ? TParam : never;
export type GetReturnType<T> = T extends (...params: unknown[]) => infer TReturn ? TReturn : never;

export type MaybePromise<T> = T | Promise<T>;

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

export interface AsyncFold<TVals extends unknown[]> {
	fold<TReturn>(...fns: FoldParams<TReturn, TVals, 10>): Promise<TReturn>;
}

export interface Stringer {
	toString(): string;
	[Symbol.toStringTag]: string;
}
