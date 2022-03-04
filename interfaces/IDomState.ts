import { ISuperElement, ISuperHTMLElement, ISuperNode } from 'awaited-dom/base/interfaces/super';

export default interface IDomState {
  url?: string | RegExp;
  all: IDomStateAllFn;
}

type IAwaitedNode = ISuperNode | ISuperElement | ISuperHTMLElement;
type DomNodeOrPromiseValue<T> = T extends PromiseLike<infer R>
  ? R
  : T extends IAwaitedNode
  ? T
  : never;

export type IDomStateAllFn = (options: IDomStateAssertions) => void;

export type IStateAndAssertion<T> = [
  statePromise: T,
  assertionFnOrValue?: ((state: DomNodeOrPromiseValue<T>) => boolean) | DomNodeOrPromiseValue<T>,
];

export type IDomStateAssertions = <T>(
  statePromise: T,
  assertionFnOrValue?: ((state: DomNodeOrPromiseValue<T>) => boolean) | DomNodeOrPromiseValue<T>,
) => void;
