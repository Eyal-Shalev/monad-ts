export type GlobalThis = typeof globalThis;

export type Consolable = Pick<GlobalThis, "console">;
export type Alertable = Pick<GlobalThis, "alert">;
export type Promptable = Pick<GlobalThis, "prompt">;
export type Confirmable = Pick<GlobalThis, "confirm">;
