import { AsArray2, AsFunc, AsString, Fold, GetParam, GetReturnType } from "../internal/type_tools.ts";

type JustValue<T> = { just: T };
const nothingValue = Symbol("nothing");
type NothingValue = typeof nothingValue;
type Value<T> = NothingValue | JustValue<T>;

function isNothingValue<T>(value: Value<T>): value is NothingValue {
	return value == nothingValue;
}

export interface Maybe<T> extends Fold<[void, T]> {
	bind<O>(fn: (_: T) => Maybe<O>): Maybe<O>;
	lift<TReturn>(fn: (_: T) => TReturn): Maybe<TReturn>;

	concat(
		this: Maybe<AsString<T>>,
		other: Maybe<AsString<T>>,
	): Maybe<AsString<T>>;
	concat<TItem>(
		this: Maybe<AsArray2<T, TItem>>,
		other: Maybe<AsArray2<T, TItem>>,
	): Maybe<AsArray2<T, TItem>>;
	concat<TItem>(
		this: Maybe<AsString<T> | AsArray2<T, TItem>>,
		other: Maybe<AsString<T> | AsArray2<T, TItem>>,
	): Maybe<AsString<T> | AsArray2<T, TItem>>;

	ap(
		this: Maybe<AsFunc<T>>,
		other: Maybe<GetParam<T>>,
	): Maybe<GetReturnType<T>>;
}

class MaybeCls<T> implements Fold<[void, T]> {
	#value: Value<T>;

	constructor(value: NothingValue);
	constructor(value: JustValue<T>);
	constructor(value: Value<T>) {
		this.#value = value;
	}

	fold<TReturn>(nothingHandler: (_?: void) => TReturn, justHandler: (_: T) => TReturn) {
		if (isNothingValue(this.#value)) {
			return nothingHandler();
		} else {
			return justHandler(this.#value.just);
		}
	}

	bind<O>(fn: (_: T) => MaybeCls<O>): MaybeCls<O> {
		return this.fold(
			() => nothing(),
			(value) => fn(value),
		);
	}

	lift<TReturn>(fn: (_: T) => TReturn): MaybeCls<TReturn> {
		return this.bind((value) => just(fn(value)));
	}

	concat(
		this: MaybeCls<AsString<T>>,
		other: MaybeCls<AsString<T>>,
	): MaybeCls<AsString<T>>;
	concat<TItem>(
		this: MaybeCls<AsArray2<T, TItem>>,
		other: MaybeCls<AsArray2<T, TItem>>,
	): MaybeCls<AsArray2<T, TItem>>;
	concat<TItem>(
		this: MaybeCls<AsString<T> | AsArray2<T, TItem>>,
		other: MaybeCls<AsString<T> | AsArray2<T, TItem>>,
	): MaybeCls<AsString<T> | AsArray2<T, TItem>> {
		return this.bind((rightValue) =>
			other.lift((otherValue) => {
				if (typeof rightValue === "string" && typeof otherValue === "string") {
					return rightValue.concat(otherValue) as AsString<T>;
				} else if (typeof rightValue !== "string" && typeof otherValue !== "string") {
					return rightValue.concat(otherValue) as AsArray2<T, TItem>;
				}
				throw new TypeError(`Cannot concatenate values of type "${typeof rightValue}" and "${typeof otherValue}"`);
			})
		);
	}

	ap(
		this: MaybeCls<AsFunc<T>>,
		other: MaybeCls<GetParam<T>>,
	): MaybeCls<GetReturnType<T>> {
		const ret = other.bind((otherValue) => {
			const a = this.lift((value) => value(otherValue) as GetReturnType<T>);
			return a;
		});
		return ret;
	}

	get [Symbol.toStringTag](): string {
		return this.fold(
			() => "nothing",
			(value) => `just ${String(value)}`,
		);
	}

	toString(): string {
		return `[Maybe.${this[Symbol.toStringTag]}]`;
	}
}

const nothingInstance = new MaybeCls(nothingValue);

export const nothing = <T>() => nothingInstance as MaybeCls<T>;
export const just = <T>(value: T): MaybeCls<T> => new MaybeCls({ just: value });
export const unit = just;

export function isNothing(m: Maybe<unknown>): boolean {
	return m === nothingInstance;
}
export function isJust<T>(m: Maybe<T>): boolean {
	return !!m && !isNothing(m);
}

export function safeRun<TParams extends unknown[], TReturn>(
	fn: (..._: TParams) => TReturn,
	...params: TParams
): MaybeCls<TReturn> {
	try {
		return just(fn(...params));
	} catch (_) {
		return nothing();
	}
}

export function safeWrap<TParams extends unknown[], TReturn>(fn: (..._: TParams) => TReturn) {
	return (...params: TParams) => safeRun(fn, ...params);
}
