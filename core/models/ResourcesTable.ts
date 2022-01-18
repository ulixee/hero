import decodeBuffer from '@ulixee/commons/lib/decodeBuffer';
import IResourceMeta from '@ulixee/hero-interfaces/IResourceMeta';
import { Database as SqliteDatabase } from 'better-sqlite3';
import IResourceType from '@ulixee/hero-interfaces/IResourceType';
import IResourceHeaders from '@ulixee/hero-interfaces/IResourceHeaders';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import IResourceSummary from '@ulixee/hero-interfaces/IResourceSummary';

export default class ResourcesTable extends SqliteTable<IResourcesRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'Resources',
      [
        ['id', 'INTEGER', 'NOT NULL PRIMARY KEY'],
        ['devtoolsRequestId', 'TEXT'],
        ['tabId', 'INTEGER'],
        ['frameId', 'INTEGER'],
        ['socketId', 'INTEGER'],
        ['protocol', 'TEXT'],
        ['type', 'TEXT'],
        ['receivedAtCommandId', 'INTEGER'],
        ['seenAtCommandId', 'INTEGER'],
        ['requestMethod', 'TEXT'],
        ['requestUrl', 'TEXT'],
        ['requestHeaders', 'TEXT'],
        ['requestTrailers', 'TEXT'],
        ['requestTimestamp', 'DATETIME'],
        ['requestPostData', 'TEXT'],
        ['redirectedToUrl', 'TEXT'],
        ['statusCode', 'INTEGER'],
        ['statusMessage', 'TEXT'],
        ['responseUrl', 'TEXT'],
        ['responseHeaders', 'TEXT'],
        ['responseTrailers', 'TEXT'],
        ['responseTimestamp', 'DATETIME'],
        ['responseEncoding', 'TEXT'],
        ['responseData', 'BLOB'],
        ['dnsResolvedIp', 'TEXT'],
        ['isHttp2Push', 'INTEGER'],
        ['usedArtificialCache', 'INTEGER'],
        ['didUserScriptBlockResource', 'INTEGER'],
        ['requestOriginalHeaders', 'TEXT'],
        ['responseOriginalHeaders', 'TEXT'],
        ['httpError', 'TEXT'],
        ['browserLoadedTimestamp', 'DATETIME'],
        ['browserServedFromCache', 'TEXT'],
        ['browserLoadFailure', 'TEXT'],
        ['browserBlockedReason', 'TEXT'],
        ['browserCanceled', 'INTEGER'],
        ['documentUrl', 'TEXT'],
      ],
      true,
    );
  }

  public updateReceivedTime(id: number, timestamp: number): void {
    const pendingInserts = this.findPendingInserts(x => x[0] === id);
    if (pendingInserts.length) {
      const pending = pendingInserts.pop();
      const index = this.columns.findIndex(x => x[0] === 'browserLoadedTimestamp');
      pending[index] = timestamp;
      return;
    }
    this.db
      .prepare(`update ${this.tableName} set browserLoadedTimestamp=? where id=?`)
      .run(timestamp, id);
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

  public getMeta(id: number, includeBody: boolean): IResourceMeta {
    const columns: (keyof IResourcesRecord)[] = [
      'id',
      'frameId',
      'tabId',
      'type',
      'requestMethod',
      'requestUrl',
      'requestHeaders',
      'requestTrailers',
      'requestTimestamp',
      'documentUrl',
      'redirectedToUrl',
      'receivedAtCommandId',
      'seenAtCommandId',
      'responseUrl',
      'responseHeaders',
      'responseTrailers',
      'responseTimestamp',
      'browserLoadedTimestamp',
      'browserLoadFailure',
      'browserServedFromCache',
      'statusCode',
      'statusMessage',
    ];
    if (includeBody) {
      columns.push('responseData', 'requestPostData');
    }
    const record: IResourcesRecord = this.db
      .prepare(
        `select ${columns.toString()}
        from ${this.tableName} where id=?`,
      )
      .get(id);

    return {
      id: record.id,
      frameId: record.frameId,
      tabId: record.tabId,
      url: record.responseUrl ?? record.requestUrl,
      type: record.type,
      documentUrl: record.documentUrl,
      isRedirect: !!record.redirectedToUrl,
      receivedAtCommandId: record.receivedAtCommandId,
      seenAtCommandId: record.seenAtCommandId,
      request: {
        url: record.requestUrl,
        method: record.requestMethod,
        headers: record.requestHeaders ? JSON.parse(record.requestHeaders) : null,
        timestamp: record.requestTimestamp,
        trailers: record.requestTrailers ? JSON.parse(record.requestTrailers) : null,
        postData: 'requestPostData' in record ? Buffer.from(record.requestPostData ?? []) : null,
      },
      response: {
        url: record.responseUrl,
        browserLoadedTime: record.browserLoadedTimestamp,
        browserLoadFailure: record.browserLoadFailure,
        browserServedFromCache: record.browserServedFromCache,
        headers: record.responseHeaders ? JSON.parse(record.responseHeaders) : null,
        trailers: record.responseTrailers ? JSON.parse(record.responseTrailers) : null,
        timestamp: record.responseTimestamp,
        statusCode: record.statusCode,
        statusMessage: record.statusMessage,
        remoteAddress: null,
        body: 'responseData' in record ? Buffer.from(record.responseData ?? []) : null,
      },
    };
  }

  public save(record: IResourcesRecord): void {
    return this.queuePendingInsert([
      record.id,
      record.devtoolsRequestId,
      record.tabId,
      record.frameId,
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
      record.browserLoadedTimestamp,
      record.browserServedFromCache,
      record.browserLoadFailure,
      record.browserBlockedReason,
      record.browserCanceled ? 1 : 0,
      record.documentUrl,
    ]);
  }

  public insert(
    tabId: number,
    meta: IResourceMeta,
    postData: Buffer,
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
  ): void {
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
      meta.frameId,
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
      postData,
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
      meta.response?.browserLoadedTime,
      meta.response?.browserServedFromCache,
      meta.response?.browserLoadFailure,
      extras.browserBlockedReason,
      extras.browserCanceled ? 1 : 0,
      meta.documentUrl,
    ]);
  }

  public withResponseTimeInRange(
    tabId: number,
    startTime: number,
    endTime: number,
  ): IResourceSummary[] {
    return this.db
      .prepare(
        `select frameId, requestUrl, responseUrl, statusCode, requestMethod, id, tabId, type, redirectedToUrl,
        responseHeaders, browserLoadedTimestamp, responseTimestamp
        from ${this.tableName} where tabId = ? and (
          (browserLoadedTimestamp is null and responseTimestamp >= ? and responseTimestamp <= ?) or
          (browserLoadedTimestamp is not null and browserLoadedTimestamp >= ? and browserLoadedTimestamp <= ?)
        )`,
      )
      .all(tabId, startTime, endTime, startTime, endTime)
      .map(ResourcesTable.toResourceSummary);
  }

  public filter(filters: { hasResponse?: boolean; isGetOrDocument?: boolean }): IResourceSummary[] {
    const { hasResponse, isGetOrDocument } = filters;

    const useResourceBody = hasResponse ? 'responseData is not null' : '1=1';
    const records = this.db
      .prepare(
        `select frameId, requestUrl, responseUrl, statusCode, requestMethod, id, tabId, type, redirectedToUrl, responseHeaders 
from ${this.tableName} where ${useResourceBody}`,
      )
      .all();

    return records
      .filter(resource => {
        if ((hasResponse && !resource.responseHeaders) || resource.responseHeaders === '{}')
          return false;
        if (isGetOrDocument && resource.requestMethod !== 'GET') {
          // if this is a POST of a document, allow it
          if (resource.type !== 'Document') return false;
        }
        return true;
      })
      .map(ResourcesTable.toResourceSummary);
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

  public getResourcePostDataById(resourceId: number): Buffer | null {
    const pendingRecords = this.findPendingRecords(x => x[0] === resourceId);

    let record = pendingRecords.find(x => !!x.requestPostData);

    if (!record) {
      record = this.db
        .prepare(`select requestPostData from ${this.tableName} where id=? limit 1`)
        .get(resourceId);
    }

    return record?.requestPostData ? Buffer.from(record.requestPostData) : null;
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

  public static toResourceSummary(record: IResourcesRecord): IResourceSummary {
    return {
      id: record.id,
      frameId: record.frameId,
      tabId: record.tabId,
      url: record.responseUrl ?? record.requestUrl,
      method: record.requestMethod,
      type: record.type,
      statusCode: record.statusCode,
      redirectedToUrl: record.redirectedToUrl,
      timestamp: record.browserLoadedTimestamp ?? record.responseTimestamp,
      hasResponse: !!record.responseHeaders,
    };
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
  frameId: number;
  socketId: number;
  protocol: string;
  type: IResourceType;
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

  browserLoadedTimestamp?: number;
  browserServedFromCache?: 'service-worker' | 'disk' | 'prefetch' | 'memory';
  browserLoadFailure?: string;
  browserBlockedReason?: string;
  browserCanceled?: boolean;
  documentUrl: string;
}
