import { existsAsync } from '@ulixee/commons/lib/fileUtils';
import { bindFunctions } from '@ulixee/commons/lib/utils';
import * as Fs from 'fs';
import * as Path from 'path';
import ISessionRegistry from '../interfaces/ISessionRegistry';
import SessionDb from './SessionDb';

export default class DefaultSessionRegistry implements ISessionRegistry {
  private byId: {
    [sessionId: string]: { db: SessionDb; deleteRequested?: boolean; connections: number };
  } = {};

  constructor(public defaultDir: string) {
    if (!Fs.existsSync(this.defaultDir)) Fs.mkdirSync(this.defaultDir, { recursive: true });
    bindFunctions(this);
  }

  public create(sessionId: string, customPath?: string): SessionDb {
    const dbPath = this.resolvePath(sessionId, customPath);
    const db = new SessionDb(sessionId, dbPath);
    this.byId[sessionId] = { db, connections: 1 };
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
    const entry = this.byId[sessionId];
    if (!entry?.db?.isOpen || entry?.connections === 0) {
      const dbPath = this.resolvePath(sessionId, customPath);
      this.byId[sessionId] = {
        db: new SessionDb(sessionId, dbPath, {
          readonly: true,
          fileMustExist: true,
        }),
        connections: 1,
      };
    }
    return this.byId[sessionId]?.db;
  }

  public async retain(sessionId: string, customPath?: string): Promise<SessionDb> {
    if (sessionId.endsWith('.db')) sessionId = sessionId.slice(0, -3);
    const entry = this.byId[sessionId];
    if (!entry?.db?.isOpen) {
      return this.get(sessionId, customPath);
    }

    if (entry) {
      entry.connections += 1;
      return entry.db;
    }
  }

  public async close(sessionId: string, isDeleteRequested: boolean): Promise<void> {
    const entry = this.byId[sessionId];
    if (!entry) return;
    entry.connections -= 1;
    entry.deleteRequested ||= isDeleteRequested;

    if (entry.connections < 1) {
      delete this.byId[sessionId];
      entry.db.close();
      if (entry.deleteRequested) {
        try {
          await Fs.promises.rm(entry.db.path);
        } catch {}
      }
    } else if (!entry.db?.readonly) {
      entry.db.recycle();
    }
  }

  public async shutdown(): Promise<void> {
    for (const [key, value] of Object.entries(this.byId)) {
      value.db.close();
      if (value.deleteRequested) {
        try {
          await Fs.promises.rm(value.db.path);
        } catch {}
      }
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
