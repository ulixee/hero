export default interface IDomState {
  name?: string;
  url?: string | RegExp;
  allTrue(options: IDomStateAssertions): void;
}

export type IStateAndAssertion<T> = [
  statePromise: Promise<T>,
  assertionFnOrValue?: ((state: T) => boolean) | T,
];

export interface IDomStateAssertions {
  assert<T>(statePromise: Promise<T>, assertionFnOrValue?: ((state: T) => boolean) | T): void;
}
