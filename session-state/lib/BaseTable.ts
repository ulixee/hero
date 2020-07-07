import { Database as SqliteDatabase, Statement } from 'better-sqlite3';

type SqliteTypes = 'INTEGER' | 'TEXT' | 'BLOB';
type IRecord = (string | number | Buffer)[];

export default abstract class BaseTable<T> {
  protected pendingInserts: IRecord[] = [];
  protected readonly insertStatement: Statement;

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

  public hasPending() {
    return this.pendingInserts.length;
  }

  public flush() {
    const records = [...this.pendingInserts];
    this.pendingInserts.length = 0;

    for (const record of records) {
      this.insertStatement.run(...record);
    }
  }

  public insertNow(record: IRecord) {
    this.insertStatement.run(...record);
  }

  protected buildInsertStatement() {
    const keys = this.columns.map(x => x[0]);
    const params = keys.map(_ => '?').join(', ');
    const insertOrReplace = this.insertOrReplace ? ' OR REPLACE' : '';
    return `INSERT${insertOrReplace} INTO ${this.tableName} (${keys.join(
      ', ',
    )}) VALUES (${params})`;
  }

  private createTableStatement() {
    const definitions = this.columns.map(x => {
      let columnDef = `${x[0]} ${x[1]}`;
      if (x.length > 2) columnDef = `${columnDef} ${x[2]}`;
      return columnDef;
    });
    return `CREATE TABLE IF NOT EXISTS ${this.tableName} (${definitions})`;
  }
}
