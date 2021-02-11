import decodeBuffer from '@secret-agent/commons/decodeBuffer';
import IResourceMeta from '@secret-agent/core-interfaces/IResourceMeta';
import { Database as SqliteDatabase } from 'better-sqlite3';
import ResourceType from '@secret-agent/core-interfaces/ResourceType';
import IResourceHeaders from '@secret-agent/core-interfaces/IResourceHeaders';
import SqliteTable from '@secret-agent/commons/SqliteTable';

export default class ResourcesTable extends SqliteTable<IResourcesRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'Resources',
      [
        ['id', 'INTEGER', 'NOT NULL PRIMARY KEY'],
        ['devtoolsRequestId', 'TEXT'],
        ['tabId', 'TEXT'],
        ['type', 'TEXT'],
        ['receivedAtCommandId', 'INTEGER'],
        ['seenAtCommandId', 'INTEGER'],
        ['requestMethod', 'TEXT'],
        ['requestUrl', 'TEXT'],
        ['requestHeaders', 'TEXT'],
        ['requestTrailers', 'TEXT'],
        ['requestTimestamp', 'TEXT'],
        ['requestPostData', 'TEXT'],
        ['redirectedToUrl', 'TEXT'],
        ['statusCode', 'INTEGER'],
        ['statusMessage', 'TEXT'],
        ['responseUrl', 'TEXT'],
        ['responseHeaders', 'TEXT'],
        ['responseTrailers', 'TEXT'],
        ['responseTimestamp', 'TEXT'],
        ['responseEncoding', 'TEXT'],
        ['responseData', 'BLOB'],
        ['socketId', 'INTEGER'],
        ['clientAlpn', 'TEXT'],
        ['dnsResolvedIp', 'TEXT'],
        ['isHttp2Push', 'INTEGER'],
        ['usedArtificialCache', 'INTEGER'],
        ['didUserScriptBlockResource', 'INTEGER'],
        ['requestOriginalHeaders', 'TEXT'],
        ['httpError', 'TEXT'],
        ['browserServedFromCache', 'TEXT'],
        ['browserLoadFailure', 'TEXT'],
        ['browserBlockedReason', 'TEXT'],
        ['browserCanceled', 'INTEGER'],
      ],
      true,
    );
  }

  public insert(
    tabId: string,
    meta: IResourceMeta,
    body: Buffer,
    extras: {
      socketId: number;
      redirectedToUrl?: string;
      originalHeaders: IResourceHeaders;
      clientAlpn: string;
      dnsResolvedIp?: string;
      wasCached?: boolean;
      didBlockResource: boolean;
      browserRequestId?: string;
      isHttp2Push: boolean;
      browserBlockedReason?: string;
      browserCanceled?: boolean;
    },
    error?: Error,
  ) {
    let errorString: string;
    if (error) {
      if (typeof error === 'string') errorString = error;
      else
        errorString = JSON.stringify({
          name: error.name,
          stack: error.stack,
          message: error.message,
          ...error,
        });
    }
    let contentEncoding: string;
    if (meta.response && meta.response.headers) {
      contentEncoding = <string>(
        (meta.response.headers['Content-Encoding'] ?? meta.response.headers['content-encoding'])
      );
    }
    return this.queuePendingInsert([
      meta.id,
      extras.browserRequestId,
      tabId,
      meta.type,
      meta.receivedAtCommandId,
      null,
      meta.request.method,
      meta.request.url,
      JSON.stringify(meta.request.headers ?? {}),
      JSON.stringify(meta.request.trailers ?? {}),
      meta.request.timestamp,
      meta.request.postData,
      extras.redirectedToUrl,
      meta.response?.statusCode,
      meta.response?.statusMessage,
      meta.response?.url,
      meta.response ? JSON.stringify(meta.response.headers ?? {}) : undefined,
      meta.response ? JSON.stringify(meta.response.trailers ?? {}) : undefined,
      meta.response?.timestamp,
      contentEncoding,
      meta.response ? body : undefined,
      extras.socketId,
      extras.clientAlpn,
      extras.dnsResolvedIp,
      extras.isHttp2Push ? 1 : 0,
      extras.wasCached ? 1 : 0,
      extras.didBlockResource ? 1 : 0,
      JSON.stringify(extras.originalHeaders ?? {}),
      errorString,
      meta.response?.browserServedFromCache,
      meta.response?.browserLoadFailure,
      extras.browserBlockedReason,
      extras.browserCanceled ? 1 : 0,
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
  devtoolsRequestId: number;
  tabId: string;
  type: ResourceType;
  receivedAtCommandId: number;
  seenAtCommandId: number;
  requestMethod: string;
  requestUrl: string;
  requestHeaders: string;
  requestTrailers?: string;
  requestTimestamp: string;
  requestPostData?: string;
  redirectedToUrl?: string;
  statusCode: number;
  statusMessage: string;
  responseUrl: string;
  responseHeaders: string;
  responseTrailers?: string;
  responseTimestamp: string;
  responseEncoding: string;
  responseData?: Buffer;
  socketId: number;
  clientAlpn: string;
  dnsResolvedIp?: string;
  usedArtificialCache: boolean;
  didUserScriptBlockResource: boolean;
  isHttp2Push: boolean;
  requestOriginalHeaders: string;
  httpError: string;

  browserServedFromCache?: 'service-worker' | 'disk' | 'prefetch' | 'unspecified';
  browserLoadFailure?: string;
  browserBlockedReason?: string;
  browserCanceled?: boolean;
}
