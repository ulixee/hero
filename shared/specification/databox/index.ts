import { IZodHandlers, IZodSchemaToApiTypes } from '../utils/IZodApi';
import { DataboxApiSchemas } from './DataboxApis';

export type IDataboxApiTypes = IZodSchemaToApiTypes<typeof DataboxApiSchemas>;

export type IDataboxApis = IZodHandlers<typeof DataboxApiSchemas>;

export default DataboxApiSchemas;
