import ICommandMeta from '@secret-agent/core-interfaces/ICommandMeta';
import BaseTable from '../lib/BaseTable';
import { Database as SqliteDatabase, Statement } from 'better-sqlite3';

export default class CommandsTable extends BaseTable<ICommandMeta> {
  private readonly getQuery: Statement;
  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'Commands',
      [
        ['id', 'INTEGER', 'NOT NULL PRIMARY KEY'],
        ['frameId', 'INTEGER'],
        ['name', 'TEXT'],
        ['result', 'TEXT'],
        ['resultType', 'TEXT'],
        ['startDate', 'TEXT'],
        ['endDate', 'TEXT'],
        ['args', 'TEXT'],
      ],
      true,
    );
    this.getQuery = db.prepare(`select * from ${this.tableName} where id = ? limit 1`);
  }

  public insert(commandMeta: ICommandMeta) {
    this.pendingInserts.push([
      commandMeta.id,
      commandMeta.frameId,
      commandMeta.name,
      JSON.stringify(commandMeta.result),
      commandMeta.result?.constructor
        ? commandMeta.result.constructor.name
        : typeof commandMeta.result,
      commandMeta.startDate,
      commandMeta.endDate,
      commandMeta.args,
    ]);
  }

  public get(id: number) {
    return this.getQuery.get(id) as ICommandMeta;
  }

  public all() {
    return this.db
      .prepare(`select * from ${this.tableName} order by startDate asc`)
      .all() as ICommandMeta[];
  }
}
