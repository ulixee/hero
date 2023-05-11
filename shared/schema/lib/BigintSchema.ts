import assert = require('assert');
import BaseSchema, { IBaseConfig, isDefined } from './BaseSchema';

export interface IBigintSchemaConfig<TOptional extends boolean = false>
  extends IBaseConfig<TOptional> {
  min?: bigint;
  max?: bigint;
}

export default class BigintSchema<TOptional extends boolean = false> extends BaseSchema<
  bigint,
  TOptional,
  IBigintSchemaConfig<TOptional>
> {
  readonly typeName = 'bigint';
  min?: bigint;
  max?: bigint;

  constructor(config: IBigintSchemaConfig<TOptional> = {}) {
    super(config);
    if (isDefined(config.min)) assert(typeof config.min === 'bigint', 'Min value must be a bigint');
    if (isDefined(config.max)) assert(typeof config.max === 'bigint', 'Max value must be a bigint');
  }

  protected validationLogic(value: any, path, tracker): void {
    if (typeof value !== this.typeName) {
      return this.incorrectType(value, path, tracker);
    }

    const config = this as IBigintSchemaConfig<any>;
    if (config.max !== undefined && config.min !== null && value < config.min) {
      return this.failedConstraint(value, ' This value is smaller than the min.', path, tracker);
    }

    if (config.max !== undefined && config.max !== null && value > config.max) {
      return this.failedConstraint(value, ' This value is larger than the max.', path, tracker);
    }
  }
}
