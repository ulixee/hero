import ISessionRegistry from '../interfaces/ISessionRegistry';
import SessionDb from './SessionDb';
export default class DefaultSessionRegistry implements ISessionRegistry {
    defaultDir: string;
    private byId;
    constructor(defaultDir: string);
    create(sessionId: string, customPath?: string): SessionDb;
    ids(): Promise<string[]>;
    get(sessionId: string, customPath?: string): Promise<SessionDb>;
    retain(sessionId: string, customPath?: string): Promise<SessionDb>;
    close(sessionId: string, isDeleteRequested: boolean): Promise<void>;
    shutdown(): Promise<void>;
    store(sessionId: string, db: Buffer): Promise<SessionDb>;
    private resolvePath;
}
