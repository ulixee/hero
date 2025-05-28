import { IJsPath } from '@ulixee/js-path';
export default interface IDetachedElement {
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
