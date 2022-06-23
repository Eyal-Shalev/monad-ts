/** @internal */
export class UnreachableError extends Error {
  override name = UnreachableError.name;
  constructor() {
    super("Congratulations you've reached an unreachable point 🎉");
  }
}

export class AssertionError extends Error {
  override name = AssertionError.name;
}

export class MatchError extends Error {
  override name = MatchError.name;
  readonly types: symbol[];
  constructor(type: symbol);
  constructor(type: symbol, ...types: symbol[]);
  constructor(...types: symbol[]) {
    super(`target did not match any of: ${types.map(String).join(", ")}`);
    this.types = types;
  }
}
