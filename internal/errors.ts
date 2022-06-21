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
