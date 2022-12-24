import * as assert from 'assert';
import IValidationResult, { IValidationError } from '../interfaces/IValidationResult';

export interface IBaseConfig<TOptional extends boolean = boolean> {
  optional?: TOptional;
  description?: string;
}

export default abstract class BaseSchema<
  Type,
  TOptional extends boolean = boolean,
  Config extends IBaseConfig<TOptional> = IBaseConfig<TOptional>,
> {
  readonly $type: Type;
  readonly optional: TOptional;
  description?: string;

  abstract readonly typeName: string;

  constructor(config?: Config) {
    if (config) {
      Object.assign(this, config);
      if (isDefined(config.description)) {
        assert(typeof config.description === 'string', 'description must be a string');
      }
      if (isDefined(config.optional)) {
        assert(typeof config.optional === 'boolean', 'optional must be a boolean');
      }
    }
  }

  validate(value: any, path = '', validationTracker = ValidationTracker()): IValidationResult {
    if (!validationTracker.has(value, this)) {
      this.validationLogic(value, path, validationTracker);
    }
    return {
      success: !validationTracker.errors.length,
      errors: validationTracker.errors,
    };
  }

  protected abstract validationLogic(
    value: any,
    path: string,
    validationTracker: IValidationTracker,
  ): void;

  protected incorrectType(value: unknown, path: string, tracker: IValidationTracker): void {
    let actualType: string = typeof value;
    if (actualType === 'object') {
      if (value === null) actualType = 'null';
      if (Array.isArray(value)) actualType = 'array';
      if (value.constructor?.name !== 'Object') actualType = value.constructor?.name;
    }
    tracker.errors.push({
      path,
      code: 'invalidType',
      message: `Expected ${BaseSchema.inspect(this)}, but was ${actualType}`,
    });
  }

  protected failedConstraint(
    value: unknown,
    message: string,
    path: string,
    tracker: IValidationTracker,
  ): void {
    const info = message ? `: ${message}` : '';
    tracker.errors.push({
      path,
      code: 'constraintFailed',
      message: `Failed constraint check for ${BaseSchema.inspect(this)}${info}`,
    });
  }

  protected propertyMissing(
    property: BaseSchema<any>,
    path: string,
    tracker: IValidationTracker,
  ): void {
    tracker.errors.push({
      path,
      code: 'missing',
      message: `Expected ${BaseSchema.inspect(property, undefined)}, but was missing`,
    });
  }

  static inspect(schema: any, needsParens = false, circular = new Set<BaseSchema<any>>()): string {
    if (circular.has(schema)) {
      let s = `CIRCULAR ${schema.typeName}`;
      if (needsParens) s = `(${s})`;
      return s;
    }
    circular.add(schema);

    try {
      switch (schema.typeName) {
        case 'boolean':
        case 'number':
        case 'bigint':
        case 'buffer':
        case 'date':
        case 'string': {
          return schema.typeName;
        }
        case 'array':
          return `${schema}${BaseSchema.inspect(schema.element, true, circular)}[]`;
        case 'record': {
          const keys = Object.keys(schema.fields);
          return keys.length
            ? `{ ${keys
                .map(
                  k =>
                    `${schema}${k}${schema.fields[k].optional ? '?' : ''}: ${BaseSchema.inspect(
                      schema.fields[k],
                      false,
                      circular,
                    )};`,
                )
                .join(' ')} }`
            : '{}';
        }
      }
    } finally {
      circular.delete(schema);
    }
  }
}

export function isDefined(value: any): boolean {
  return !(value === null || value === undefined);
}

export type IValidationTracker = {
  errors: IValidationError[];
  has(candidate: object, type: BaseSchema<any, boolean>): boolean;
};

function ValidationTracker(): IValidationTracker {
  const members: WeakMap<object, WeakMap<BaseSchema<any>, true>> = new WeakMap();

  return {
    errors: [],
    has(candidate: object, type: BaseSchema<any>): boolean {
      let typeSet = members.get(candidate);
      const value = typeSet?.get(type) ?? false;
      if (candidate !== null && typeof candidate === 'object') {
        if (!typeSet) {
          typeSet = new WeakMap();
          members.set(candidate, typeSet);
        }
        typeSet.set(type, true);
      }
      return value;
    },
  };
}
