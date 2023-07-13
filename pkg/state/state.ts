const stateSymbol: unique symbol = Symbol("state");

export interface State<TResult, TState> {
	readonly kind: typeof stateSymbol;

	readonly computation: (_: TState) => [TResult, TState];

	bind<OResult>(otherComp: (_: TResult) => State<OResult, TState>): State<OResult, TState>;
	lift<OResult>(otherComp: (_: TResult) => OResult): State<OResult, TState>;
	concat<OResult>(other: State<OResult, TState>): State<OResult, TState>;

	get(): State<TState, TState>;
	put(newState: TState): State<void, TState>;
	modify(modifier: (_: TState) => TState): State<void, TState>;

	exec(state: TState): TState;
	run(state: TState): [TResult, TState];
	eval(state: TState): TResult;
}

export function State<TResult, TState>(computation: (_: TState) => [TResult, TState]): State<TResult, TState> {
	return Object.freeze({
		kind: stateSymbol,
		computation,
		bind<OResult>(otherComp: (_: TResult) => State<OResult, TState>): State<OResult, TState> {
			return State((state) => {
				const [result, newState] = computation(state);
				return otherComp(result).run(newState);
			});
		},
		lift<OResult>(otherComp: (_: TResult) => OResult): State<OResult, TState> {
			return State((state) => {
				const [result, newState] = computation(state);
				return [otherComp(result), newState];
			});
		},
		concat<OResult>(other: State<OResult, TState>): State<OResult, TState> {
			return State((state) => {
				const [_result, newState] = computation(state);
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
		exec(state: TState): TState {
			return computation(state)[1];
		},
		run(state: TState): [TResult, TState] {
			return computation(state);
		},
		eval(state: TState): TResult {
			return computation(state)[0];
		},
	});
}

export function fromValue<TValue, TState = unknown>(value: TValue): State<TValue, TState> {
	return State((state) => [value, state]);
}

export function fromComputation<TValue, TState>(
	computation: (_: TState) => [TValue, TState],
): State<TValue, TState> {
	return State((state) => computation(state));
}

export const unit = fromValue;

export function isState(state: unknown): state is State<unknown, unknown> {
	return typeof state === "object" && state !== null && "kind" in state && state.kind === stateSymbol;
}
