import * as assert from 'assert';
import BaseSchema, { IBaseConfig } from './BaseSchema';
import StringSchema from './StringSchema';

export interface IRecordSchemaConfig<Value extends BaseSchema<any>> extends IBaseConfig {
  values: Value;
  keys?: StringSchema;
}

export default class RecordSchema<Value extends BaseSchema<any>> extends BaseSchema<
  Record<string, Value>,
  IRecordSchemaConfig<Value>
> {
  readonly typeName = 'record';
  values: BaseSchema<any>;
  keys?: StringSchema;

  constructor(config: IRecordSchemaConfig<Value>) {
    super(config);
    assert(config.values, 'You must configure the types of values for this record');
    assert(
      config.values instanceof BaseSchema,
      'The values definition for this record must be a type of Schema',
    );
    if (config.keys) {
      assert(
        config.keys instanceof StringSchema,
        'The definition for keys of this record must be a StringSchema',
      );
    }
  }

  protected validationLogic(value, path, tracker): void {
    if (value === null || value === undefined) {
      return this.incorrectType(value, path, tracker);
    }

    if (typeof value !== 'object') {
      return this.incorrectType(value, path, tracker);
    }

    for (const key of Object.keys(value)) {
      const childPath = `${path}.${key}`;
      if (this.keys) this.keys.validate(key, childPath, tracker);
      const schema = this.values;
      schema.validate(value[key], childPath, tracker);
    }
  }
}
