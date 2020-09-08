import { IRegisteredEventListener, ITypedEventEmitter } from '@secret-agent/commons/eventUtils';
import { ICookie } from '@secret-agent/core-interfaces/ICookie';
import { IPuppetFrame, IPuppetFrameEvents } from './IPuppetFrame';
import { IPuppetKeyboard, IPuppetMouse } from './IPuppetInput';
import { IPuppetNetworkEvents } from './IPuppetNetworkEvents';

export interface IPuppetPage extends ITypedEventEmitter<IPuppetPageEvents> {
  mouse: IPuppetMouse;
  keyboard: IPuppetKeyboard;
  frames: IPuppetFrame[];
  mainFrame: IPuppetFrame;
  navigate(url: string, options?: { referrer?: string }): Promise<void>;
  close(): Promise<void>;
  bringToFront(): Promise<void>;
  initializeNewPage?: (page: IPuppetPage) => Promise<void>;

  getIndexedDbDatabaseNames(): Promise<{ frameId: string; origin: string; databases: string[] }[]>;
  getPageCookies(): Promise<ICookie[]>;
  getAllCookies(): Promise<ICookie[]>;
  setCookies(cookies: ICookie[], origins: string[]): Promise<void>;
  setJavaScriptEnabled(enabled: boolean): Promise<void>;

  addNewDocumentScript(script: string, isolateFromWebPageEnvironment: boolean): Promise<void>;
  addPageCallback(
    name: string,
    onCallback: (payload: any, frameId: string) => any,
  ): Promise<IRegisteredEventListener>;

  runInFrames<T>(
    script: string,
    isolatedEnvironment: boolean,
  ): Promise<{ [frameId: string]: { error?: Error; value?: any } }>;
  runInFrame<T>(
    frameId: string,
    script: string,
    isolateFromWebPageEnvironment: boolean,
  ): Promise<T>;
}

export interface IPuppetPageEvents extends IPuppetFrameEvents, IPuppetNetworkEvents {
  close: undefined;
  load: undefined;
  targetCrashed: { error: Error };
  consoleLog: { frameId: string; type: string; message: string; location: string };
  pageError: { frameId: string; error: Error };
}
