import Protocol from 'devtools-protocol';
import IRegisteredEventListener from './IRegisteredEventListener';
import ITypedEventEmitter from './ITypedEventEmitter';
import IRect from './IRect';
import { IPuppetFrame, IPuppetFrameManagerEvents } from './IPuppetFrame';
import { IPuppetKeyboard, IPuppetMouse } from './IPuppetInput';
import { IPuppetNetworkEvents } from './IPuppetNetworkEvents';
import { IPuppetWorker } from './IPuppetWorker';
import IDevtoolsSession from './IDevtoolsSession';
import IPuppetDialog from './IPuppetDialog';

export interface IPuppetPage extends ITypedEventEmitter<IPuppetPageEvents> {
  id: string;
  devtoolsSession: IDevtoolsSession;
  mouse: IPuppetMouse;
  keyboard: IPuppetKeyboard;
  frames: IPuppetFrame[];
  workers: IPuppetWorker[];
  mainFrame: IPuppetFrame;
  opener?: IPuppetPage;

  isClosed: boolean;
  navigate(url: string, options?: { referrer?: string }): Promise<{ loaderId: string }>;
  dismissDialog(accept: boolean, promptText?: string): Promise<void>;
  goBack(): Promise<string>;
  goForward(): Promise<string>;
  reload(): Promise<void>;
  close(): Promise<void>;
  bringToFront(): Promise<void>;
  screenshot(
    format?: 'jpeg' | 'png',
    clipRect?: IRect & { scale: number },
    quality?: number,
  ): Promise<Buffer>;
  popupInitializeFn?: (
    page: IPuppetPage,
    openParams: { url: string; windowName: string },
  ) => Promise<void>;

  setNetworkRequestInterceptor(
    networkRequestsFn: (
      request: Protocol.Fetch.RequestPausedEvent,
    ) => Promise<Protocol.Fetch.FulfillRequestRequest>,
  ): Promise<void>;

  getIndexedDbDatabaseNames(): Promise<{ frameId: string; origin: string; databases: string[] }[]>;
  setJavaScriptEnabled(enabled: boolean): Promise<void>;

  evaluate<T>(expression: string): Promise<T>;
  addNewDocumentScript(script: string, isolateFromWebPageEnvironment: boolean): Promise<void>;
  addPageCallback(
    name: string,
    onCallback?: (payload: any, frameId: string) => any,
  ): Promise<IRegisteredEventListener>;
}

export interface IPuppetPageEvents extends IPuppetFrameManagerEvents, IPuppetNetworkEvents {
  close: undefined;
  worker: { worker: IPuppetWorker };
  crashed: { error: Error; fatal?: boolean };
  console: { frameId: string; type: string; message: string; location: string };
  'dialog-opening': { dialog: IPuppetDialog };
  'page-error': { frameId: string; error: Error };
  'page-callback-triggered': { name: string; frameId: string; payload: any };
}
