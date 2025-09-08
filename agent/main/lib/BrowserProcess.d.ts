import IBrowserEngine from '@ulixee/unblocked-specification/agent/browser/IBrowserEngine';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import { PipeTransport } from './PipeTransport';
import { WebsocketTransport } from './WebsocketTransport';
export default class BrowserProcess extends TypedEventEmitter<{
    close: void;
}> {
    private browserEngine;
    private processEnv?;
    readonly transport: PipeTransport | WebsocketTransport;
    isProcessFunctionalPromise: Resolvable<boolean>;
    launchStderr: string[];
    private processKilled;
    private readonly launchedProcess;
    private remoteDebuggingUrl?;
    constructor(browserEngine: IBrowserEngine, processEnv?: NodeJS.ProcessEnv);
    close(): Promise<void>;
    private bindCloseHandlers;
    private launch;
    private bindProcessEvents;
    private gracefulCloseBrowser;
    private killChildProcess;
    private onChildProcessExit;
    private cleanDataDir;
}
