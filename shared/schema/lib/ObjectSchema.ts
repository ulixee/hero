import assert = require('assert');
import BaseSchema, { IBaseConfig } from './BaseSchema';
import { ExtractSchemaType } from '../index';

type ISchemaRecord<
  O extends Record<string, TSchema>,
  TSchema extends BaseSchema<any, boolean> = BaseSchema<any, boolean>,
> = {
  [T in keyof O]: O[T];
};

export interface IObjectSchemaConfig<
  O extends Record<string, BaseSchema<any, boolean>>,
  TOptional extends boolean = boolean,
> extends IBaseConfig<TOptional> {
  fields: ISchemaRecord<O>;
}

export default class ObjectSchema<
  O extends Record<string, BaseSchema<any, boolean>>,
  TOptional extends boolean = boolean,
> extends BaseSchema<ExtractSchemaType<O>, TOptional, IObjectSchemaConfig<O, TOptional>> {
  readonly typeName = 'object';
  fields: O;

  constructor(config: IObjectSchemaConfig<O, TOptional>) {
    super(config);
    assert(config.fields, 'You must configure the fields for this object');
    assert(
      Object.keys(config.fields).length,
      'You must configure one or more fields for this object',
    );
    assert(
      Object.values(config.fields).every(x => x && x instanceof BaseSchema),
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
        const schema: BaseSchema<any, any> = fields[key];
        if (!schema || !(schema instanceof BaseSchema)) continue;
        const keyValue = value[key];
        if (keyValue !== null && keyValue !== undefined) {
          schema.validate(keyValue, childPath, tracker);
        } else if (!schema.optional) {
          this.propertyMissing(schema, childPath, tracker);
        }
      }
    }
  }
}
