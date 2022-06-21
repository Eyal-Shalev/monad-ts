import { UnreachableError } from "./errors.ts";

/** @internal */
export function unreachable(): never {
  throw new UnreachableError();
}
