import SuperDocument from 'awaited-dom/impl/super-klasses/SuperDocument';
import { ILocationTrigger } from '@secret-agent/core-interfaces/Location';
import ISessionOptions from '@secret-agent/core-interfaces/ISessionOptions';
import { ISuperElement } from 'awaited-dom/base/interfaces/super';
import IInteractions from './IInteractions';
import Resource from '../lib/Resource';
import IWaitForResourceFilter from '@secret-agent/core-interfaces/IWaitForResourceFilter';
import IWaitForResourceOptions from '@secret-agent/core-interfaces/IWaitForResourceOptions';
import User from '../lib/User';
import Response from 'awaited-dom/impl/official-klasses/Response';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import Request from 'awaited-dom/impl/official-klasses/Request';

export default interface IBrowser {
  readonly document: SuperDocument;
  sessionId: string;
  user: User;
  Request: typeof Request;

  fetch(request: Request | string, init?: IRequestInit): Promise<Response>;
  close(): Promise<void>;
  configure(options: ISessionOptions): Promise<void>;
  interact(...interactions: IInteractions): Promise<void>;
  waitForAllContentLoaded(): Promise<void>;
  waitForResource(
    filter: IWaitForResourceFilter,
    options: IWaitForResourceOptions,
  ): Promise<Resource[]>;
  waitForElement(element: ISuperElement): Promise<void>;
  waitForLocation(trigger: ILocationTrigger): Promise<void>;
  waitForMillis(millis: number): Promise<void>;
  waitForWebSocket(url: string | RegExp): Promise<void>;
  getJsValue(path: string): Promise<any>;
}
