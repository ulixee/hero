import FramesManager from './FramesManager';
import DevtoolsSession from './DevtoolsSession';
import { TNewDocumentCallbackFn } from '@ulixee/unblocked-specification/agent/browser/IPage';
export declare const injectedScript: string;
export default class InjectedScripts {
    static JsPath: string;
    static MouseEvents: string;
    static install(framesManager: FramesManager, devtoolsSession: DevtoolsSession, onPaintEvent: TNewDocumentCallbackFn): Promise<any>;
}
