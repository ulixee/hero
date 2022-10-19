import * as assert from 'assert';
import BaseSchema, { IBaseConfig, isDefined } from './BaseSchema';

export interface IBigintSchemaConfig extends IBaseConfig {
  min?: bigint;
  max?: bigint;
}

export default class BigintSchema extends BaseSchema<bigint, IBigintSchemaConfig> {
  readonly typeName = 'bigint';
  min?: bigint;
  max?: bigint;

  constructor(config: IBigintSchemaConfig = {}) {
    super(config);
    if (isDefined(config.min)) assert(typeof config.min === 'bigint', 'Min value must be a bigint');
    if (isDefined(config.max)) assert(typeof config.max === 'bigint', 'Max value must be a bigint');
  }

  protected validationLogic(value: any, path, tracker): void {
    if (typeof value !== this.typeName) {
      return this.incorrectType(value, path, tracker);
    }

    const config = this as IBigintSchemaConfig;
    if (config.max !== undefined && config.min !== null && value < config.min) {
      return this.failedConstraint(value, ' This value is smaller than the min.', path, tracker);
    }

    if (config.max !== undefined && config.max !== null && value > config.max) {
      return this.failedConstraint(value, ' This value is larger than the max.', path, tracker);
    }
  }
}
