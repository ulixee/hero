"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SqliteTable_1 = require("@ulixee/commons/lib/SqliteTable");
class WebsocketMessagesTable extends SqliteTable_1.default {
    constructor(db) {
        super(db, 'WebsocketMessages', [
            ['id', 'INTEGER', 'NOT NULL PRIMARY KEY'],
            ['resourceId', 'INTEGER'],
            ['message', 'BLOB'],
            ['isBinary', 'INTEGER'],
            ['isFromServer', 'INTEGER'],
            ['timestamp', 'DATETIME'],
            ['receivedAtCommandId', 'INTEGER'],
            ['seenAtCommandId', 'INTEGER'],
        ]);
    }
    getMessages(resourceId) {
        return (this.db.prepare(`select * from ${this.tableName} where resourceId=?`).all(resourceId));
    }
    getTranslatedMessages(resourceId) {
        return this.getMessages(resourceId).map(message => {
            return {
                message: message.isBinary ? message.message : message.message.toString(),
                source: message.isFromServer ? 'server' : 'client',
                timestamp: message.timestamp,
                messageId: message.id,
                resourceId: message.resourceId,
            };
        });
    }
    insert(lastCommandId, resourceMessage) {
        return this.queuePendingInsert([
            resourceMessage.messageId,
            resourceMessage.resourceId,
            Buffer.from(resourceMessage.message),
            typeof resourceMessage.message !== 'string' ? 1 : 0,
            resourceMessage.source === 'server' ? 1 : 0,
            resourceMessage.timestamp,
            lastCommandId,
            undefined,
        ]);
    }
}
exports.default = WebsocketMessagesTable;
//# sourceMappingURL=WebsocketMessagesTable.js.map