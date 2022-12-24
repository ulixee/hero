import * as assert from 'assert';
import BaseSchema, { IBaseConfig } from './BaseSchema';

export interface IArraySchemaConfig<E extends BaseSchema<any>, TOptional extends boolean = boolean>
  extends IBaseConfig<TOptional> {
  element: E;
}

export default class ArraySchema<E extends BaseSchema<any>, TOptional extends boolean = boolean> extends BaseSchema<
  Array<E['$type']>,
  TOptional,
  IArraySchemaConfig<E, TOptional>
> {
  readonly typeName = 'array';
  element: E;

  constructor(config: IArraySchemaConfig<E, TOptional>) {
    super(config);
    assert(
      !!config.element,
      'You must provide a definition for the types of elements in this array',
    );
    assert(config.element instanceof BaseSchema, 'Element must be an instance of a type of Schema');
  }

  protected validationLogic(value, path, tracker): void {
    if (!Array.isArray(value)) {
      return this.incorrectType(value, path, tracker);
    }

    for (let i = 0; i < value.length; i += 1) {
      this.element.validate(value[i], `${path}.${i}`, tracker);
    }
  }
}
