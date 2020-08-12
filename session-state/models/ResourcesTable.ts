import decodeBuffer from '@secret-agent/commons/decodeBuffer';
import IResourceMeta from '@secret-agent/core-interfaces/IResourceMeta';
import BaseTable from '../lib/BaseTable';
import { Database as SqliteDatabase } from 'better-sqlite3';
import ResourceType from '@secret-agent/core-interfaces/ResourceType';
import IResourceHeaders from '@secret-agent/core-interfaces/IResourceHeaders';

export default class ResourcesTable extends BaseTable<IResourcesRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'Resources',
      [
        ['id', 'INTEGER', 'NOT NULL PRIMARY KEY'],
        ['type', 'TEXT'],
        ['receivedAtCommandId', 'INTEGER'],
        ['seenAtCommandId', 'INTEGER'],
        ['redirectedToUrl', 'TEXT'],
        ['requestUrl', 'TEXT'],
        ['originalHeaders', 'TEXT'],
        ['requestHeaders', 'TEXT'],
        ['requestTimestamp', 'TEXT'],
        ['requestPostData', 'TEXT'],
        ['clientAlpn', 'TEXT'],
        ['serverAlpn', 'TEXT'],
        ['localAddress', 'TEXT'],
        ['responseUrl', 'TEXT'],
        ['responseHeaders', 'TEXT'],
        ['responseData', 'BLOB'],
        ['responseEncoding', 'TEXT'],
        ['responseTimestamp', 'TEXT'],
        ['remoteAddress', 'TEXT'],
        ['statusCode', 'INTEGER'],
        ['statusMessage', 'TEXT'],
        ['usedBrowserCache', 'INTEGER'],
        ['didBlockResource', 'INTEGER'],
      ],
      true,
    );
  }

  public insert(
    meta: IResourceMeta,
    body: Buffer,
    extras: {
      redirectedToUrl?: string;
      originalHeaders: IResourceHeaders;
      clientAlpn: string;
      serverAlpn: string;
      localAddress: string;
      wasCached?: boolean;
      didBlockResource: boolean;
    },
  ) {
    return this.queuePendingInsert([
      meta.id,
      meta.type,
      meta.receivedAtCommandId,
      null,
      extras.redirectedToUrl,
      meta.request.url,
      JSON.stringify(extras.originalHeaders ?? {}),
      JSON.stringify(meta.request.headers ?? {}),
      meta.request.timestamp,
      meta.request.postData,
      extras.clientAlpn,
      extras.serverAlpn,
      extras.localAddress,
      meta.response?.url,
      meta.response ? JSON.stringify(meta.response.headers ?? {}) : undefined,
      meta.response ? body : undefined,
      meta.response?.headers['Content-Encoding'] ?? meta.response?.headers['content-encoding'],
      meta.response?.timestamp,
      meta.response?.remoteAddress,
      meta.response?.statusCode,
      meta.response?.statusText,
      extras.wasCached ? 1 : 0,
      extras.didBlockResource ? 1 : 0,
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

  public async getResourceByUrl(url: string, decodeBody = true) {
    const sql = `select type, responseData, responseEncoding, statusCode, responseHeaders from ${this.tableName} where requestUrl=? limit 1`;
    const record = this.db.prepare(sql).get(url);
    if (!record) return null;

    const data = decodeBody
      ? await decodeBuffer(record.responseData, record.responseEncoding)
      : record.responseData;
    const headers = JSON.parse(record.responseHeaders);
    return { data, type: record.type as ResourceType, headers, statusCode: record.statusCode };
  }
}

export interface IResourcesRecord {
  id: number;
  type: ResourceType;
  receivedAtCommandId: number;
  seenAtCommandId: number;
  redirectedToUrl?: string;
  requestUrl: string;
  requestHeaders: string;
  originalHeaders: string;
  requestTimestamp: string;
  requestPostData?: string;
  clientAlpn: string;
  serverAlpn: string;
  localAddress: string;
  responseUrl: string;
  responseHeaders: string;
  responseData?: Buffer;
  responseEncoding: string;
  responseTimestamp: string;
  remoteAddress: string;
  statusCode: number;
  statusMessage: string;
  usedBrowserCache: boolean;
  didBlockResource: boolean;
}
