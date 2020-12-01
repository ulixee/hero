import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';
import SuperDocument from 'awaited-dom/impl/super-klasses/SuperDocument';
import { ILocationTrigger } from '@secret-agent/core-interfaces/Location';
import { ISuperElement } from 'awaited-dom/base/interfaces/super';
import IWaitForResourceOptions from '@secret-agent/core-interfaces/IWaitForResourceOptions';
import Response from 'awaited-dom/impl/official-klasses/Response';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import Request from 'awaited-dom/impl/official-klasses/Request';
import IWaitForElementOptions from '@secret-agent/core-interfaces/IWaitForElementOptions';
import Resource from '../lib/Resource';
import IInteractions, { IMousePosition, ITypeInteraction } from './IInteractions';
import IWaitForResourceFilter from './IWaitForResourceFilter';
import Tab from '../lib/Tab';
import IAwaitedEventTarget from './IAwaitedEventTarget';

export default interface ISecretAgent extends IAwaitedEventTarget<ISecretAgentEvents> {
  readonly document: SuperDocument;
  sessionId: Promise<string>;
  Request: typeof Request;
  tabs: Promise<Tab[]>;
  activeTab: Tab;
  sessionName: Promise<string>;
  url: Promise<string>;
  lastCommandId: Promise<number>;

  click(mousePosition: IMousePosition): Promise<void>;
  close(): Promise<void>;
  closeTab(tab: Tab): Promise<void>;
  exportUserProfile(): Promise<IUserProfile>;
  fetch(request: Request | string, init?: IRequestInit): Promise<Response>;
  focusTab(tab: Tab): Promise<void>;
  getJsValue<T = any>(path: string): Promise<{ value: T; type: string }>;
  goBack(): Promise<string>;
  goForward(): Promise<string>;
  goto(url: string): Promise<Resource>;
  interact(...interactions: IInteractions): Promise<void>;
  isElementVisible(element: ISuperElement): Promise<boolean>;
  scrollTo(mousePosition: IMousePosition): Promise<void>;
  type(...typeInteractions: ITypeInteraction[]): Promise<void>;
  waitForNewTab(): Promise<Tab>;
  waitForAllContentLoaded(): Promise<void>;
  waitForResource(
    filter: IWaitForResourceFilter,
    options?: IWaitForResourceOptions,
  ): Promise<Resource[]>;
  waitForElement(element: ISuperElement, options?: IWaitForElementOptions): Promise<void>;
  waitForLocation(trigger: ILocationTrigger): Promise<void>;
  waitForMillis(millis: number): Promise<void>;
  waitForWebSocket(url: string | RegExp): Promise<void>;

  then<TResult1 = IResolvedSecretAgent, TResult2 = never>(
    onfulfilled?:
      | ((value: IResolvedSecretAgent) => PromiseLike<TResult1> | TResult1)
      | undefined
      | null,
    onrejected?: ((reason: any) => PromiseLike<TResult2> | TResult2) | undefined | null,
  ): Promise<TResult1 | TResult2>;
}

interface IResolvedSecretAgent extends Omit<ISecretAgent, 'then'> {}

export interface ISecretAgentEvents {
  close: ISecretAgent;
}
