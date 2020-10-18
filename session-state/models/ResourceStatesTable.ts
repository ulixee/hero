import { Database as SqliteDatabase } from "better-sqlite3";
import SqliteTable from "@secret-agent/commons/SqliteTable";
import ResourceState from "@secret-agent/mitm/interfaces/ResourceState";

const resourceStates = Object.keys(ResourceState).filter(
  x => ResourceState[x] === x,
) as ResourceStates[];

export default class ResourceStatesTable extends SqliteTable<IResourceStatesRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'ResourceStates',
      [
        // @ts-ignore
        ['resourceId', 'INTEGER', 'NOT NULL PRIMARY KEY'],
        // @ts-ignore
        ...resourceStates.map(x => [x, 'TEXT']),
      ],
      true,
    );
  }

  public insert(resourceId: number, stateChanges: Map<ResourceState, Date>) {
    const states = resourceStates.map(x => stateChanges.get(ResourceState[x])?.toISOString());
    return this.queuePendingInsert([resourceId, ...states]);
  }
}

type ResourceStates = keyof typeof ResourceState & string;
export interface IResourceStatesRecord extends Record<ResourceStates, string> {
  resourceId: number;
}
