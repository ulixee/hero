import { IZodHandlers, IZodSchemaToApiTypes } from '../utils/IZodApi';
import { DatastoreApiSchemas } from './DatastoreApis';

export type IDatastoreApiTypes = IZodSchemaToApiTypes<typeof DatastoreApiSchemas>;

export type IDatastoreApis = IZodHandlers<typeof DatastoreApiSchemas>;

export default DatastoreApiSchemas;
