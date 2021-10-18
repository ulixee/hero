import ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';
import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';

export default class CommandsTable extends SqliteTable<ICommandMeta> {
  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'Commands',
      [
        ['id', 'INTEGER', 'NOT NULL PRIMARY KEY'],
        ['run', 'INTEGER', 'NOT NULL PRIMARY KEY'],
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
        ['reusedCommandFromRun', 'INTEGER'],
      ],
      true,
    );
    this.defaultSortOrder = 'id ASC';
  }

  public insert(commandMeta: ICommandMeta): void {
    commandMeta.resultType = commandMeta.result?.constructor?.name ?? typeof commandMeta.result;

    this.queuePendingInsert([
      commandMeta.id,
      commandMeta.run,
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
      commandMeta.resultType,
      commandMeta.reusedCommandFromRun,
    ]);
  }
}
