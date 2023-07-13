import { ensureError } from "../../internal/common.ts";

const EitherSymbol = Symbol("Either");

interface Shared<TLeft, TRight> {
	readonly kind: typeof EitherSymbol;
	readonly isLeft: boolean;
	readonly isRight: boolean;
	value: TLeft | TRight;

	bind<OLeft, ORight>(fn: (_: TRight) => Either<OLeft, ORight>): Either<OLeft | TLeft, ORight>;
	lift<TReturn>(fn: (_: TRight) => TReturn): Either<TLeft, TReturn>;
	concat<OLeft, ORight>(other: Either<OLeft, ORight>): Either<TLeft | OLeft, ORight>;
}

export interface Left<TLeft> extends Shared<TLeft, never> {
	readonly isLeft: true;
	readonly isRight: false;
	readonly value: TLeft;
}

export interface Right<TRight> extends Shared<never, TRight> {
	readonly isLeft: false;
	readonly isRight: true;
	readonly value: TRight;
}

export type Either<TLeft, TRight> = Left<TLeft> | Right<TRight>;

export function Left<TLeft>(value: TLeft): Left<TLeft> {
	const self: Left<TLeft> = Object.freeze({
		kind: EitherSymbol,
		value,
		isLeft: true,
		isRight: false,
		bind() {
			return self;
		},
		lift() {
			return self;
		},
		concat() {
			return self;
		},
	});
	return self;
}

export function Right<TRight>(value: TRight): Right<TRight> {
	return Object.freeze({
		kind: EitherSymbol,
		value,
		isLeft: false,
		isRight: true,
		bind(fn) {
			return fn(value);
		},
		lift(fn) {
			return Right(fn(value));
		},
		concat(other) {
			return other;
		},
	});
}

export const unit = Right;

export function isEither(either: unknown): either is Either<unknown, unknown> {
	return typeof either === "object" && !!either && "kind" in either && either.kind === EitherSymbol;
}

export function isLeft<TLeft, TRight>(either: Either<TLeft, TRight>): either is Left<TLeft> {
	return either.isLeft;
}

export function isRight<TLeft, TRight>(either: Either<TLeft, TRight>): either is Right<TRight> {
	return either.isRight;
}

export function safeExecute<T>(fn: () => T): Either<Error, T> {
	try {
		return Right(fn());
	} catch (error) {
		return Left(ensureError(error));
	}
}

export function safeExecuteAsync<T>(fn: () => Promise<T>): Promise<Either<Error, T>> {
	return fn().then(Right, (error) => Left(ensureError(error)));
}
