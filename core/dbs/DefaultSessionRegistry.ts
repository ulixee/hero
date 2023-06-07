import { existsAsync } from '@ulixee/commons/lib/fileUtils';
import { bindFunctions } from '@ulixee/commons/lib/utils';
import * as Fs from 'fs';
import * as Path from 'path';
import ISessionRegistry from '../interfaces/ISessionRegistry';
import SessionDb from './SessionDb';

export default class DefaultSessionRegistry implements ISessionRegistry {
  private byId: { [sessionId: string]: SessionDb } = {};

  constructor(public defaultDir: string) {
    if (!Fs.existsSync(this.defaultDir)) Fs.mkdirSync(this.defaultDir, { recursive: true });
    bindFunctions(this);
  }

  public create(sessionId: string, customPath?: string): SessionDb {
    const dbPath = this.resolvePath(sessionId, customPath);
    const db = new SessionDb(sessionId, dbPath);
    this.byId[sessionId] = db;
    return db;
  }

  public async ids(): Promise<string[]> {
    if (!(await existsAsync(this.defaultDir))) return [];

    const sessionIds: string[] = [];
    for (const dbName of await Fs.promises.readdir(this.defaultDir)) {
      if (!dbName.endsWith('.db')) continue;
      const sessionId = dbName.slice(0, -3);
      sessionIds.push(sessionId);
    }
    return sessionIds;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async get(sessionId: string, customPath?: string): Promise<SessionDb> {
    if (sessionId.endsWith('.db')) sessionId = sessionId.slice(0, -3);
    if (!this.byId[sessionId]?.isOpen || this.byId[sessionId]?.isClosing) {
      const dbPath = this.resolvePath(sessionId, customPath);
      this.byId[sessionId] = new SessionDb(sessionId, dbPath, {
        readonly: true,
        fileMustExist: true,
      });
    }
    return this.byId[sessionId];
  }

  public async onClosed(sessionId: string, isDeleteRequested: boolean): Promise<void> {
    const entry = this.byId[sessionId];
    delete this.byId[sessionId];
    if (entry && isDeleteRequested) {
      try {
        await Fs.promises.rm(entry.path);
      } catch {}
    }
  }

  public shutdown(): Promise<void> {
    for (const [key, value] of Object.entries(this.byId)) {
      value.close();
      delete this.byId[key];
    }
    return Promise.resolve();
  }

  public async store(sessionId: string, db: Buffer): Promise<SessionDb> {
    await Fs.promises.writeFile(this.resolvePath(sessionId), db);
    return this.get(sessionId);
  }

  private resolvePath(sessionId: string, customPath?: string): string {
    return customPath ?? Path.join(this.defaultDir, `${sessionId}.db`);
  }
}
