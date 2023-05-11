import moment = require('moment');
import assert = require('assert');
import BaseSchema, { IBaseConfig, isDefined } from './BaseSchema';

export interface IDateSchemaConfig<TOptional extends boolean = boolean>
  extends IBaseConfig<TOptional> {
  future?: boolean;
  past?: boolean;
}

export default class DateSchema<TOptional extends boolean = boolean> extends BaseSchema<
  Date,
  TOptional,
  IDateSchemaConfig<TOptional>
> {
  readonly typeName = 'date';
  future?: boolean;
  past?: boolean;

  constructor(config: IDateSchemaConfig<TOptional> = {}) {
    super(config);
    if (isDefined(config.future))
      assert(typeof config.future === 'boolean', 'future must be a boolean');
    if (isDefined(config.past)) assert(typeof config.past === 'boolean', 'past must be a boolean');
    assert(!(config.past && config.future), "can't be both past and future");
  }

  protected validationLogic(value: any, path, tracker): void {
    const mDate = moment(value);
    if (!mDate.isValid()) {
      return this.incorrectType(value, path, tracker);
    }

    const config = this as IDateSchemaConfig;
    if (config.future && !mDate.isAfter(new Date())) {
      return this.failedConstraint(value, ' Value is not a date in the future.', path, tracker);
    }

    if (config.past && !mDate.isBefore(new Date())) {
      return this.failedConstraint(value, ' Value is not a date in the past.', path, tracker);
    }
  }
}
