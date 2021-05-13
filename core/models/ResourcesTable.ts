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
        ['socketId', 'INTEGER'],
        ['clientAlpn', 'TEXT'],
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
    if (this.hasPending(x => x[0] === id)) {
      this.flush();
    }
    this.db
      .prepare(`update ${this.tableName} set tabId=?, devtoolsRequestId=? where id=?`)
      .run(data.tabId, data.browserRequestId, id);
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
    if (this.hasPending(x => x[0] === resourceId)) {
      this.flush();
    }

    const record = this.db
      .prepare(`select responseData, responseEncoding from ${this.tableName} where id=? limit 1`)
      .get(resourceId);
    if (!record) return null;

    const { responseData, responseEncoding } = record;
    if (!decompress) return responseData;
    return await decodeBuffer(responseData, responseEncoding);
  }
}

export interface IResourcesRecord {
  id: number;
  devtoolsRequestId: number;
  tabId: number;
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
  socketId: number;
  clientAlpn: string;
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
