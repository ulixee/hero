import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import ResourceState from '@unblocked-web/agent-mitm/interfaces/ResourceState';

const resourceStates = Object.keys(ResourceState).filter(
  x => ResourceState[x] === x,
) as ResourceStates[];

export default class ResourceStatesTable extends SqliteTable<IResourceStatesRecord> {
  constructor(db: SqliteDatabase) {
    super(
      db,
      'ResourceStates',
      [
        // @ts-ignore
        ['resourceId', 'INTEGER', 'NOT NULL PRIMARY KEY'],
        // @ts-ignore
        ...resourceStates.map(x => [x, 'INTEGER']),
      ],
      true,
    );
  }

  public insert(resourceId: number, stateChanges: Map<ResourceState, Date>): void {
    const states = resourceStates.map(x => stateChanges.get(ResourceState[x])?.getTime());
    return this.queuePendingInsert([resourceId, ...states]);
  }
}

type ResourceStates = keyof typeof ResourceState & string;
export interface IResourceStatesRecord extends Record<ResourceStates, number> {
  resourceId: number;
}
