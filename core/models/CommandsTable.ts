import ICommandMeta from '@secret-agent/interfaces/ICommandMeta';
import { Database as SqliteDatabase, Statement } from 'better-sqlite3';
import SqliteTable from '@secret-agent/commons/SqliteTable';
import TypeSerializer from '@secret-agent/commons/TypeSerializer';

export default class CommandsTable extends SqliteTable<ICommandMeta> {
  private readonly getQuery: Statement;
  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'Commands',
      [
        ['id', 'INTEGER', 'NOT NULL PRIMARY KEY'],
        ['tabId', 'INTEGER'],
        ['frameId', 'INTEGER'],
        ['name', 'TEXT'],
        ['wasPrefetched', 'INTEGER'],
        ['args', 'TEXT'],
        ['clientStartDate', 'INTEGER'],
        ['clientSendDate', 'INTEGER'],
        ['runStartDate', 'INTEGER'],
        ['endDate', 'INTEGER'],
        ['result', 'TEXT'],
        ['resultType', 'TEXT'],
      ],
      true,
    );
    this.getQuery = db.prepare(`select * from ${this.tableName} where id = ? limit 1`);
    this.defaultSortOrder = 'id ASC';
  }

  public insert(commandMeta: ICommandMeta) {
    this.queuePendingInsert([
      commandMeta.id,
      commandMeta.tabId,
      commandMeta.frameId,
      commandMeta.name,
      commandMeta.wasPrefetched ? 1 : 0,
      commandMeta.args,
      commandMeta.clientStartDate,
      commandMeta.clientSendDate,
      commandMeta.runStartDate,
      commandMeta.endDate,
      TypeSerializer.stringify(commandMeta.result),
      commandMeta.result?.constructor
        ? commandMeta.result.constructor.name
        : typeof commandMeta.result,
    ]);
  }

  public get(id: number) {
    return this.getQuery.get(id) as ICommandMeta;
  }
}
