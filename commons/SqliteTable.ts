import type { Database as SqliteDatabase, Statement } from 'better-sqlite3';

type SqliteTypes = 'INTEGER' | 'TEXT' | 'BLOB';
type IRecord = (string | number | Buffer)[];

export default abstract class SqliteTable<T> {
  protected readonly insertStatement: Statement;
  protected defaultSortOrder?: string;
  protected insertCallbackFn?: (records: T[]) => void;

  protected pendingInserts: IRecord[] = [];

  private insertSubscriptionRecords: T[] = [];
  private subscriptionThrottle: NodeJS.Timeout;
  private lastSubscriptionPublishTime: Date;

  protected constructor(
    readonly db: SqliteDatabase,
    readonly tableName: string,
    readonly columns: [keyof T, SqliteTypes, string?][],
    private insertOrReplace = false,
  ) {
    if (!db.readonly) {
      this.db.exec(this.createTableStatement());
      this.insertStatement = this.db.prepare(this.buildInsertStatement());
    }
  }

  public findPendingInserts(cb: (record: IRecord) => boolean): IRecord[] {
    return this.pendingInserts.filter(cb);
  }

  public findPendingRecords(cb: (record: IRecord) => boolean): T[] {
    return this.pendingInserts.filter(cb).map(pending => {
      const result: any = {};
      for (let i = 0; i < pending.length; i += 1) {
        const col = this.columns[i];
        result[col[0]] = pending[i];
      }
      return result;
    });
  }

  public subscribe(callbackFn: (records: T[]) => void): void {
    this.insertCallbackFn = callbackFn;
    const pendingRecords = this.pendingInserts.map(x => this.insertToObject(x));
    this.lastSubscriptionPublishTime = new Date();
    process.nextTick(callbackFn, this.all().concat(pendingRecords));
  }

  public unsubscribe(): void {
    this.insertCallbackFn = null;
  }

  public runPendingInserts(): void {
    const records = [...this.pendingInserts];
    this.pendingInserts.length = 0;

    for (const record of records) {
      this.insertStatement.run(...record);
    }
  }

  public insertNow(record: IRecord): void {
    this.insertStatement.run(...record);
    this.addRecordToPublish(record);
  }

  public all(): T[] {
    const sort = this.defaultSortOrder ? ` ORDER BY ${this.defaultSortOrder}` : '';
    return this.db.prepare(`select * from ${this.tableName}${sort}`).all() as T[];
  }

  protected queuePendingInsert(record: IRecord): void {
    this.pendingInserts.push(record);
    this.addRecordToPublish(record);
  }

  protected buildInsertStatement(): string {
    const keys = this.columns.map(x => x[0]);
    const params = keys.map(() => '?').join(', ');
    const insertOrReplace = this.insertOrReplace ? ' OR REPLACE' : '';
    return `INSERT${insertOrReplace} INTO ${this.tableName} (${keys.join(
      ', ',
    )}) VALUES (${params})`;
  }

  private addRecordToPublish(record: IRecord): void {
    if (!this.insertCallbackFn) return;
    this.insertSubscriptionRecords.push(this.insertToObject(record));
    if (Date.now() - this.lastSubscriptionPublishTime.getTime() > 500) {
      return this.publishPendingRecords();
    }
    clearTimeout(this.subscriptionThrottle);
    this.subscriptionThrottle = setTimeout(this.publishPendingRecords.bind(this), 100).unref();
  }

  private publishPendingRecords(): void {
    if (!this.insertCallbackFn) return;
    const records = [...this.insertSubscriptionRecords];
    this.insertSubscriptionRecords.length = 0;
    this.lastSubscriptionPublishTime = new Date();
    this.insertCallbackFn(records);
  }

  private createTableStatement(): string {
    const definitions = this.columns.map(x => {
      let columnDef = `${x[0]} ${x[1]}`;
      if (x.length > 2) columnDef = `${columnDef} ${x[2]}`;
      return columnDef;
    });
    return `CREATE TABLE IF NOT EXISTS ${this.tableName} (${definitions})`;
  }

  private insertToObject(record: IRecord): T {
    const result: any = {};
    for (let i = 0; i < record.length; i += 1) {
      if (record[i] !== null) result[this.columns[i][0]] = record[i];
    }
    return result as T;
  }
}
