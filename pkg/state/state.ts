import { MaybePromise } from "../../internal/common.ts";

const stateSymbol: unique symbol = Symbol("state");

type ComputationFn<TResult, TState> = (_: TState) => MaybePromise<[TResult, TState]>;
type BindFn<TResult, OResult, TState> = (_: TResult) => State<OResult, TState>;
type LiftFn<TResult, OResult> = (_: TResult) => OResult;

type StackItem<TState> =
	| { kind: "compute"; state: ComputationFn<unknown, TState> }
	| { kind: "bind"; fn: BindFn<unknown, unknown, TState> }
	| { kind: "lift"; fn: LiftFn<unknown, unknown> }
	| { kind: "get" }
	| { kind: "put"; newState: TState }
	| { kind: "modify"; modifier: (_: TState) => TState };

export interface State<TResult, TState> {
	readonly kind: typeof stateSymbol;

	readonly stack: StackItem<TState>[];

	bind<OResult>(otherComp: BindFn<TResult, OResult, TState>): State<OResult, TState>;
	lift<OResult>(otherComp: LiftFn<TResult, OResult>): State<OResult, TState>;
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

function stateStack<TResult, TState>(stack: StackItem<TState>[]): State<TResult, TState> {
	const self: State<TResult, TState> = {
		kind: stateSymbol,
		stack,
		bind,
		lift,
		concat,
		get,
		put,
		modify,
		run,
		exec,
		eval: eval_,
	} as const;
	return self;

	function bind<OResult>(fn: BindFn<TResult, OResult, TState>): State<OResult, TState> {
		return stateStack([...stack, { kind: "bind", fn: fn as BindFn<unknown, unknown, TState> }]);
	}
	function lift<OResult>(fn: LiftFn<TResult, OResult>): State<OResult, TState> {
		return stateStack([...stack, { kind: "lift", fn: fn as LiftFn<unknown, unknown> }]);
	}
	function concat<OResult>(state: State<OResult, TState>): State<OResult, TState> {
		return stateStack([...stack, ...state.stack]);
	}
	function get(): State<TState, TState> {
		return stateStack([...stack, { kind: "get" }]);
	}
	function put(newState: TState): State<void, TState> {
		return stateStack([...stack, { kind: "put", newState }]);
	}
	function modify(modifier: (_: TState) => TState): State<void, TState> {
		return stateStack([...stack, { kind: "modify", modifier }]);
	}
	async function run(state: TState): Promise<[TResult, TState]> {
		let result: unknown = undefined;
		for (const item of stack) {
			switch (item.kind) {
				case "compute":
					[result, state] = await item.state(state);
					break;
				case "bind":
					[result, state] = await item.fn(result).run(state);
					break;
				case "lift":
					result = await item.fn(result);
					break;
				case "get":
					result = state;
					break;
				case "put":
					state = item.newState;
					break;
				case "modify":
					state = item.modifier(state);
					break;
				default:
					throw new Error("Unknown stack item");
			}
		}
		return [result as TResult, state];
	}
	async function exec(state: TState): Promise<TState> {
		return (await run(state))[1];
	}
	async function eval_(state: TState): Promise<TResult> {
		return (await run(state))[0];
	}
}

export function State<TResult, TState>(state: ComputationFn<TResult, TState>): State<TResult, TState> {
	return stateStack([{ kind: "compute", state }]);
}

export function fromValue<TValue, TState = unknown>(value: TValue): State<Awaited<TValue>, TState> {
	return State(async (state) => Promise.resolve([await value, state]));
}

export const unit = fromValue;

export function isState(state: unknown): state is State<unknown, unknown> {
	return typeof state === "object" && state !== null && "kind" in state && state.kind === stateSymbol;
}
