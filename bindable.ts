import { identity } from "./internal/pure.ts";

export interface Bindable<A> {
  bind<B>(fn: (_: A) => B): B;
}

export const extract = <A>(a: Bindable<A>): A => a.bind(identity)
