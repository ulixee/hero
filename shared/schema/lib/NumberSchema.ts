import * as assert from 'assert';
import BaseSchema, { IBaseConfig, isDefined } from './BaseSchema';

export interface INumberSchemaConfig extends IBaseConfig {
  min?: number;
  max?: number;
  decimals?: number;
  integer?: boolean;
}

export default class NumberSchema extends BaseSchema<number, INumberSchemaConfig> {
  readonly typeName = 'number';
  min?: number;
  max?: number;
  decimals?: number;
  integer?: boolean;

  constructor(config: INumberSchemaConfig = {}) {
    super(config);
    if (isDefined(config.min)) assert(typeof config.min === 'number', 'Min value must be a number');
    if (isDefined(config.max)) assert(typeof config.max === 'number', 'Max value must be a number');
    if (isDefined(config.decimals)) {
      assert(typeof config.decimals === 'number', 'number of required decimals must be a number');
    }
    if (isDefined(config.integer)) {
      assert(typeof config.integer === 'boolean', 'integer must be a boolean');
    }
  }

  protected validationLogic(value: any, path, tracker): void {
    if (typeof value !== this.typeName) {
      return this.incorrectType(value, path, tracker);
    }

    const config = this as INumberSchemaConfig;
    if (config.min !== undefined && config.min !== null && value < config.min) {
      return this.failedConstraint(value, ' This value is smaller than the min.', path, tracker);
    }

    if (config.max !== undefined && config.max !== null && value > config.max) {
      return this.failedConstraint(value, ' This value is larger than the max.', path, tracker);
    }

    if (config.integer === true && !Number.isInteger(value)) {
      return this.failedConstraint(value, ' This value is not an integer.', path, tracker);
    }

    if (config.decimals !== undefined && Number.isInteger(config.decimals)) {
      const decimals = String(value).split('.')[1]?.length ?? 0;
      if (decimals !== config.decimals) {
        return this.failedConstraint(
          value,
          ` This value has an invalid number of decimal places (${decimals})`,
          path,
          tracker,
        );
      }
    }
  }
}
