import { IDomPaintEvent } from '@ulixee/unblocked-specification/agent/browser/Location';
import FramesManager from './FramesManager';
import DevtoolsSession from './DevtoolsSession';
export declare const injectedScript: string;
export default class InjectedScripts {
    static JsPath: string;
    static MouseEvents: string;
    static install(framesManager: FramesManager, devtoolsSession: DevtoolsSession, onPaintEvent: (frameId: number, event: {
        url: string;
        event: IDomPaintEvent;
        timestamp: number;
    }) => void): Promise<any>;
}
