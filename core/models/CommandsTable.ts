import ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';
import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';

export default class CommandsTable extends SqliteTable<ICommandMeta> {
  public history: ICommandMeta[] = [];

  public get last(): ICommandMeta | undefined {
    if (this.history.length === 0) return;
    return this.history[this.history.length - 1];
  }

  public get lastId(): number {
    return this.last?.id;
  }

  constructor(db: SqliteDatabase) {
    super(
      db,
      'Commands',
      [
        ['id', 'INTEGER', 'NOT NULL PRIMARY KEY'],
        ['retryNumber', 'INTEGER', 'NOT NULL PRIMARY KEY'],
        ['tabId', 'INTEGER'],
        ['frameId', 'INTEGER'],
        ['flowCommandId', 'INTEGER'],
        ['activeFlowHandlerId', 'INTEGER'],
        ['name', 'TEXT'],
        ['args', 'TEXT'],
        ['clientStartDate', 'INTEGER'],
        ['clientSendDate', 'INTEGER'],
        ['runStartDate', 'INTEGER'],
        ['endDate', 'INTEGER'],
        ['result', 'TEXT'],
        ['resultType', 'TEXT'],
        ['callsite', 'TEXT'],
      ],
      true,
    );
    this.defaultSortOrder = 'id ASC';
  }

  public loadHistory(): ICommandMeta[] {
    if (this.history.length) return this.history;
    this.history = this.all();

    for (const command of this.history) {
      if (typeof command.callsite === 'string') {
        command.callsite = JSON.parse((command.callsite as any) ?? '[]');
      }
      if (command.result && typeof command.result === 'string') {
        command.result = TypeSerializer.parse(command.result);
      }
      if (command.args && typeof command.args === 'string') {
        command.args = TypeSerializer.parse(command.args);
      }
    }
    this.history.sort((a, b) => {
      if (a.id === b.id) return a.retryNumber - b.retryNumber;
      return a.id - b.id;
    });
    return this.history;
  }

  public insert(commandMeta: ICommandMeta): void {
    commandMeta.resultType = commandMeta.result?.constructor?.name ?? typeof commandMeta.result;
    this.history.push(commandMeta);
    this.history.sort((a, b) => {
      if (a.id === b.id) return a.retryNumber - b.retryNumber;
      return a.id - b.id;
    });
    let args = commandMeta.args;
    if (typeof commandMeta.args !== 'string') {
      if (commandMeta.args.length === 0) args = undefined;
      else args = TypeSerializer.stringify(args);
    }
    this.queuePendingInsert([
      commandMeta.id,
      commandMeta.retryNumber ?? 0,
      commandMeta.tabId,
      commandMeta.frameId,
      commandMeta.flowCommandId,
      commandMeta.activeFlowHandlerId,
      commandMeta.name,
      args,
      commandMeta.clientStartDate,
      commandMeta.clientSendDate,
      commandMeta.runStartDate,
      commandMeta.endDate,
      TypeSerializer.stringify(commandMeta.result),
      commandMeta.resultType,
      commandMeta.callsite ? JSON.stringify(commandMeta.callsite) : undefined,
    ]);
  }
}
