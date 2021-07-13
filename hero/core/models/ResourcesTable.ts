import decodeBuffer from '@secret-agent/commons/decodeBuffer';
import IResourceMeta from '@secret-agent/interfaces/IResourceMeta';
import { Database as SqliteDatabase } from 'better-sqlite3';
import ResourceType from '@secret-agent/interfaces/ResourceType';
import IResourceHeaders from '@secret-agent/interfaces/IResourceHeaders';
import SqliteTable from '@secret-agent/commons/SqliteTable';

export default class ResourcesTable extends SqliteTable<IResourcesRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'Resources',
      [
        ['id', 'INTEGER', 'NOT NULL PRIMARY KEY'],
        ['devtoolsRequestId', 'TEXT'],
        ['tabId', 'INTEGER'],
        ['socketId', 'INTEGER'],
        ['protocol', 'TEXT'],
        ['type', 'TEXT'],
        ['receivedAtCommandId', 'INTEGER'],
        ['seenAtCommandId', 'INTEGER'],
        ['requestMethod', 'TEXT'],
        ['requestUrl', 'TEXT'],
        ['requestHeaders', 'TEXT'],
        ['requestTrailers', 'TEXT'],
        ['requestTimestamp', 'INTEGER'],
        ['requestPostData', 'TEXT'],
        ['redirectedToUrl', 'TEXT'],
        ['statusCode', 'INTEGER'],
        ['statusMessage', 'TEXT'],
        ['responseUrl', 'TEXT'],
        ['responseHeaders', 'TEXT'],
        ['responseTrailers', 'TEXT'],
        ['responseTimestamp', 'INTEGER'],
        ['responseEncoding', 'TEXT'],
        ['responseData', 'BLOB'],
        ['dnsResolvedIp', 'TEXT'],
        ['isHttp2Push', 'INTEGER'],
        ['usedArtificialCache', 'INTEGER'],
        ['didUserScriptBlockResource', 'INTEGER'],
        ['requestOriginalHeaders', 'TEXT'],
        ['responseOriginalHeaders', 'TEXT'],
        ['httpError', 'TEXT'],
        ['browserServedFromCache', 'TEXT'],
        ['browserLoadFailure', 'TEXT'],
        ['browserBlockedReason', 'TEXT'],
        ['browserCanceled', 'INTEGER'],
      ],
      true,
    );
  }

  public updateResource(id: number, data: { tabId: number; browserRequestId: string }): void {
    const pendingInserts = this.findPendingInserts(x => x[0] === id);
    if (pendingInserts.length) {
      const pending = pendingInserts.pop();
      pending[1] = data.browserRequestId;
      pending[2] = data.tabId;
      return;
    }
    this.db
      .prepare(`update ${this.tableName} set tabId=?, devtoolsRequestId=? where id=?`)
      .run(data.tabId, data.browserRequestId, id);
  }

  public get(id: number): IResourcesRecord {
    const pending = this.findPendingRecords(x => x[0] === id);
    if (pending.length) return pending.pop();

    return this.db.prepare(`select * from ${this.tableName} where id=?`).get(id);
  }

  public save(record: IResourcesRecord): void {
    return this.queuePendingInsert([
      record.id,
      record.devtoolsRequestId,
      record.tabId,
      record.socketId,
      record.protocol,
      record.type,
      record.receivedAtCommandId,
      record.seenAtCommandId,
      record.requestMethod,
      record.requestUrl,
      record.requestHeaders,
      record.requestTrailers,
      record.requestTimestamp,
      record.requestPostData,
      record.redirectedToUrl,
      record.statusCode,
      record.statusMessage,
      record.responseUrl,
      record.responseHeaders,
      record.responseTrailers,
      record.responseTimestamp,
      record.responseEncoding,
      record.responseData,
      record.dnsResolvedIp,
      record.isHttp2Push ? 1 : 0,
      record.usedArtificialCache ? 1 : 0,
      record.didUserScriptBlockResource ? 1 : 0,
      record.requestOriginalHeaders,
      record.responseOriginalHeaders,
      record.httpError,
      record.browserServedFromCache,
      record.browserLoadFailure,
      record.browserBlockedReason,
      record.browserCanceled ? 1 : 0,
    ]);
  }

  public insert(
    tabId: number,
    meta: IResourceMeta,
    body: Buffer,
    extras: {
      socketId: number;
      redirectedToUrl?: string;
      originalHeaders: IResourceHeaders;
      responseOriginalHeaders?: IResourceHeaders;
      protocol: string;
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
    const errorString = ResourcesTable.getErrorString(error);

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
      extras.socketId,
      extras.protocol,
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
      extras.dnsResolvedIp,
      extras.isHttp2Push ? 1 : 0,
      extras.wasCached ? 1 : 0,
      extras.didBlockResource ? 1 : 0,
      JSON.stringify(extras.originalHeaders ?? {}),
      JSON.stringify(extras.responseOriginalHeaders ?? {}),
      errorString,
      meta.response?.browserServedFromCache,
      meta.response?.browserLoadFailure,
      extras.browserBlockedReason,
      extras.browserCanceled ? 1 : 0,
    ]);
  }

  public getResponse(
    resourceId: number,
  ): Pick<
    IResourcesRecord,
    'responseEncoding' | 'responseHeaders' | 'statusCode' | 'responseData'
  > {
    const record = this.db
      .prepare(
        `select responseEncoding, responseHeaders, statusCode, responseData from ${this.tableName} where id=? limit 1`,
      )
      .get(resourceId);
    if (!record) return null;
    return record;
  }

  public async getResourceBodyById(resourceId: number, decompress = true): Promise<Buffer> {
    const pendingRecords = this.findPendingRecords(x => x[0] === resourceId);

    let record = pendingRecords.find(x => !!x.responseData);

    if (!record) {
      record = this.db
        .prepare(`select responseData, responseEncoding from ${this.tableName} where id=? limit 1`)
        .get(resourceId);
    }
    if (!record) return null;

    const { responseData, responseEncoding } = record;
    if (!decompress) return responseData;
    return await decodeBuffer(responseData, responseEncoding);
  }

  public static getErrorString(error: Error | string): string {
    if (error) {
      if (typeof error === 'string') return error;
      return JSON.stringify({
        name: error.name,
        stack: error.stack,
        message: error.message,
        ...error,
      });
    }
  }
}

export interface IResourcesRecord {
  id: number;
  devtoolsRequestId: string;
  tabId: number;
  socketId: number;
  protocol: string;
  type: ResourceType;
  receivedAtCommandId: number;
  seenAtCommandId: number;
  requestMethod: string;
  requestUrl: string;
  requestHeaders: string;
  requestTrailers?: string;
  requestTimestamp: number;
  requestPostData?: string;
  redirectedToUrl?: string;
  statusCode: number;
  statusMessage: string;
  responseUrl: string;
  responseHeaders: string;
  responseTrailers?: string;
  responseTimestamp: number;
  responseEncoding: string;
  responseData?: Buffer;
  dnsResolvedIp?: string;
  usedArtificialCache: boolean;
  didUserScriptBlockResource: boolean;
  isHttp2Push: boolean;
  requestOriginalHeaders: string;
  responseOriginalHeaders: string;
  httpError: string;

  browserServedFromCache?: 'service-worker' | 'disk' | 'prefetch' | 'memory';
  browserLoadFailure?: string;
  browserBlockedReason?: string;
  browserCanceled?: boolean;
}
