import Protocol from 'devtools-protocol';
import IRegisteredEventListener from '@ulixee/commons/interfaces/IRegisteredEventListener';
import ITypedEventEmitter from '@ulixee/commons/interfaces/ITypedEventEmitter';
import { IPuppetFrame, IPuppetFrameManagerEvents } from './IPuppetFrame';
import { IPuppetKeyboard, IPuppetMouse } from './IPuppetInput';
import { IPuppetNetworkEvents } from './IPuppetNetworkEvents';
import { IPuppetWorker } from './IPuppetWorker';
import IDevtoolsSession from './IDevtoolsSession';
import IPuppetDialog from './IPuppetDialog';
import IPuppetContext from './IPuppetContext';
import IScreenRecordingOptions from './IScreenRecordingOptions';
import IScreenshotOptions from './IScreenshotOptions';
import IPuppetDomStorageTracker, { IPuppetStorageEvents } from './IPuppetDomStorageTracker';

export interface IPuppetPage extends ITypedEventEmitter<IPuppetPageEvents> {
  id: string;
  devtoolsSession: IDevtoolsSession;
  browserContext: IPuppetContext;
  mouse: IPuppetMouse;
  keyboard: IPuppetKeyboard;
  frames: IPuppetFrame[];
  workers: IPuppetWorker[];
  mainFrame: IPuppetFrame;
  domStorageTracker: IPuppetDomStorageTracker;
  opener?: IPuppetPage;

  isClosed: boolean;
  navigate(url: string, options?: { referrer?: string }): Promise<{ loaderId: string }>;
  dismissDialog(accept: boolean, promptText?: string): Promise<void>;
  goBack(): Promise<string>;
  goForward(): Promise<string>;
  reload(): Promise<void>;
  close(): Promise<void>;
  bringToFront(): Promise<void>;
  screenshot(options: IScreenshotOptions): Promise<Buffer>;
  startScreenRecording(options: IScreenRecordingOptions): Promise<void>;
  stopScreenRecording(): Promise<void>;

  popupInitializeFn?: (
    page: IPuppetPage,
    openParams: { url: string; windowName: string },
  ) => Promise<any>;

  setNetworkRequestInterceptor(
    networkRequestsFn: (
      request: Protocol.Fetch.RequestPausedEvent,
    ) => Promise<Protocol.Fetch.FulfillRequestRequest>,
  ): Promise<void>;

  setJavaScriptEnabled(enabled: boolean): Promise<void>;

  evaluate<T>(expression: string): Promise<T>;
  addNewDocumentScript(script: string, isolateFromWebPageEnvironment: boolean): Promise<void>;
  addPageCallback(
    name: string,
    onCallback?: (payload: any, frameId: string) => any,
    isolateFromWebPageEnvironment?: boolean,
  ): Promise<IRegisteredEventListener>;
}

export interface IPuppetPageEvents
  extends IPuppetFrameManagerEvents,
    IPuppetNetworkEvents,
    IPuppetStorageEvents {
  close: void;
  worker: { worker: IPuppetWorker };
  crashed: { error: Error; fatal?: boolean };
  console: { frameId: string; type: string; message: string; location: string };
  'dialog-opening': { dialog: IPuppetDialog };
  filechooser: { frameId: string; selectMultiple: boolean; objectId: string };
  'page-error': { frameId: string; error: Error };
  'page-callback-triggered': { name: string; frameId: string; payload: any };
  screenshot: { imageBase64: string; timestamp: number };
}
