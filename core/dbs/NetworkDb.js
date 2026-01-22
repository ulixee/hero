"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Database = require("better-sqlite3");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const fs = require("fs");
const Path = require("path");
const env_1 = require("../env");
const CertificatesTable_1 = require("../models/CertificatesTable");
const { log } = (0, Logger_1.default)(module);
class NetworkDb {
    constructor(databaseDir) {
        this.databaseDir = databaseDir;
        this.tables = [];
        try {
            fs.mkdirSync(databaseDir, { recursive: true });
        }
        catch { }
        this.db = new Database(Path.join(databaseDir, 'network.db'));
        this.certificates = new CertificatesTable_1.default(this.db);
        this.saveInterval = setInterval(this.flush.bind(this), 5e3).unref();
        if (env_1.default.enableSqliteWal) {
            this.db.unsafeMode(false);
            this.db.pragma('journal_mode = WAL');
            this.db.pragma('synchronous = NORMAL');
        }
        this.tables = [this.certificates];
        this.batchInsert = this.db.transaction(() => {
            for (const table of this.tables) {
                try {
                    table.runPendingInserts();
                }
                catch (error) {
                    if (String(error).match(/attempt to write a readonly database/) ||
                        String(error).match(/database is locked/)) {
                        clearInterval(this.saveInterval);
                        this.db = null;
                    }
                    log.error('NetworkDb.flushError', {
                        sessionId: null,
                        error,
                        table: table.tableName,
                    });
                }
            }
        });
    }
    close() {
        if (this.db) {
            clearInterval(this.saveInterval);
            this.flush();
            if (env_1.default.enableSqliteWal)
                this.db.pragma('wal_checkpoint(TRUNCATE)');
            this.db.close();
        }
        this.db = null;
    }
    flush() {
        if (!this.db || this.db.readonly)
            return;
        this.batchInsert.immediate();
    }
}
exports.default = NetworkDb;
//# sourceMappingURL=NetworkDb.js.map