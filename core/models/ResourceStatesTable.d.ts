import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import ResourceState from '@ulixee/unblocked-agent-mitm/interfaces/ResourceState';
export default class ResourceStatesTable extends SqliteTable<IResourceStatesRecord> {
    constructor(db: SqliteDatabase);
    insert(resourceId: number, stateChanges: Map<ResourceState, Date>): void;
}
type ResourceStates = keyof typeof ResourceState & string;
export interface IResourceStatesRecord extends Record<ResourceStates, number> {
    resourceId: number;
}
export {};
