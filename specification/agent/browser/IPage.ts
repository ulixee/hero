import type ITypedEventEmitter from '@ulixee/commons/interfaces/ITypedEventEmitter';
import { IJsPath } from '@ulixee/js-path';
import { IFrame, IFrameManagerEvents } from './IFrame';
import { IKeyboard, IMouse } from '../interact/IInput';
import { IBrowserNetworkEvents } from './IBrowserNetworkEvents';
import { IWorker } from './IWorker';
import IDevtoolsSession from './IDevtoolsSession';
import IDialog from './IDialog';
import IBrowserContext from './IBrowserContext';
import IScreenshotOptions from './IScreenshotOptions';
import IExecJsPathResult from './IExecJsPathResult';
import IFileChooserPrompt from './IFileChooserPrompt';
import { IInteractionGroups } from '../interact/IInteractions';

export interface IPage extends ITypedEventEmitter<IPageEvents> {
  id: string;
  tabId: number; /// assigned id
  devtoolsSession: IDevtoolsSession;
  browserContext: IBrowserContext;
  mouse: IMouse;
  keyboard: IKeyboard;
  frames: IFrame[];
  workers: IWorker[];
  mainFrame: IFrame;
  opener?: IPage | null;

  isClosed: boolean;

  interact(...interactionGroups: IInteractionGroups): Promise<void>;
  click(jsPathOrSelector: IJsPath | string): Promise<void>;
  type(text: string): Promise<void>;
  navigate(url: string, options?: { referrer?: string }): Promise<{ loaderId: string }>;
  close(options?: { timeoutMs?: number }): Promise<void>;
  bringToFront(): Promise<void>;
  screenshot(options: IScreenshotOptions): Promise<Buffer>;

  execJsPath<T>(jsPath: IJsPath): Promise<IExecJsPathResult<T>>;

  setJavaScriptEnabled(enabled: boolean): Promise<void>;

  evaluate<T>(expression: string): Promise<T>;
  addNewDocumentScript(
    script: string,
    isolateFromWebPageEnvironment: boolean,
    callbackFns?: {
      [name: string]: TNewDocumentCallbackFn | null;
    },
    devtoolsSession?: IDevtoolsSession,
  ): Promise<{ identifier: string }>;
  removeDocumentScript(identifier: string, devtoolsSession?: IDevtoolsSession): Promise<void>;
}

export type TNewDocumentCallbackFn = (payload: string, frame: IFrame) => Promise<void> | void;

export interface IPageEvents extends IFrameManagerEvents, IBrowserNetworkEvents {
  close: void;
  worker: { worker: IWorker };
  crashed: { error: Error; fatal?: boolean };
  console: { frameId: number; type: string; message: string; location: string };
  'dialog-opening': { dialog: IDialog };
  filechooser: { prompt: IFileChooserPrompt };
  'page-error': { frameId: number; error: Error };
  'page-callback-triggered': { name: string; frameId: number; payload: string };
  screenshot: { imageBase64: string; timestamp: number };
}
