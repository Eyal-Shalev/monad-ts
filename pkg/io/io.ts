import { Fold, MaybePromise } from "../../internal/type_tools.ts";

type Effect<TEnv, TResult> = (_: TEnv) => MaybePromise<TResult>;

export default class IO<TEnv, TResult> implements Fold<[Effect<TEnv, TResult>]> {
	#effect: Effect<TEnv, TResult>;

	private constructor(effect: Effect<TEnv, TResult>) {
		this.#effect = effect;
	}

	static unit<TEnv, TResult>(value: TResult): IO<TEnv, TResult> {
		return IO.fromValue(value);
	}

	static fromEffect<TEnv, TResult>(effect: Effect<TEnv, TResult>) {
		return new IO<TEnv, TResult>(effect);
	}

	static fromValue<TEnv, TValue>(value: TValue): IO<TEnv, TValue> {
		return new IO(() => value);
	}

	run(env: TEnv): Promise<TResult> {
		return Promise.resolve(this.#effect(env));
	}

	fold<TReturn>(handler: (_: Effect<TEnv, TResult>) => TReturn): TReturn {
		return handler(this.#effect);
	}

	bind<OResult>(fn: (_: TResult) => IO<TEnv, OResult>): IO<TEnv, OResult> {
		return IO.fromEffect<TEnv, OResult>(async (env) => {
			const res1 = await Promise.resolve(this.#effect(env));
			return fn(res1).run(env);
		});
	}

	lift<OResult>(fn: (_: TResult) => MaybePromise<OResult>): IO<TEnv, OResult> {
		return IO.fromEffect(async (env) => fn(await Promise.resolve(this.#effect(env))));
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
