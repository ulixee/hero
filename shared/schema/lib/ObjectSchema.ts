import * as assert from 'assert';
import BaseSchema, { IBaseConfig } from './BaseSchema';

export interface IObjectSchemaConfig<O extends Record<string, BaseSchema<any>>>
  extends IBaseConfig {
  fields: O;
}

export default class ObjectSchema<O extends Record<string, BaseSchema<any>>> extends BaseSchema<
  { [K in keyof O]?: O[K]['type'] },
  IObjectSchemaConfig<O>
> {
  readonly typeName = 'object';
  fields: O;

  constructor(config: IObjectSchemaConfig<O>) {
    super(config);
    assert(config.fields, 'You must configure the fields for this object');
    assert(
      Object.keys(config.fields).length,
      'You must configure one or more fields for this object',
    );
    assert(
      Object.values(config.fields).every(x => x instanceof BaseSchema),
      'Each value of fields must be a type of Schema',
    );
  }

  protected validationLogic(value, path, tracker): void {
    if (value === null || value === undefined) {
      return this.incorrectType(value, path, tracker);
    }

    const fields = this.fields;
    const keysOfFields = Object.keys(fields);
    if (keysOfFields.length && typeof value !== 'object') {
      return this.incorrectType(value, path, tracker);
    }

    const keys = [...new Set([...keysOfFields, ...Object.keys(value)])];
    for (const key of keys) {
      const childPath = `${path}.${key}`;
      if (key in fields) {
        const schema: BaseSchema<any> = fields[key];
        if (key in value) {
          const keyValue = value[key];
          if (schema.optional && (keyValue === undefined || keyValue === null)) {
          } else {
            schema.validate(keyValue, childPath, tracker);
          }
        } else if (!schema.optional) {
          this.propertyMissing(schema, childPath, tracker);
        }
      }
    }
  }
}
