// deno-lint-ignore-file no-explicit-any
import { GlobalThis } from "./global_types.ts";
import { fromEffect } from "../control/io.ts";

export type HasWindow = Pick<GlobalThis, "window">;
export type HasSelf = Pick<GlobalThis, "self">;
export type HasOnerror = Pick<GlobalThis, "onerror">;
export type HasOnload = Pick<GlobalThis, "onload">;
export type HasOnbeforeunload = Pick<GlobalThis, "onbeforeunload">;
export type HasOnunload = Pick<GlobalThis, "onunload">;
export type HasOnunhandledrejection = Pick<GlobalThis, "onunhandledrejection">;

export type HasLocalStorage = Pick<GlobalThis, "localStorage">;
export type HasSessionStorage = Pick<GlobalThis, "sessionStorage">;
export type HasCaches = Pick<GlobalThis, "caches">;

export type HasNavigator = Pick<GlobalThis, "navigator">;

export type HasAlert = Pick<GlobalThis, "alert">;
export function $alert<TEnv extends HasAlert>(message?: string) {
	return fromEffect(({ alert }: TEnv) => alert(message));
}

export type HasPrompt = Pick<GlobalThis, "prompt">;
export function $prompt<TEnv extends HasPrompt>(message?: string, defaultValue?: string) {
	return fromEffect(({ prompt }: TEnv) => prompt(message, defaultValue));
}

export type HasConfirm = Pick<GlobalThis, "confirm">;
export function $confirm<TEnv extends HasConfirm>(message?: string) {
	return fromEffect(({ confirm }: TEnv) => confirm(message));
}

export type HasAddEventListener = Pick<GlobalThis, "addEventListener">;
export function $addEventListener<
	TEnv extends HasAddEventListener,
	K extends keyof WindowEventMap,
>(
	type: K,
	listener: (this: Window, ev: WindowEventMap[K]) => any,
	options?: boolean | AddEventListenerOptions,
) {
	return fromEffect(({ addEventListener }: TEnv) => addEventListener(type, listener, options));
}

export type HasRemoveEventListener = Pick<GlobalThis, "removeEventListener">;
export function $removeEventListener<
	TEnv extends HasRemoveEventListener,
	K extends keyof WindowEventMap,
>(
	type: K,
	listener: (this: Window, ev: WindowEventMap[K]) => any,
	options?: boolean | EventListenerOptions,
) {
	return fromEffect(({ removeEventListener }: TEnv) => removeEventListener(type, listener, options));
}
