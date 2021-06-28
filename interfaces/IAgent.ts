import { ISuperDocument } from 'awaited-dom/base/interfaces/super';
import { IElementIsolate } from 'awaited-dom/base/interfaces/isolate';
import IUserProfile from './IUserProfile';
import IAgentMeta from './IAgentMeta';
import IDomStorage from './IDomStorage';
import IWaitForOptions from './IWaitForOptions';
import ITab from './ITab';

export default interface IAgent {
  activeTab: ITab;

  document: ISuperDocument;

  // frameEnvironments: Promise<IFrameEnvironment[]>;

  lastCommandId: Promise<number>;

  // mainFrameEnvironment: IFrameEnvironment;

  sessionId: Promise<string>;

  sessionName: Promise<string>;

  meta: Promise<IAgentMeta>;

  storage: Promise<IDomStorage>;

  tabs: Promise<ITab[]>;

  url: Promise<string>;

  coreHost: Promise<string>;

  // Request: typeof IRequest;

  // METHODS

  close(): Promise<void>;

  closeTab(tab: ITab): Promise<void>;

  // configure(configureOptions: IAgentConfigureOptions): Promise<void>;

  focusTab(tab: ITab): Promise<void>;

  // waitForNewTab(options?: IWaitForOptions): Promise<ITab>;

  // INTERACT METHODS

  // click(mousePosition: IMousePosition): Promise<void>;

  // getFrameEnvironment(frameElement: IElementIsolate): Promise<IFrameEnvironment | null>;

  // interact(...interactions: IInteractions): Promise<void>;

  // scrollTo(mousePosition: IMousePosition): Promise<void>;

  // type(...typeInteractions: ITypeInteraction[]): Promise<void>;

  exportUserProfile(): Promise<IUserProfile>;
}
