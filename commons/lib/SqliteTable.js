"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SqliteTable {
    constructor(db, tableName, columns, insertOrReplace = false) {
        this.db = db;
        this.tableName = tableName;
        this.columns = columns;
        this.insertOrReplace = insertOrReplace;
        this.pendingInserts = [];
        this.insertSubscriptionRecords = [];
        if (!db.readonly) {
            this.db.exec(this.createTableStatement());
            this.insertStatement = this.db.prepare(this.buildInsertStatement());
            this.insertByKeyStatement = this.db.prepare(this.buildInsertByKeyStatement());
        }
    }
    findPendingInserts(cb) {
        return this.pendingInserts.filter(cb);
    }
    findPendingRecords(cb) {
        return this.pendingInserts.filter(cb).map(x => this.insertToObject(x));
    }
    subscribe(callbackFn) {
        if (this.insertCallbackFn)
            throw new Error('This table already has a subscriber');
        this.insertCallbackFn = callbackFn;
        const pendingRecords = this.pendingInserts.map(x => this.insertToObject(x));
        this.lastSubscriptionPublishTime = Date.now();
        process.nextTick(callbackFn, this.all().concat(pendingRecords));
    }
    unsubscribe() {
        this.insertCallbackFn = null;
    }
    runPendingInserts() {
        const records = [...this.pendingInserts];
        this.pendingInserts.length = 0;
        for (const record of records) {
            this.insertStatement.run(...record);
        }
    }
    insertNow(record) {
        this.insertStatement.run(...record);
        this.addRecordToPublish(record);
    }
    insertObject(record) {
        this.insertByKeyStatement.run(record);
        this.addRecordToPublish(record);
    }
    all() {
        const sort = this.defaultSortOrder ? ` ORDER BY ${this.defaultSortOrder}` : '';
        return this.db.prepare(`select * from ${this.tableName}${sort}`).all();
    }
    queuePendingInsert(record) {
        this.pendingInserts.push(record);
        this.addRecordToPublish(record);
    }
    objectToInsert(object) {
        const record = [];
        for (const [key] of this.columns) {
            record.push(object[key]);
        }
        return record;
    }
    buildInsertStatement() {
        const keys = this.columns.map(x => x[0]);
        const params = keys.map(() => '?').join(', ');
        const insertOrReplace = this.insertOrReplace ? ' OR REPLACE' : '';
        return `INSERT${insertOrReplace} INTO ${this.tableName} (${keys.join(', ')}) VALUES (${params})`;
    }
    buildInsertByKeyStatement() {
        const keys = this.columns.map(x => x[0]);
        const params = keys.map(x => `$${String(x)}`).join(', ');
        const insertOrReplace = this.insertOrReplace ? ' OR REPLACE' : '';
        return `INSERT${insertOrReplace} INTO ${this.tableName} (${keys.join(', ')}) VALUES (${params})`;
    }
    addRecordToPublish(record) {
        if (!this.insertCallbackFn)
            return;
        this.insertSubscriptionRecords.push(Array.isArray(record) ? this.insertToObject(record) : record);
        clearTimeout(this.subscriptionThrottle);
        if (Date.now() - this.lastSubscriptionPublishTime > 500) {
            this.lastSubscriptionPublishTime = Date.now();
            return process.nextTick(this.publishPendingRecords.bind(this));
        }
        this.subscriptionThrottle = setTimeout(this.publishPendingRecords.bind(this), 100).unref();
    }
    publishPendingRecords() {
        if (!this.insertCallbackFn)
            return;
        const records = [...this.insertSubscriptionRecords];
        this.insertSubscriptionRecords.length = 0;
        this.lastSubscriptionPublishTime = Date.now();
        this.insertCallbackFn(records);
    }
    createTableStatement() {
        const primaryKey = this.columns.filter(x => x[2]?.includes('PRIMARY KEY'));
        let primaryKeyAddon = '';
        if (primaryKey.length > 1) {
            primaryKeyAddon = `PRIMARY KEY (${primaryKey.map(x => x[0]).join(', ')})`;
            for (const key of primaryKey) {
                key.length = 2;
            }
        }
        const definitions = this.columns.map(x => {
            let columnDef = `${String(x[0])} ${x[1]}`;
            if (x.length > 2)
                columnDef = `${columnDef} ${x[2]}`;
            return columnDef;
        });
        if (primaryKeyAddon) {
            definitions.push(primaryKeyAddon);
        }
        return `CREATE TABLE IF NOT EXISTS ${this.tableName} (${definitions})`;
    }
    insertToObject(record) {
        const result = {};
        for (let i = 0; i < record.length; i += 1) {
            if (record[i] !== null)
                result[this.columns[i][0]] = record[i];
        }
        return result;
    }
}
exports.default = SqliteTable;
//# sourceMappingURL=SqliteTable.js.map