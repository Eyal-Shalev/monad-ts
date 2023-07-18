import { MaybePromise } from "../../../internal/common.ts";
import { GlobalThis } from "../../system/globalThis.ts";
import { State } from "../state/state.ts";

const ioSymbol = Symbol("io");

export interface IO<TResult, TEnv = GlobalThis> {
	readonly kind: typeof ioSymbol;

	readonly state: State<TResult, TEnv>;

	bind<OResult>(otherComp: (_: TResult) => IO<OResult, TEnv>): IO<OResult, TEnv>;
	lift<OResult>(otherComp: (_: TResult) => OResult): IO<OResult, TEnv>;
	concat<OResult>(other: IO<OResult, TEnv>): IO<OResult, TEnv>;

	run(env: TEnv): Promise<TResult>;
}

function ioState<TResult, TEnv>(state: State<TResult, TEnv>): IO<TResult, TEnv> {
	return Object.freeze({
		kind: ioSymbol,
		state,
		bind<OResult>(otherComp: (_: TResult) => IO<OResult, TEnv>) {
			return ioState(state.bind((result) => otherComp(result).state));
		},
		lift<OResult>(otherComp: (_: TResult) => OResult) {
			return ioState(state.lift(otherComp));
		},
		concat<OResult>(other: IO<OResult, TEnv>) {
			return ioState(state.concat(other.state));
		},
		run(env: TEnv) {
			return state.eval(env);
		},
	});
}

export function IO<TResult, TEnv = GlobalThis>(comp: (_: TEnv) => MaybePromise<TResult>): IO<TResult, TEnv> {
	return ioState(State(async (env) => [await comp(env), env]));
}

export function unit<TResult, TEnv = GlobalThis>(value: TResult): IO<TResult, TEnv> {
	return IO((_) => value);
}

export function isIO(io: unknown): io is IO<unknown> {
	return typeof io === "object" && io !== null && "kind" in io && io.kind === ioSymbol;
}
