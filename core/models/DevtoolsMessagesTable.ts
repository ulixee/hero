import { Database as SqliteDatabase } from 'better-sqlite3';
import type { IPuppetContextEvents } from '@secret-agent/puppet-interfaces/IPuppetContext';
import SqliteTable from '@secret-agent/commons/SqliteTable';

export default class DevtoolsMessagesTable extends SqliteTable<IDevtoolsMessageRecord> {
  private fetchRequestIdToNetworkId = new Map<string, string>();
  private sentMessageIds: {
    id: number;
    sessionId: string;
    frameId?: string;
    requestId?: string;
  }[] = [];

  constructor(readonly db: SqliteDatabase) {
    super(db, 'DevtoolsMessages', [
      ['direction', 'TEXT'],
      ['pageTargetId', 'TEXT'],
      ['workerTargetId', 'TEXT'],
      ['frameId', 'TEXT'],
      ['requestId', 'TEXT'],
      ['sessionType', 'TEXT'],
      ['method', 'TEXT'],
      ['id', 'INTEGER'],
      ['params', 'TEXT'],
      ['error', 'TEXT'],
      ['result', 'TEXT'],
      ['timestamp', 'TEXT'],
    ]);
  }

  public insert(event: IPuppetContextEvents['devtools-message']) {
    if (filteredEventMethods.has(event.method)) return;
    const params = event.params;
    let frameId = event.frameId;
    let requestId: string;
    let pageId = event.pageTargetId;
    if (params) {
      frameId = frameId ?? params.frame?.id ?? params.frameId ?? params.context?.auxData?.frameId;

      // translate Fetch.requestPaused networkId (which is what we use in other parts of the app
      requestId =
        this.fetchRequestIdToNetworkId.get(params.requestId) ??
        params.networkId ??
        params.requestId;
      if (params.networkId) this.fetchRequestIdToNetworkId.set(params.requestId, params.networkId);

      if (!pageId && params.targetInfo && params.targetInfo?.type === 'page') {
        pageId = params.targetInfo.targetId;
      }
    }

    if ((requestId || frameId) && event.direction === 'send') {
      this.sentMessageIds.push({
        id: event.id,
        sessionId: event.sessionId,
        frameId,
      });
    }

    if ((!requestId || !frameId) && event.direction === 'receive' && event.id) {
      const match = this.sentMessageIds.find(
        x => x.id === event.id && x.sessionId === event.sessionId,
      );
      if (match) {
        this.sentMessageIds.splice(this.sentMessageIds.indexOf(match), 1);
        if (!frameId) frameId = match.frameId;
        if (!requestId) requestId = match.requestId;
      }
    }

    function paramsStringifyFilter(key: string, value: any) {
      if (
        key === 'payload' &&
        event.method === 'Runtime.bindingCalled' &&
        params.name === '__saPageListenerCallback' &&
        value?.length > 250
      ) {
        return `${value.substr(0, 250)}... truncated ${params.payload.length - 250} chars`;
      }

      // clean out post data (we have these in resources table)
      if (key === 'postData' && params.request) {
        return undefined;
      }
      return value;
    }

    const record = [
      event.direction,
      pageId,
      event.workerTargetId,
      frameId,
      requestId,
      event.sessionType,
      event.method,
      event.id,
      params ? JSON.stringify(params, paramsStringifyFilter) : undefined,
      event.error ? JSON.stringify(event.error) : undefined,
      event.result ? JSON.stringify(event.result) : undefined,
      event.timestamp.toISOString(),
    ];
    this.queuePendingInsert(record);
  }
}

const filteredEventMethods = new Set([
  'Network.dataReceived', // Not useful to SA since we use Mitm
  'Page.domContentEventFired', // duplicated by Page.lifecycleEvent
  'Page.loadEventFired', // duplicated by Page.lifecycleEvent
  // 'Network.requestWillBeSentExtraInfo', // handled by mitm
]);

export interface IDevtoolsMessageRecord {
  direction: 'send' | 'receive';
  pageTargetId?: string;
  workerTargetId?: string;
  frameId?: string;
  requestId?: string;
  sessionType: 'page' | 'worker' | 'browser';
  method?: string;
  id?: number;
  params?: string;
  error?: string;
  result?: string;
  timestamp: string;
}
