import type ITypedEventEmitter from '@ulixee/commons/interfaces/ITypedEventEmitter';
import IBrowserContext from './IBrowserContext';
import IBrowserEngine from './IBrowserEngine';
import IDevtoolsSession from './IDevtoolsSession';
import IBrowserHooks from '../hooks/IBrowserHooks';
export default interface IBrowser extends ITypedEventEmitter<IBrowserEvents> {
    id: string;
    name: string;
    fullVersion: string;
    majorVersion: number;
    engine: IBrowserEngine;
    devtoolsSession: IDevtoolsSession;
    browserContextsById: Map<string, IBrowserContext>;
    hooks: IBrowserHooks;
    close(): Promise<void | Error>;
}
export interface IBrowserEvents {
    close: void;
    'new-context': {
        context: IBrowserContext;
    };
    'new-session': {
        session: IDevtoolsSession;
    };
}
