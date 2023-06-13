import { ensureError } from "../../internal/ensure_error.ts";
import {
	AsArray,
	AsFunc,
	AsString,
	AsyncFold,
	GetParam,
	GetReturnType,
	MaybePromise,
} from "../../internal/type_tools.ts";
import * as either from "./either.ts";
import type { Either } from "./either.ts";

export interface AsyncEither<TLeft, TRight> extends AsyncFold<[TLeft, TRight]> {
	bind<OLeft, ORight>(fn: (_: TRight) => MaybePromise<AsyncEither<OLeft, ORight>>): AsyncEither<TLeft | OLeft, ORight>;
	lift<TReturn>(fn: (_: TRight) => MaybePromise<TReturn>): AsyncEither<TLeft, TReturn>;

	concat<OLeft>(
		this: AsyncEither<TLeft, AsString<TRight>>,
		other: AsyncEither<OLeft, AsString<TRight>>,
	): AsyncEither<TLeft | OLeft, AsString<TRight>>;
	concat<OLeft>(
		this: AsyncEither<TLeft, AsArray<TRight>>,
		other: AsyncEither<OLeft, AsArray<TRight>>,
	): AsyncEither<TLeft | OLeft, AsArray<TRight>>;
	concat<OLeft>(
		this: AsyncEither<TLeft, AsString<TRight> | AsArray<TRight>>,
		other: AsyncEither<OLeft, AsString<TRight> | AsArray<TRight>>,
	): AsyncEither<TLeft | OLeft, AsString<TRight> | AsArray<TRight>>;

	ap<OLeft>(
		this: AsyncEither<TLeft, AsFunc<TRight>>,
		other: AsyncEither<OLeft, GetParam<TRight>>,
	): AsyncEither<TLeft | OLeft, GetReturnType<TRight>>;
}

class AsyncEitherCls<TLeft, TRight> implements AsyncEither<TLeft, TRight> {
	#promise: Promise<Either<TLeft, TRight>>;

	constructor(promise: Promise<Either<TLeft, TRight>>) {
		this.#promise = promise;
	}

	async fold<TReturn>(
		leftHandler: (_: TLeft) => MaybePromise<TReturn>,
		rightHandler: (_: TRight) => MaybePromise<TReturn>,
	): Promise<TReturn> {
		return (await this.#promise).fold(leftHandler, rightHandler);
	}

	bind<OLeft, ORight>(fn: (_: TRight) => MaybePromise<AsyncEither<OLeft, ORight>>): AsyncEither<TLeft | OLeft, ORight> {
		return new AsyncEitherCls(this.fold(
			(leftValue) => either.left<TLeft | OLeft, ORight>(leftValue),
			async (rightValue) => {
				const other = await fn(rightValue);
				return other.fold<Either<TLeft | OLeft, ORight>>(either.left, either.right);
			},
		));
	}

	lift<TReturn>(fn: (_: TRight) => MaybePromise<TReturn>): AsyncEither<TLeft, TReturn> {
		return this.bind(async (value) => right(await fn(value)));
	}

	concat<OLeft>(
		this: AsyncEither<TLeft, AsString<TRight>>,
		other: AsyncEither<OLeft, AsString<TRight>>,
	): AsyncEither<TLeft | OLeft, AsString<TRight>>;
	concat<OLeft>(
		this: AsyncEither<TLeft, AsArray<TRight>>,
		other: AsyncEither<OLeft, AsArray<TRight>>,
	): AsyncEither<TLeft | OLeft, AsArray<TRight>>;
	concat<OLeft>(
		this: AsyncEither<TLeft, AsString<TRight> | AsArray<TRight>>,
		other: AsyncEither<OLeft, AsString<TRight> | AsArray<TRight>>,
	): AsyncEither<TLeft | OLeft, AsString<TRight> | AsArray<TRight>> {
		return this.bind((rightValue) => {
			return other.lift((otherValue) => {
				if (typeof rightValue === "string" && typeof otherValue === "string") {
					return rightValue.concat(otherValue) as AsString<TRight>;
				} else if (typeof rightValue !== "string" && typeof otherValue !== "string") {
					return rightValue.concat(otherValue) as AsArray<TRight>;
				}
				throw new TypeError(`Cannot concatenate values of type "${typeof rightValue}" and "${typeof otherValue}"`);
			});
		});
	}

	ap<OLeft>(
		this: AsyncEitherCls<TLeft, AsFunc<TRight>>,
		other: AsyncEither<OLeft, GetParam<TRight>>,
	): AsyncEither<TLeft | OLeft, GetReturnType<TRight>> {
		return other.bind(async (otherValue: GetParam<TRight>) => {
			const either = (await this.#promise) as Either<TLeft, (_: GetParam<TRight>) => GetReturnType<TRight>>;
			return either.fold(
				() => this as unknown as AsyncEither<TLeft | OLeft, GetReturnType<TRight>>,
				(rightValue) => right(rightValue(otherValue)),
			);
		});
	}

	readonly [Symbol.toStringTag] = "AsyncEither";
	toString() {
		return `[${this[Symbol.toStringTag]}]`;
	}
}

export function left<TLeft, TRight>(leftValue: TLeft): AsyncEither<TLeft, TRight> {
	return new AsyncEitherCls(Promise.resolve(either.left<TLeft, TRight>(leftValue)));
}

export function right<TLeft, TRight>(rightValue: TRight): AsyncEither<TLeft, TRight> {
	return new AsyncEitherCls(Promise.resolve(either.right<TLeft, TRight>(rightValue)));
}
export const unit = right;

export function fromPromise<T>(promise: Promise<T>): AsyncEither<Error, T> {
	return new AsyncEitherCls(
		Promise.resolve(promise).then(
			(value) => either.right(value),
			(error) => either.left(ensureError(error)),
		),
	);
}

export function isLeft<TLeft, TRight>(m: AsyncEither<TLeft, TRight>): Promise<boolean> {
	return m.fold(() => true, () => false);
}

export function isRight<TLeft, TRight>(m: AsyncEither<TLeft, TRight>): Promise<boolean> {
	return m.fold(() => false, () => true);
}

export function safeRun<TParams extends unknown[], TReturn>(
	fn: (...params: TParams) => MaybePromise<TReturn>,
	...params: TParams
): AsyncEither<Error, TReturn> {
	return either.safeRun(fn, ...params).fold(
		(error) => left(error),
		(promise) => fromPromise(Promise.resolve(promise)),
	);
}

export function safeWrap<TParams extends unknown[], TReturn>(
	fn: (...params: TParams) => MaybePromise<TReturn>,
): (...params: TParams) => AsyncEither<Error, TReturn> {
	return (...params) => safeRun(fn, ...params);
}
