import Session from './Session';
import { ICommandableTarget } from './CommandRunner';
type AsyncFunc = (...args: any[]) => Promise<any>;
export default class CommandRecorder {
    private owner;
    private session;
    readonly tabId: number;
    readonly frameId: number;
    readonly fnNames: Set<string>;
    private readonly fnMap;
    private logger;
    private isClosed;
    constructor(owner: ICommandableTarget, session: Session, tabId: number, frameId: number, fns: AsyncFunc[]);
    cleanup(): void;
    private runCommandFn;
}
export {};
