import { IJsPath } from 'awaited-dom/base/AwaitedPath';

export default interface IListenerObject {
  id: string;
  type?: string;
  jsPath?: IJsPath;
  listenFn?: (...args) => void;
}
