export default interface IDomState {
  url?: string | RegExp;
  all: IDomStateAllFn;
}

export type IDomStateAllFn = (options: IDomStateAssertions) => void;

export type IStateAndAssertion<T> = [
  statePromise: Promise<T> | PromiseLike<T>,
  assertionFnOrValue?: ((state: T) => boolean) | T,
];

export type IDomStateAssertions = <T>(
  statePromise: Promise<T> | PromiseLike<T>,
  assertionFnOrValue?: ((state: T) => boolean) | T,
) => void;
