const MaybeSymbol: unique symbol = Symbol("Maybe");

interface Shared<T> {
	readonly kind: typeof MaybeSymbol;
	readonly value: T;
	bind<O>(fn: (_: T) => Maybe<O>): Maybe<O>;
	lift<TReturn>(fn: (_: T) => TReturn): Maybe<TReturn>;
	concat<O>(other: Maybe<O>): Maybe<O>;
}

export interface Nothing extends Shared<never> {
	readonly isJust: false;
	readonly isNothing: true;
}
export interface Just<T> extends Shared<T> {
	readonly isJust: true;
	readonly isNothing: false;
}
export type Maybe<T> = Nothing | Just<T>;

export function Just<T>(value: T): Just<T> {
	return Object.freeze({
		kind: MaybeSymbol,
		value,
		isJust: true,
		isNothing: false,
		bind(fn) {
			return fn(value);
		},
		lift(fn) {
			return Just(fn(value));
		},
		concat(other) {
			return other;
		},
	});
}

export const Nothing: Nothing = Object.freeze({
	kind: MaybeSymbol,
	get value(): never {
		throw new Error("Cannot get value of Nothing");
	},
	isJust: false,
	isNothing: true,
	bind() {
		return Nothing;
	},
	lift() {
		return Nothing;
	},
	concat() {
		return Nothing;
	},
});

export const unit = Just;

export function isMaybe(maybe: unknown): maybe is Maybe<unknown> {
	return typeof maybe === "object" && !!maybe && "kind" in maybe && maybe.kind === MaybeSymbol;
}

export function isNothing<T>(maybe: Maybe<T>): maybe is Nothing {
	return maybe.isNothing;
}

export function isJust<T>(maybe: Maybe<T>): maybe is Just<T> {
	return maybe.isJust;
}

export function safeExecute<T>(fn: () => T): Maybe<T> {
	try {
		return Just(fn());
	} catch (_) {
		return Nothing;
	}
}

export function safeExecuteAsync<T>(fn: () => Promise<T>): Promise<Maybe<T>> {
	return fn().then(Just, () => Nothing);
}
