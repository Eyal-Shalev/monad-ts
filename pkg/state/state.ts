const stateSymbol: unique symbol = Symbol("state");

type MaybePromise<T> = T | Promise<T>;

export interface State<TResult, TState> {
	readonly kind: typeof stateSymbol;

	readonly computation: (_: TState) => MaybePromise<[TResult, TState]>;

	bind<OResult>(otherComp: (_: TResult) => State<OResult, TState>): State<OResult, TState>;
	lift<OResult>(otherComp: (_: TResult) => OResult): State<Awaited<OResult>, TState>;
	concat<OResult>(other: State<OResult, TState>): State<OResult, TState>;

	get(): State<TState, TState>;
	put(newState: TState): State<void, TState>;
	modify(modifier: (_: TState) => TState): State<void, TState>;

	/**
	 * eval executes the computation and returns a promise of the result.
	 */
	eval(state: TState): Promise<TResult>;

	/**
	 * exec executes the computation and returns a promise of the state.
	 */
	exec(state: TState): Promise<TState>;

	/**
	 * run executes the computation and returns a promise of the result and the state.
	 */
	run(state: TState): Promise<[TResult, TState]>;
}

export function State<TResult, TState>(
	computation: (_: TState) => MaybePromise<[TResult, TState]>,
): State<TResult, TState> {
	return Object.freeze({
		kind: stateSymbol,
		computation,
		bind<OResult>(otherComp: (_: TResult) => State<OResult, TState>): State<OResult, TState> {
			return State(async (state) => {
				const [result, newState] = await computation(state);
				return otherComp(result).run(newState);
			});
		},
		lift<OResult>(otherComp: (_: TResult) => OResult): State<Awaited<OResult>, TState> {
			return State(async (state) => {
				const [result, newState] = await computation(state);
				return [await otherComp(result), newState];
			});
		},
		concat<OResult>(other: State<OResult, TState>): State<OResult, TState> {
			return State(async (state) => {
				const [_result, newState] = await computation(state);
				return other.run(newState);
			});
		},
		get(): State<TState, TState> {
			return State((state) => [state, state]);
		},
		put(newState: TState): State<void, TState> {
			return State((_) => [void 0, newState]);
		},
		modify(modifier: (_: TState) => TState): State<void, TState> {
			return State((state) => [void 0, modifier(state)]);
		},
		async eval(state: TState): Promise<TResult> {
			const result = await computation(state);
			return result[0];
		},
		async exec(state: TState): Promise<TState> {
			const result = await computation(state);
			return result[1];
		},
		async run(state: TState): Promise<[TResult, TState]> {
			return await computation(state);
		},
	});
}

export function fromValue<TValue, TState = unknown>(value: TValue): State<Awaited<TValue>, TState> {
	return State(async (state) => Promise.resolve([await value, state]));
}

export const unit = fromValue;

export function isState(state: unknown): state is State<unknown, unknown> {
	return typeof state === "object" && state !== null && "kind" in state && state.kind === stateSymbol;
}
