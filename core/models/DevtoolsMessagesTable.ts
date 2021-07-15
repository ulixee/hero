// eslint-disable-next-line max-classes-per-file
import { Database as SqliteDatabase } from 'better-sqlite3';
import type { IPuppetContextEvents } from '@ulixee/hero-interfaces/IPuppetContext';
import SqliteTable from '@ulixee/commons/SqliteTable';

export default class DevtoolsMessagesTable extends SqliteTable<IDevtoolsMessageRecord> {
  private fetchRequestIdToNetworkId = new Map<string, string>();
  private pageIds = new IdAssigner();
  private workerIds = new IdAssigner();
  private frameIds = new IdAssigner();
  private requestIds = new IdAssigner();

  private sentMessageIds: {
    id: number;
    sessionId: string;
    frameId?: string;
    requestId?: string;
  }[] = [];

  constructor(readonly db: SqliteDatabase) {
    super(db, 'DevtoolsMessages', [
      ['send', 'INTEGER'],
      ['pageNumber', 'INTEGER'],
      ['workerNumber', 'INTEGER'],
      ['frameNumber', 'INTEGER'],
      ['requestNumber', 'INTEGER'],
      ['isBrowserSession', 'INTEGER'],
      ['method', 'TEXT'],
      ['id', 'INTEGER'],
      ['params', 'TEXT'],
      ['error', 'TEXT'],
      ['result', 'TEXT'],
      ['timestamp', 'INTEGER'],
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
        return `${value.substr(0, 250)}... [truncated ${value.length - 250} chars]`;
      }

      if (
        key === 'source' &&
        event.method === 'Page.addScriptToEvaluateOnNewDocument' &&
        value?.length > 50
      ) {
        return `${value.substr(0, 50)}... [truncated ${value.length - 50} chars]`;
      }

      if ((key === 'headers' || key === 'postData') && params.request) {
        // clean out post data (we have these in resources table)
        return 'HERO_REMOVED_FOR_DB';
      }
      return value;
    }

    const workerId = event.workerTargetId;
    const record = [
      event.direction === 'send' ? 1 : undefined,
      this.pageIds.get(pageId),
      this.workerIds.get(workerId),
      this.frameIds.get(frameId),
      this.requestIds.get(requestId),
      event.sessionType === 'browser' ? 1 : undefined,
      event.method,
      event.id,
      params ? JSON.stringify(params, paramsStringifyFilter) : undefined,
      event.error ? JSON.stringify(event.error) : undefined,
      event.result ? JSON.stringify(event.result) : undefined,
      event.timestamp.getTime(),
    ];
    this.queuePendingInsert(record);
  }
}

class IdAssigner {
  private counter = 0;
  private devtoolIdToNumeric = new Map<string, number>();
  get(id: string): number {
    if (!id) return undefined;
    if (!this.devtoolIdToNumeric.has(id)) {
      this.devtoolIdToNumeric.set(id, (this.counter += 1));
    }
    return this.devtoolIdToNumeric.get(id);
  }
}

const filteredEventMethods = new Set([
  'Network.dataReceived', // Not useful to Ulixee since we use Mitm
  'Page.domContentEventFired', // duplicated by Page.lifecycleEvent
  'Page.loadEventFired', // duplicated by Page.lifecycleEvent
]);

export interface IDevtoolsMessageRecord {
  send: boolean;
  pageNumber?: number;
  workerNumber?: number;
  frameNumber?: number;
  requestNumber?: string;
  isBrowserSession: boolean;
  method?: string;
  id?: number;
  params?: string;
  error?: string;
  result?: string;
  timestamp: number;
}
