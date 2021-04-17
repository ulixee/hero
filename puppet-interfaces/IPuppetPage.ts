import IRegisteredEventListener from '@secret-agent/core-interfaces/IRegisteredEventListener';
import ITypedEventEmitter from '@secret-agent/core-interfaces/ITypedEventEmitter';
import IRect from '@secret-agent/core-interfaces/IRect';
import { IPuppetFrame, IPuppetFrameManagerEvents } from './IPuppetFrame';
import { IPuppetKeyboard, IPuppetMouse } from './IPuppetInput';
import { IPuppetNetworkEvents } from './IPuppetNetworkEvents';
import { IPuppetWorker } from './IPuppetWorker';

export interface IPuppetPage extends ITypedEventEmitter<IPuppetPageEvents> {
  id: string;
  devtoolsSessionId: string;
  mouse: IPuppetMouse;
  keyboard: IPuppetKeyboard;
  frames: IPuppetFrame[];
  workers: IPuppetWorker[];
  mainFrame: IPuppetFrame;
  opener?: IPuppetPage;

  isClosed: boolean;
  navigate(url: string, options?: { referrer?: string }): Promise<void>;
  goBack(): Promise<void>;
  goForward(): Promise<void>;
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
  workerInitializeFn?: (worker: IPuppetWorker) => Promise<void>;

  getIndexedDbDatabaseNames(): Promise<{ frameId: string; origin: string; databases: string[] }[]>;
  setJavaScriptEnabled(enabled: boolean): Promise<void>;

  evaluate<T>(expression: string): Promise<T>;
  addNewDocumentScript(script: string, isolateFromWebPageEnvironment: boolean): Promise<void>;
  addPageCallback(
    name: string,
    onCallback: (payload: any, frameId: string) => any,
  ): Promise<IRegisteredEventListener>;
}

export interface IPuppetPageEvents extends IPuppetFrameManagerEvents, IPuppetNetworkEvents {
  close: undefined;
  worker: { worker: IPuppetWorker };
  crashed: { error: Error; fatal?: boolean };
  console: { frameId: string; type: string; message: string; location: string };
  'page-error': { frameId: string; error: Error };
}
