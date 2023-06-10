import { AsArray, AsString, AsyncFold, GetParam, GetReturnType, MaybePromise } from "../internal/type_tools.ts";
import Either from "./either.ts";

type ApAsyncEither<TLeft, TRight> = TRight extends (param: infer TParam) => infer TReturn
	? AsyncEither<TLeft, (_: TParam) => TReturn>
	: never;

export default class AsyncEither<TLeft, TRight> implements AsyncFold<[TLeft, TRight]> {
	#promise: Promise<Either<TLeft, TRight>>;

	private constructor(promise: Promise<Either<TLeft, TRight>>) {
		this.#promise = promise;
	}

	static unit<TLeft, TRight>(value: TRight): AsyncEither<TLeft, TRight> {
		return AsyncEither.right(value);
	}

	static left<TLeft, TRight>(leftValue: TLeft): AsyncEither<TLeft, TRight> {
		return new AsyncEither(Promise.resolve(Either.left<TLeft, TRight>(leftValue)));
	}

	static right<TLeft, TRight>(rightValue: TRight): AsyncEither<TLeft, TRight> {
		return new AsyncEither(Promise.resolve(Either.right<TLeft, TRight>(rightValue)));
	}

	static safeRun<TParams extends unknown[], TReturn>(
		fn: (...params: TParams) => MaybePromise<TReturn>,
		...params: TParams
	): AsyncEither<Error, TReturn> {
		return Either.safeRun(fn, ...params).fold(
			(error) => AsyncEither.left(error),
			(promise) =>
				new AsyncEither(
					Promise.resolve(promise).then(
						(value) => Either.right(value),
						(error) => Either.left(error),
					),
				),
		);
	}

	static safeWrap<TParams extends unknown[], TReturn>(
		fn: (...params: TParams) => MaybePromise<TReturn>,
	): (...params: TParams) => AsyncEither<Error, TReturn> {
		return (...params) => AsyncEither.safeRun(fn, ...params);
	}

	async fold<TReturn>(
		leftHandler: (_: TLeft) => MaybePromise<TReturn>,
		rightHandler: (_: TRight) => MaybePromise<TReturn>,
	): Promise<TReturn> {
		return (await this.#promise).fold(leftHandler, rightHandler);
	}

	bind<OLeft, ORight>(fn: (_: TRight) => MaybePromise<AsyncEither<OLeft, ORight>>): AsyncEither<TLeft | OLeft, ORight> {
		return new AsyncEither(this.fold(
			(leftValue) => Either.left<TLeft | OLeft, ORight>(leftValue),
			async (rightValue) => {
				const other = await fn(rightValue);
				return other.fold<Either<TLeft | OLeft, ORight>>(Either.left, Either.right);
			},
		));
	}

	lift<TReturn>(fn: (_: TRight) => MaybePromise<TReturn>): AsyncEither<TLeft, TReturn> {
		return this.bind(async (value) => AsyncEither.right(await fn(value)));
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
		this: ApAsyncEither<TLeft, TRight>,
		other: AsyncEither<OLeft, GetParam<TRight>>,
	): AsyncEither<TLeft | OLeft, GetReturnType<TRight>> {
		return other.bind(async (otherValue: GetParam<TRight>) => {
			const either = (await this.#promise) as Either<TLeft, (_: GetParam<TRight>) => GetReturnType<TRight>>;
			return either.fold(
				() => this as unknown as AsyncEither<TLeft | OLeft, GetReturnType<TRight>>,
				(rightValue) => AsyncEither.right(rightValue(otherValue)),
			);
		});
	}

	get [Symbol.toStringTag]() {
		return AsyncEither.name;
	}
	toString() {
		return `[${this[Symbol.toStringTag]}]`;
	}
}
