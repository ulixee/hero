import BaseSchema from './lib/BaseSchema';
import NumberSchema, { INumberSchemaConfig } from './lib/NumberSchema';
import StringSchema, { IStringSchemaConfig } from './lib/StringSchema';
import BigintSchema, { IBigintSchemaConfig } from './lib/BigintSchema';
import ObjectSchema, { IObjectSchemaConfig } from './lib/ObjectSchema';
import ArraySchema, { IArraySchemaConfig } from './lib/ArraySchema';
import BooleanSchema, { IBooleanSchemaConfig } from './lib/BooleanSchema';
import BufferSchema, { IBufferSchemaConfig } from './lib/BufferSchema';
import DateSchema, { IDateSchemaConfig } from './lib/DateSchema';
import RecordSchema, { IRecordSchemaConfig } from './lib/RecordSchema';
import { DateUtilities, IUnits } from './lib/DateUtilities';

type ISchemaAny =
  | StringSchema
  | BooleanSchema
  | NumberSchema
  | BigintSchema
  | BufferSchema
  | DateSchema
  | RecordSchema<any>
  | ObjectSchema<any>
  | ArraySchema<any>;

export { ArraySchema, ObjectSchema, ISchemaAny, DateUtilities };

type IRecordSchemaType<T extends Record<string, ISchemaAny>> = {
  [P in keyof T]: T[P]['type'];
};

export type ExtractSchemaType<T> = T extends BaseSchema<any>
  ? T['type']
  : T extends Record<string, ISchemaAny>
  ? IRecordSchemaType<T>
  : any;

export function boolean(config: IBooleanSchemaConfig = {}): BooleanSchema {
  return new BooleanSchema(config);
}

export function number(config: INumberSchemaConfig = {}): NumberSchema {
  return new NumberSchema(config);
}

export function string(config: IStringSchemaConfig = {}): StringSchema {
  return new StringSchema(config);
}

export function bigint(config: IBigintSchemaConfig = {}): BigintSchema {
  return new BigintSchema(config);
}

export function buffer(config: IBufferSchemaConfig = {}): BufferSchema {
  return new BufferSchema(config);
}

export function date(config: IDateSchemaConfig = {}): DateSchema {
  return new DateSchema(config);
}

export function dateAdd(quantity: number, units: IUnits): DateUtilities {
  return new DateUtilities({ func: 'add', units, quantity });
}

export function dateSubtract(quantity: number, units: IUnits): DateUtilities {
  return new DateUtilities({ func: 'subtract', units, quantity });
}

export function record<Values extends BaseSchema<any>>(
  config: IRecordSchemaConfig<Values>,
): RecordSchema<Values> {
  return new RecordSchema(config);
}

export function object<O extends Record<string, BaseSchema<any>>>(
  config: IObjectSchemaConfig<O>,
): ObjectSchema<O>;
export function object<O extends Record<string, BaseSchema<any>>>(fields: O): ObjectSchema<O>;
export function object<O extends Record<string, BaseSchema<any>>>(
  fieldsOrConfig: IObjectSchemaConfig<O> | O,
): ObjectSchema<O> {
  if (
    !fieldsOrConfig.fields ||
    typeof fieldsOrConfig.fields !== 'object' ||
    !(Object.values(fieldsOrConfig.fields)[0] instanceof BaseSchema)
  ) {
    fieldsOrConfig = { fields: fieldsOrConfig } as IObjectSchemaConfig<O>;
  }
  return new ObjectSchema(fieldsOrConfig as IObjectSchemaConfig<O>);
}

export function array<E extends BaseSchema<any>>(element: E): ArraySchema<E>;
export function array<E extends BaseSchema<any>>(config: IArraySchemaConfig<E>): ArraySchema<E>;
export function array<E extends BaseSchema<any>>(
  elementOrConfig: IArraySchemaConfig<E> | E,
): ArraySchema<E> {
  if (elementOrConfig instanceof BaseSchema) {
    elementOrConfig = { element: elementOrConfig };
  }
  return new ArraySchema(elementOrConfig);
}
