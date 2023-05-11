import moment = require('moment');
import { URL } from 'url';
import assert = require('assert');
import BaseSchema, { IBaseConfig, isDefined } from './BaseSchema';

export interface IStringSchemaConfig<TOptional extends boolean = boolean>
  extends IBaseConfig<TOptional> {
  format?: 'email' | 'url' | 'date' | 'time';
  regexp?: RegExp;
  enum?: string[];
  minLength?: number;
  maxLength?: number;
  length?: number;
}

export default class StringSchema<TOptional extends boolean = boolean> extends BaseSchema<
  string,
  TOptional,
  IStringSchemaConfig<TOptional>
> {
  public static DateFormat = 'YYYY-MM-DD';
  public static TimeFormat = 'HH:mm';

  readonly typeName = 'string';
  format?: 'email' | 'url' | 'date' | 'time';
  regexp?: RegExp;
  enum?: string[];
  minLength?: number;
  maxLength?: number;
  length?: number;

  constructor(config: IStringSchemaConfig<TOptional> = {}) {
    super(config);
    if (isDefined(this.format))
      assert(
        ['email', 'url', 'date', 'time'].includes(this.format),
        'format must be one of email, url, date, time',
      );
    if (isDefined(this.regexp))
      assert(this.regexp instanceof RegExp, 'regexp must be an instance of a regex');
    if (isDefined(this.enum)) {
      assert(Array.isArray(this.enum), 'enum must be an array of values');
      assert(
        this.enum.every(x => typeof x === 'string'),
        'enum must contain only strings',
      );
    }
    if (isDefined(config.minLength))
      assert(typeof config.minLength === 'number', 'minLength value must be a number');
    if (isDefined(config.maxLength))
      assert(typeof config.maxLength === 'number', 'maxLength value must be a number');
    if (isDefined(config.length))
      assert(typeof config.length === 'number', 'length value must be a number');
  }

  public toMoment(value: string): moment.Moment {
    if (this.format === 'date') return moment(value, StringSchema.DateFormat);
    if (this.format === 'time') return moment(value, StringSchema.TimeFormat);
    throw new Error('This StringSchema does not have a format of date or time.');
  }

  public toDate(value: string): Date {
    return this.toMoment(value).toDate();
  }

  public toFormat(date: Date | moment.Moment): string {
    if (date instanceof Date) {
      date = moment(date);
    }
    if (this.format === 'time') return date.format(StringSchema.TimeFormat);
    if (this.format === 'date') return date.format(StringSchema.DateFormat);
    throw new Error('This StringSchema does not have a format of date or time.');
  }

  protected validationLogic(value: any, path, tracker): void {
    if (typeof value !== this.typeName) {
      return this.incorrectType(value, path, tracker);
    }

    const config = this as IStringSchemaConfig<TOptional>;
    if (config.format) {
      switch (config.format) {
        case 'date': {
          if (!moment(value, StringSchema.DateFormat, true).isValid()) {
            return this.failedConstraint(
              value,
              ` This value does not follow the YYYY-MM-DD date pattern`,
              path,
              tracker,
            );
          }
          break;
        }
        case 'email': {
          if (!regexpEmail.test(value)) {
            return this.failedConstraint(value, ' This value is not a valid email', path, tracker);
          }
          break;
        }
        case 'time': {
          if (!moment(value, StringSchema.TimeFormat, true).isValid()) {
            return this.failedConstraint(
              value,
              ` This value does not follow the HH:mm time pattern`,
              path,
              tracker,
            );
          }
          break;
        }
        case 'url': {
          try {
            new URL(value);
          } catch (err) {
            return this.failedConstraint(value, ' This value is not a valid url', path, tracker);
          }
          break;
        }
      }
    }

    if (config.regexp && config.regexp instanceof RegExp && !config.regexp.test(value)) {
      return this.failedConstraint(
        value,
        ` This value does not match the field RegExp: /${config.regexp.source}/${config.regexp.flags}`,
        path,
        tracker,
      );
    }

    if (config.minLength !== undefined && value.length < config.minLength) {
      return this.failedConstraint(
        value,
        ' This value is shorter than the minLength',
        path,
        tracker,
      );
    }

    if (config.maxLength !== undefined && value.length > config.maxLength) {
      return this.failedConstraint(
        value,
        ' This value is shorter than the maxLength',
        path,
        tracker,
      );
    }

    if (config.length !== undefined && value.length !== config.length) {
      return this.failedConstraint(value, ' This value is not the required length', path, tracker);
    }

    if (config.enum?.length && !config.enum.includes(value)) {
      return this.failedConstraint(
        value,
        ' This value does not match the allowed enum values',
        path,
        tracker,
      );
    }
  }
}

// Taken from HTML spec: https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address
const regexpEmail =
  /^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
