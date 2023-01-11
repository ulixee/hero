import { IAnySchemaJson } from '../interfaces/ISchemaJson';
import NumberSchema from './NumberSchema';
import BigintSchema from './BigintSchema';
import BooleanSchema from './BooleanSchema';
import BufferSchema from './BufferSchema';
import DateSchema from './DateSchema';
import StringSchema from './StringSchema';
import RecordSchema, { IRecordSchemaConfig } from './RecordSchema';
import ArraySchema from './ArraySchema';
import ObjectSchema from './ObjectSchema';
import { ISchemaAny } from '../index';
import { IBaseConfig } from './BaseSchema';

export default function schemaFromJson(
  json: Record<string, IAnySchemaJson> | IAnySchemaJson,
): ISchemaAny {
  if (!json) return undefined;

  if (json?.typeName && typeof json.typeName === 'string') {
    return parseField(json as IAnySchemaJson);
  }
  return parseObjectSchema(json as Record<string, IAnySchemaJson>);
}

function parseField(json: IAnySchemaJson): ISchemaAny {
  const { typeName, element, fields, values, keys, ...config } = json as any;
  if (typeName === 'number') return new NumberSchema(config);
  if (typeName === 'bigint') return new BigintSchema(config);
  if (typeName === 'boolean') return new BooleanSchema(config);
  if (typeName === 'buffer') return new BufferSchema(config);
  if (typeName === 'date') return new DateSchema(config);
  if (typeName === 'string') return new StringSchema(config);
  if (typeName === 'record') {
    const recordConfig: IRecordSchemaConfig<any> = {
      values: parseField(values),
      ...config,
    };
    if (keys) recordConfig.keys = new StringSchema(keys);
    return new RecordSchema(recordConfig);
  }
  if (typeName === 'array') {
    const elementConfig = parseField(element);
    return new ArraySchema({ element: elementConfig, ...config });
  }
  if (typeName === 'object') {
    return parseObjectSchema(fields, config);
  }
}

function parseObjectSchema(
  json: Record<string, IAnySchemaJson>,
  options: IBaseConfig = {},
): ObjectSchema<any> {
  const fields: Record<string, ISchemaAny> = {};
  for (const [field, schemaJson] of Object.entries(json)) {
    fields[field] = parseField(schemaJson);
  }
  return new ObjectSchema<any>({ fields, ...options });
}
