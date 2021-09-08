export default interface IPageStateDefinitions {
  [state: string]: IPageStateDefinitionFn;
}

export type IPageStateDefinitionFn = (assert: IPageStateAssertionFns) => void;

export type IStateAndAssertion<T> = [
  statePromise: Promise<T>,
  assertionFnOrValue?: ((state: T) => boolean) | T,
];

export interface IPageStateAssertionFns {
  assert<T>(
    statePromise: Promise<T>,
    assertionFnOrValue?: ((state: T) => boolean) | T,
  ): IStateAndAssertion<T>;
  assertAny(count: number, assertions: IStateAndAssertion<any>[]): void;
}
