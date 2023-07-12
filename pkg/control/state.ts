import { AsTypedFunc, GetReturnType } from "../../internal/type_tools.ts";

export interface State<TResult, TState> {
	bind<OResult>(fn: (_: TResult) => State<OResult, TState>): State<OResult, TState>;
	lift<OResult>(fn: (_: TResult) => OResult): State<OResult, TState>;
	concat<OResult>(other: State<OResult, TState>): State<OResult, TState>;

	ap<OResult>(
		this: State<AsTypedFunc<TResult, OResult, unknown>, TState>,
		other: State<OResult, TState>,
	): State<GetReturnType<TResult>, TState>;

	/**
	 * Execute the state computation and return the result.
	 * @param state The initial state.
	 * @returns The result of the computation.
	 */
	eval(state: TState): TResult;

	/**
	 * Execute the state computation and return the result and the final state.
	 * @param state The initial state.
	 * @returns The result of the computation and the final state.
	 */
	run(state: TState): [TResult, TState];

	/**
	 * Execute the state computation and return the final state.
	 * @param state The initial state.
	 * @returns The final state.
	 */
	exec(state: TState): TState;
}

class StateCls<TResult, TState> implements State<TResult, TState> {
	#computation: (_: TState) => [TResult, TState];

	constructor(computation: (_: TState) => [TResult, TState]) {
		this.#computation = computation;
	}

	lift<OResult>(fn: (_: TResult) => OResult): State<OResult, TState> {
		return fromComputation((state) => {
			const [result, newState] = this.#computation(state);
			return [fn(result), newState];
		});
	}

	bind<OResult>(fn: (_: TResult) => State<OResult, TState>): State<OResult, TState> {
		return fromComputation((state) => {
			const [result, newState] = this.#computation(state);
			return fn(result).run(newState);
		});
	}

	concat<OResult>(other: State<OResult, TState>): State<OResult, TState> {
		return this.bind((_result) => other);
	}

	ap<OResult>(
		this: StateCls<AsTypedFunc<TResult, OResult, unknown>, TState>,
		other: State<OResult, TState>,
	): State<GetReturnType<TResult>, TState> {
		return fromComputation((state: TState) => {
			const [fn, newState] = this.#computation(state);
			const [result, finalState] = other.run(newState);
			return [fn(result) as GetReturnType<TResult>, finalState];
		});
	}

	eval(state: TState): TResult {
		const [result, _] = this.#computation(state);
		return result;
	}
	run(state: TState): [TResult, TState] {
		return this.#computation(state);
	}
	exec(state: TState): TState {
		const [_, newState] = this.#computation(state);
		return newState;
	}
}

export function fromComputation<TResult, TState>(
	computation: (_: TState) => [TResult, TState],
): State<TResult, TState> {
	return new StateCls(computation);
}

export function fromValue<TValue, TState = void>(value: TValue): State<TValue, TState> {
	return fromComputation((state) => [value, state]);
}

export const unit = fromValue;

export function $put<TState>(newState: TState) {
	return fromComputation<void, TState>((_) => [void 0, newState]);
}

export function $get<TState>(): State<TState, TState> {
	return fromComputation((state) => [state, state]);
}

export function $modify<TState>(fn: (_: TState) => TState): State<void, TState> {
	return fromComputation((state) => [void 0, fn(state)]);
}

// export const double = fromValue((x: number) => x * 2);
// export const increment = $get<number>().lift((x) => x + 1);

// console.log(
// 	double.ap(increment).run(3),
// );
