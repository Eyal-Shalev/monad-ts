import { Either } from "../data/either.ts";
import { IO } from "../runner/io.ts";

export interface Exception<TVal, TError extends Error> extends IO<TVal> {

}
