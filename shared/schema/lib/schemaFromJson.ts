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
  if (json.typeName === 'number') return new NumberSchema(json);
  if (json.typeName === 'bigint') return new BigintSchema(json);
  if (json.typeName === 'boolean') return new BooleanSchema(json);
  if (json.typeName === 'buffer') return new BufferSchema(json);
  if (json.typeName === 'date') return new DateSchema(json);
  if (json.typeName === 'string') return new StringSchema(json);
  if (json.typeName === 'record') {
    const recordConfig: IRecordSchemaConfig<any> = {
      values: parseField(json.values),
    };
    if (json.keys) recordConfig.keys = new StringSchema(json.keys);
    return new RecordSchema(recordConfig);
  }
  if (json.typeName === 'array') {
    const elementConfig = parseField(json.element);
    return new ArraySchema({ element: elementConfig });
  }
  if (json.typeName === 'object') {
    return parseObjectSchema(json.fields);
  }
}

function parseObjectSchema(json: Record<string, IAnySchemaJson>): ObjectSchema<any> {
  const fields: Record<string, ISchemaAny> = {};
  for (const [field, schemaJson] of Object.entries(json)) {
    fields[field] = parseField(schemaJson);
  }
  return new ObjectSchema<any>({ fields });
}
