"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SqliteTable_1 = require("@ulixee/commons/lib/SqliteTable");
class CertificatesTable extends SqliteTable_1.default {
    constructor(db) {
        super(db, 'CertificatesV3', [
            ['host', 'TEXT', 'NOT NULL PRIMARY KEY'],
            ['key', 'BLOB'],
            ['pem', 'BLOB'],
            ['expireDate', 'INTEGER'],
        ], true);
        this.pemByHost = new Map();
        this.getQuery = db.prepare(`select * from ${this.tableName} where host = ? limit 1`);
    }
    save(record) {
        const { host, key, pem, expireDate } = record;
        this.pemByHost.set(host, record);
        this.queuePendingInsert([host, key, pem, expireDate]);
    }
    get(host) {
        if (this.pemByHost.has(host))
            return this.pemByHost.get(host);
        const record = this.getQuery.get(host);
        if (!record) {
            return null;
        }
        const millisUntilExpire = record.expireDate - Date.now();
        if (millisUntilExpire < 60 * 60e3) {
            return null;
        }
        this.pemByHost.set(host, record);
        return record;
    }
}
exports.default = CertificatesTable;
//# sourceMappingURL=CertificatesTable.js.map