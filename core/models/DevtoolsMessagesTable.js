"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SqliteTable_1 = require("@ulixee/commons/lib/SqliteTable");
const InjectedScripts_1 = require("../lib/InjectedScripts");
class DevtoolsMessagesTable extends SqliteTable_1.default {
    constructor(db) {
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
        this.pageIds = new IdAssigner();
        this.workerIds = new IdAssigner();
        this.frameIds = new IdAssigner();
        this.requestIds = new IdAssigner();
    }
    insert(event) {
        if (filteredEventMethods.has(event.method))
            return;
        const params = event.params;
        const frameId = event.frameId;
        const requestId = event.requestId;
        const pageId = event.pageTargetId;
        const method = event.method;
        const result = event.result;
        function paramsStringifyFilter(key, value) {
            if (key === 'payloadData' &&
                method === 'Network.webSocketFrameSent' &&
                params.response?.payloadData?.includes(InjectedScripts_1.default.PageEventsCallbackName) &&
                value?.length > 250) {
                return `${value.substr(0, 25)}... [truncated ${value.length - 25} chars]`;
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
exports.default = DevtoolsMessagesTable;
class IdAssigner {
    constructor() {
        this.counter = 0;
        this.devtoolIdToNumeric = new Map();
    }
    get(id) {
        if (!id)
            return undefined;
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
//# sourceMappingURL=DevtoolsMessagesTable.js.map