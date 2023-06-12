import { Fold, MaybePromise } from "../../internal/type_tools.ts";

type Effect<TEnv, TResult> = (_: TEnv) => MaybePromise<TResult>;

export interface IO<TEnv, TResult> extends Fold<[Effect<TEnv, TResult>]> {
	run(env: TEnv): Promise<TResult>;
	bind<OResult>(fn: (_: TResult) => IO<TEnv, OResult>): IO<TEnv, OResult>;
	lift<OResult>(fn: (_: TResult) => MaybePromise<OResult>): IO<TEnv, OResult>;
	concat<OResult>(other: IO<TEnv, OResult>): IO<TEnv, OResult>;
}

class IOCls<TEnv, TResult> implements IO<TEnv, TResult> {
	#effect: Effect<TEnv, TResult>;

	constructor(effect: Effect<TEnv, TResult>) {
		this.#effect = effect;
	}

	run(env: TEnv): Promise<TResult> {
		return Promise.resolve(this.#effect(env));
	}

	fold<TReturn>(handler: (_: Effect<TEnv, TResult>) => TReturn): TReturn {
		return handler(this.#effect);
	}

	bind<OResult>(fn: (_: TResult) => IO<TEnv, OResult>): IO<TEnv, OResult> {
		return fromEffect<TEnv, OResult>(async (env) => {
			const res1 = await Promise.resolve(this.#effect(env));
			return fn(res1).run(env);
		});
	}

	lift<OResult>(fn: (_: TResult) => MaybePromise<OResult>): IO<TEnv, OResult> {
		return fromEffect(async (env) => fn(await Promise.resolve(this.#effect(env))));
	}

	concat<OResult>(other: IO<TEnv, OResult>) {
		return this.bind((result) => {
			return other.lift(async (otherResult) => {
				await result;
				return await otherResult;
			});
		});
	}

	get [Symbol.toStringTag](): string {
		return `IO ${this.#effect.name || "[Function]"}`;
	}

	toString(): string {
		return `[${this[Symbol.toStringTag]}]`;
	}
}

export function fromEffect<TEnv, TResult>(effect: Effect<TEnv, TResult>) {
	return new IOCls<TEnv, TResult>(effect);
}

export function fromValue<TEnv, TValue>(value: TValue): IO<TEnv, TValue> {
	return new IOCls(() => value);
}

export const unit = fromValue;
