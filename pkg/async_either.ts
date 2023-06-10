import { Concatable, GetParam, GetReturnType } from "../internal/type_tools.ts";
import { identity } from "../internal/func_tools.ts";
import Either from "./either.ts";
import { ensureError } from "../internal/ensure_error.ts";

type MaybePromise<T> = T | Promise<T>

type ApAsyncEither<TLeft, TRight> = TRight extends (param: infer TParam) => infer TReturn
	? AsyncEither<TLeft, (_: TParam) => TReturn>
	: never;

export default class AsyncEither<TLeft, TRight> {
	#promise: Promise<Either<TLeft, TRight>>

	private constructor(promise: Promise<Either<TLeft, TRight>>) {
		this.#promise = promise
	}

	static left<TLeft, TRight>(leftValue: TLeft): AsyncEither<TLeft, TRight> {
		return new AsyncEither(Promise.resolve(Either.left<TLeft, TRight>(leftValue)))
	}

	static right<TLeft, TRight>(rightValue: TRight): AsyncEither<TLeft, TRight> {
		return new AsyncEither(Promise.resolve(Either.right<TLeft, TRight>(rightValue)))
	}

	static safeRun<TParams extends unknown[], TReturn>(
		fn: (...params: TParams) => MaybePromise<TReturn>,
		...params: TParams
	): AsyncEither<Error, TReturn> {
		return Either.safeRun(fn, ...params).fold(
			(error) => AsyncEither.left(error),
			(promise) => new AsyncEither(Promise.resolve(promise).then(
				(value) => Either.right(value),
				(error) => Either.left(error)
			))
		)
	}

	static safeWrap<TParams extends unknown[], TReturn>(
		fn: (...params: TParams) => MaybePromise<TReturn>
	): (...params: TParams) => AsyncEither<Error, TReturn> {
		return (...params) => AsyncEither.safeRun(fn, ...params)
	}

	async fold<TReturn>(
		leftHandler: (_: TLeft) => MaybePromise<TReturn>,
		rightHandler: (_: TRight) => MaybePromise<TReturn>
	): Promise<TReturn> {
		return (await this.#promise).fold(leftHandler, rightHandler)
	}

	bind<OLeft, ORight>(fn: (_: TRight) => MaybePromise<AsyncEither<OLeft, ORight>>): AsyncEither<TLeft | OLeft, ORight> {
		return new AsyncEither(this.fold(
			(leftValue) => Either.left<TLeft | OLeft, ORight>(leftValue),
			async (rightValue) => {
				const other = await fn(rightValue)
				return other.fold<Either<TLeft | OLeft, ORight>>(Either.left, Either.right)
			}
		))
	}

	lift<TReturn>(fn: (_: TRight) => MaybePromise<TReturn>): AsyncEither<TLeft, TReturn> {
		return this.bind(async (value) => AsyncEither.right(await fn(value)))
	}

	concat<OLeft>(other: AsyncEither<OLeft, Concatable<TRight>>): AsyncEither<TLeft | OLeft, Concatable<TRight>> {
		return this.bind(async (rightValue) => await other.lift((otherValue) => otherValue.concat(rightValue)))
	}

	ap<OLeft>(
		this: ApAsyncEither<TLeft, TRight>,
		other: AsyncEither<OLeft, GetParam<TRight>>,
	): AsyncEither<TLeft | OLeft, GetReturnType<TRight>> {
		return other.bind(async (otherValue: GetParam<TRight>) => {
			const either = (await this.#promise) as Either<TLeft, (_: GetParam<TRight>) => GetReturnType<TRight>>
			return either.fold(
				() => this as unknown as AsyncEither<TLeft | OLeft, GetReturnType<TRight>>,
				(rightValue) => AsyncEither.right(rightValue(otherValue))
			)
		})
	}

	get [Symbol.toStringTag]() {
		return AsyncEither.name
	}
	toString() {
		return `[${this[Symbol.toStringTag]}]`
	}
}
