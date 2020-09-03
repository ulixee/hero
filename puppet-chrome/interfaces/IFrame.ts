import Protocol from 'devtools-protocol';
import { IResolvablePromise } from '@secret-agent/commons/utils';

export interface IFrame extends Protocol.Page.Frame {
  hasNavigated: boolean;
  lifecycleEvents: ILifecycleEvents;
  frameLoading: IResolvablePromise<void>;
}

export interface ILifecycleEvents {
  DOMContentLoaded?: Date;
  load?: Date;
  init?: Date;
}
