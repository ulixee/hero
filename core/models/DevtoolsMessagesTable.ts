// eslint-disable-next-line max-classes-per-file
import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import DevtoolsSessionLogger from '@unblocked-web/agent/lib/DevtoolsSessionLogger';

export default class DevtoolsMessagesTable extends SqliteTable<IDevtoolsMessageRecord> {
  private pageIds = new IdAssigner();
  private workerIds = new IdAssigner();
  private frameIds = new IdAssigner();
  private requestIds = new IdAssigner();

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
      ['timestamp', 'DATETIME'],
    ]);
  }

  public insert(event: DevtoolsSessionLogger['EventTypes']['devtools-message']): void {
    if (filteredEventMethods.has(event.method)) return;
    const params = event.params;
    const frameId = event.frameId;
    const requestId = event.requestId;
    const pageId = event.pageTargetId;
    const method = event.method;
    const result = event.result;

    function paramsStringifyFilter(key: string, value: any): any {
      if (
        key === 'payload' &&
        method === 'Runtime.bindingCalled' &&
        params.name === '__heroPageListenerCallback' &&
        value?.length > 250
      ) {
        return `${value.substr(0, 250)}... [truncated ${value.length - 250} chars]`;
      }

      if ((key === 'headers' || key === 'postData') && params.request) {
        // clean out post data (we have these in resources table)
        return 'ULX_REMOVED_FOR_DB';
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
      result ? JSON.stringify(result) : undefined,
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
