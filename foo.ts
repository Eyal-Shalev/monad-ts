import { $getEnv } from "./pkg/io/io.ts";
import { $addEventListener, HasAddEventListener, HasAlert } from "./pkg/io/window.ts";

$getEnv<HasAlert & HasAddEventListener>()
	.bind(({ alert }) => $addEventListener("error", (ev) => alert(ev.error)))
	.run(globalThis);
