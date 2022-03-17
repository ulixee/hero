import { IJsPath } from 'awaited-dom/base/AwaitedPath';

export default interface ICollectedElement {
  id?: number;
  name: string;
  frameId: number;
  frameNavigationId: number;
  tabId: number;
  commandId: number;
  timestamp: number;
  domChangesTimestamp: number;
  nodePointerId: number;
  nodeType: string;
  nodePreview: string;
  nodePath: string | IJsPath;
  documentUrl: string;
  outerHTML?: string;
}
