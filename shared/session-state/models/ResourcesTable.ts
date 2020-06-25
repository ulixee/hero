import decodeBuffer from '../lib/decodeBuffer';
import IResourceMeta from '@secret-agent/core-interfaces/IResourceMeta';
import BaseTable from '../lib/BaseTable';
import { Database as SqliteDatabase } from 'better-sqlite3';

export default class ResourcesTable extends BaseTable<IResourcesRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(db, 'Resources', [
      ['id', 'INTEGER', 'NOT NULL PRIMARY KEY'],
      ['type', 'TEXT'],
      ['receivedAtCommandId', 'INTEGER'],
      ['seenAtCommandId', 'INTEGER'],
      ['redirectedToUrl', 'TEXT'],
      ['requestUrl', 'TEXT'],
      ['requestHeaders', 'TEXT'],
      ['requestTimestamp', 'TEXT'],
      ['requestPostData', 'TEXT'],
      ['responseUrl', 'TEXT'],
      ['responseHeaders', 'TEXT'],
      ['responseData', 'BLOB'],
      ['responseEncoding', 'TEXT'],
      ['responseTimestamp', 'TEXT'],
      ['remoteAddress', 'TEXT'],
      ['statusCode', 'INTEGER'],
      ['statusMessage', 'TEXT'],
    ]);
  }

  public insert(redirectedToUrl: string, meta: IResourceMeta, body: Buffer) {
    return this.pendingInserts.push([
      meta.id,
      meta.type,
      meta.receivedAtCommandId,
      null,
      redirectedToUrl,
      meta.request.url,
      JSON.stringify(meta.request.headers ?? {}),
      meta.request.timestamp,
      meta.request.postData,
      meta.response.url,
      JSON.stringify(meta.response.headers ?? {}),
      body,
      meta.response.headers['Content-Encoding'] ?? meta.response.headers['content-encoding'],
      meta.response.timestamp,
      meta.response.remoteAddress,
      meta.response.statusCode,
      meta.response.statusText,
    ]);
  }

  public async getResourceBodyById(resourceId: number) {
    const record = this.db
      .prepare(`select responseData, responseEncoding from ${this.tableName} where id=? limit 1`)
      .get(resourceId);
    if (!record) return null;

    const { responseData, responseEncoding } = record;
    return await decodeBuffer(responseData, responseEncoding);
  }

  public async getResourceByUrl(url: string) {
    const sql = `select responseData, responseEncoding, responseHeaders from ${this.tableName} where requestUrl=? limit 1`;
    const record = this.db.prepare(sql).get(url);
    if (!record) return null;

    const data = await decodeBuffer(record.responseData, record.responseEncoding);
    const headers = JSON.parse(record.responseHeaders);
    return { data, headers };
  }
}

export interface IResourcesRecord {
  id: number;
  type: string;
  receivedAtCommandId: number;
  seenAtCommandId: number;
  redirectedToUrl?: string;
  requestUrl: string;
  requestHeaders: string;
  requestTimestamp: string;
  requestPostData?: string;
  responseUrl: string;
  responseHeaders: string;
  responseData?: Buffer;
  responseEncoding: string;
  responseTimestamp: string;
  remoteAddress: string;
  statusCode: number;
  statusMessage: string;
}
