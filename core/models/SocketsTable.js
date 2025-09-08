"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SqliteTable_1 = require("@ulixee/commons/lib/SqliteTable");
class SocketsTable extends SqliteTable_1.default {
    constructor(db) {
        super(db, 'Sockets', [
            ['id', 'INTEGER', 'NOT NULL PRIMARY KEY'],
            ['alpn', 'TEXT'],
            ['serverName', 'TEXT'],
            ['localAddress', 'TEXT'],
            ['remoteAddress', 'TEXT'],
            ['dnsResolvedIp', 'TEXT'],
            ['createTime', 'DATETIME'],
            ['dnsLookupTime', 'DATETIME'],
            ['ipcConnectionTime', 'DATETIME'],
            ['connectTime', 'DATETIME'],
            ['bytesRead', 'INTEGER'],
            ['bytesWritten', 'INTEGER'],
            ['errorTime', 'DATETIME'],
            ['closeTime', 'DATETIME'],
            ['connectError', 'TEXT'],
        ], true);
    }
    insert(record) {
        const { id, localAddress, remoteAddress, serverName, alpn, createTime, dnsLookupTime, ipcConnectionTime, dnsResolvedIp, connectTime, bytesRead, bytesWritten, errorTime, connectError, closeTime, } = record;
        return this.queuePendingInsert([
            id,
            alpn,
            serverName,
            localAddress,
            remoteAddress,
            dnsResolvedIp,
            createTime?.getTime(),
            dnsLookupTime?.getTime(),
            ipcConnectionTime?.getTime(),
            connectTime?.getTime(),
            bytesRead,
            bytesWritten,
            errorTime?.getTime(),
            closeTime?.getTime(),
            connectError,
        ]);
    }
}
exports.default = SocketsTable;
//# sourceMappingURL=SocketsTable.js.map