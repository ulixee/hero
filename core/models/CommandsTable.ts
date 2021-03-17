import ICommandMeta from '@secret-agent/core-interfaces/ICommandMeta';
import { Database as SqliteDatabase, Statement } from 'better-sqlite3';
import SqliteTable from '@secret-agent/commons/SqliteTable';

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
        ['args', 'TEXT'],
        ['startDate', 'TEXT'],
        ['endDate', 'TEXT'],
        ['result', 'TEXT'],
        ['resultType', 'TEXT'],
      ],
      true,
    );
    this.getQuery = db.prepare(`select * from ${this.tableName} where id = ? limit 1`);
    this.defaultSortOrder = 'startDate ASC';
  }

  public insert(commandMeta: ICommandMeta) {
    let stringifiedError: string;
    if (commandMeta.result instanceof Error) {
      stringifiedError = JSON.stringify({
        ...commandMeta.result,
        name: commandMeta.result.name,
        message: commandMeta.result.message,
        stack: commandMeta.result.stack,
      });
    } else {
      stringifiedError = JSON.stringify(commandMeta.result);
    }
    this.queuePendingInsert([
      commandMeta.id,
      commandMeta.tabId,
      commandMeta.frameId,
      commandMeta.name,
      commandMeta.args,
      commandMeta.startDate,
      commandMeta.endDate,
      stringifiedError,
      commandMeta.result?.constructor
        ? commandMeta.result.constructor.name
        : typeof commandMeta.result,
    ]);
  }

  public get(id: number) {
    return this.getQuery.get(id) as ICommandMeta;
  }
}
