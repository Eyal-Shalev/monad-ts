import { ensureError } from "../internal/ensure_error.ts";
import { compose2 } from "../internal/func_tools.ts";
import { AsArray, AsString, Fold, GetParam, GetReturnType } from "../internal/type_tools.ts";

type ValueLeft<T> = { left: T };
type ValueRight<T> = { right: T };
type Value<TLeft, TRight> = ValueLeft<TLeft> | ValueRight<TRight>;

function isLeft<TLeft, TRight>(value: Value<TLeft, TRight>): value is ValueLeft<TLeft> {
	return "left" in value;
}
function isRight<TLeft, TRight>(value: Value<TLeft, TRight>): value is ValueRight<TRight> {
	return "right" in value;
}

type ApEither<TLeft, TRight> = TRight extends (param: infer TParam) => infer TReturn
	? Either<TLeft, TRight & ((_: TParam) => TReturn)>
	: never;

export default class Either<TLeft, TRight> implements Fold<[TLeft, TRight]> {
	#value: Value<TLeft, TRight>;

	private constructor(value: ValueRight<TRight>);
	private constructor(value: ValueLeft<TLeft>);
	private constructor(value: Value<TLeft, TRight>) {
		if (isLeft(value) == isRight(value)) {
			throw new TypeError("Either accepts right or left value, but not both.");
		}

		this.#value = value;
	}

	static right<TLeft, TRight>(rightValue: TRight): Either<TLeft, TRight> {
		return new Either({ right: rightValue });
	}
	static left<TLeft, TRight>(leftValue: TLeft): Either<TLeft, TRight> {
		return new Either({ left: leftValue });
	}
	static readonly unit = Either.right;

	static safeRun<TParams extends unknown[], TReturn>(
		fn: (...params: TParams) => TReturn,
		...params: TParams
	): Either<Error, TReturn> {
		try {
			return Either.right(fn(...params));
		} catch (error) {
			return Either.left(ensureError(error));
		}
	}

	static safeWrap<TParams extends unknown[], TReturn>(fn: (...params: TParams) => TReturn) {
		return (...params: TParams) => Either.safeRun(fn, ...params);
	}

	fold<TReturn>(leftHandler: (_: TLeft) => TReturn, rightHandler: (_: TRight) => TReturn): TReturn {
		if (isLeft(this.#value)) {
			return leftHandler(this.#value.left);
		} else {
			return rightHandler(this.#value.right);
		}
	}

	bind<OLeft, ORight>(fn: (_: TRight) => Either<OLeft, ORight>): Either<OLeft | TLeft, ORight> {
		return this.fold(
			() => this as unknown as Either<OLeft | TLeft, ORight>,
			(rightVal) => fn(rightVal),
		);
	}

	lift<TReturn>(fn: (_: TRight) => TReturn): Either<TLeft, TReturn> {
		return this.bind(compose2(fn, Either.right<TLeft, TReturn>));
	}

	concat<OLeft>(
		this: Either<TLeft, AsString<TRight>>,
		other: Either<OLeft, AsString<TRight>>,
	): Either<TLeft | OLeft, AsString<TRight>>;
	concat<OLeft>(
		this: Either<TLeft, AsArray<TRight>>,
		other: Either<OLeft, AsArray<TRight>>,
	): Either<TLeft | OLeft, AsArray<TRight>>;
	concat<OLeft>(
		this: Either<TLeft, AsString<TRight> | AsArray<TRight>>,
		other: Either<OLeft, AsString<TRight> | AsArray<TRight>>,
	): Either<TLeft | OLeft, AsString<TRight> | AsArray<TRight>> {
		return this.bind((rightValue) =>
			other.lift((otherValue) => {
				if (typeof rightValue === "string" && typeof otherValue === "string") {
					return rightValue.concat(otherValue) as AsString<TRight>;
				} else if (typeof rightValue !== "string" && typeof otherValue !== "string") {
					return rightValue.concat(otherValue) as AsArray<TRight>;
				}
				throw new TypeError(`Cannot concatenate values of type "${typeof rightValue}" and "${typeof otherValue}"`);
			})
		);
	}

	ap<OLeft>(
		this: ApEither<TLeft, TRight>,
		other: Either<OLeft, GetParam<TRight>>,
	): Either<TLeft | OLeft, GetReturnType<TRight>> {
		return other.bind((otherValue) => this.lift((rightValue) => rightValue(otherValue) as GetReturnType<TRight>));
	}

	get [Symbol.toStringTag](): string {
		return this.fold(
			(leftValue) => `left ${String(leftValue)}`,
			(rightValue) => `right ${String(rightValue)}`,
		);
	}

	toString(): string {
		return `[Either.${this[Symbol.toStringTag]}]`;
	}
}
