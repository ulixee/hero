import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import ISessionMeta from '@secret-agent/interfaces/ISessionMeta';

export default interface IListenerObject {
  id: string;
  type?: string;
  meta: ISessionMeta;
  jsPath?: IJsPath;
  listenFn?: (...args) => void;
}
