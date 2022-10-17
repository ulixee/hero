import BaseSchema, { IBaseConfig } from './BaseSchema';

export interface IBooleanSchemaConfig extends IBaseConfig {}

export default class BooleanSchema extends BaseSchema<boolean, IBooleanSchemaConfig> {
  readonly typeName = 'boolean';

  protected validationLogic(value: any, path, tracker): void {
    if (typeof value !== this.typeName) {
      return this.incorrectType(value, path, tracker);
    }
  }
}
