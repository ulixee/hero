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
  | StringSchema<boolean>
  | BooleanSchema<boolean>
  | NumberSchema<boolean>
  | BigintSchema<boolean>
  | BufferSchema<boolean>
  | DateSchema<boolean>
  | RecordSchema<any, boolean>
  | ObjectSchema<any, boolean>
  | ArraySchema<any, boolean>;

export { ArraySchema, ObjectSchema, ISchemaAny, DateUtilities };

export type FilterOptionalKeys<T> = {
  [K in keyof T]: T[K] extends { optional: true } ? K : never;
}[keyof T];

export type FilterRequiredKeys<T> = {
  [K in keyof T]: T[K] extends { optional: true } ? never : K;
}[keyof T];

export type IRecordSchemaType<T extends Record<string, BaseSchema<any, boolean>>> = {
  [K in FilterRequiredKeys<T>]: T[K]['$type'];
} & {
  [K in FilterOptionalKeys<T>]?: T[K]['$type'];
} extends infer P
  ? { [K in keyof P]: P[K] }
  : never;

export type ExtractSchemaType<T> = T extends BaseSchema<any, boolean>
  ? T['$type']
  : T extends Record<string, BaseSchema<any, boolean>>
  ? IRecordSchemaType<T>
  : unknown;

export function boolean<TOptional extends boolean = false>(
  config: IBooleanSchemaConfig<TOptional> = {},
): BooleanSchema<TOptional> {
  return new BooleanSchema(config);
}

export function number<TOptional extends boolean = false>(
  config: INumberSchemaConfig<TOptional> = {},
): NumberSchema<TOptional> {
  return new NumberSchema(config);
}

export function string<TOptional extends boolean = false>(
  config: IStringSchemaConfig<TOptional> = {},
): StringSchema<TOptional> {
  return new StringSchema(config);
}

export function bigint<TOptional extends boolean = false>(
  config: IBigintSchemaConfig<TOptional> = {},
): BigintSchema<TOptional> {
  return new BigintSchema(config);
}

export function buffer<TOptional extends boolean = false>(
  config: IBufferSchemaConfig<TOptional> = {},
): BufferSchema<TOptional> {
  return new BufferSchema(config);
}

export function date<TOptional extends boolean = false>(
  config: IDateSchemaConfig<TOptional> = {},
): DateSchema<TOptional> {
  return new DateSchema(config);
}

export function dateAdd(quantity: number, units: IUnits): DateUtilities {
  return new DateUtilities({ func: 'add', units, quantity });
}

export function dateSubtract(quantity: number, units: IUnits): DateUtilities {
  return new DateUtilities({ func: 'subtract', units, quantity });
}

export function record<Values extends BaseSchema<any, boolean>, TOptional extends boolean = false>(
  config: IRecordSchemaConfig<Values, TOptional>,
): RecordSchema<Values, TOptional> {
  return new RecordSchema(config);
}

export function object<
  O extends Record<string, BaseSchema<any, boolean>>,
  TOptional extends boolean = false,
>(config: IObjectSchemaConfig<O, TOptional>): ObjectSchema<O, false>;
export function object<O extends Record<string, BaseSchema<any, boolean>>>(
  fields: O,
): ObjectSchema<O, false>;
export function object(fieldsOrConfig): ObjectSchema<any> {
  if (
    !fieldsOrConfig.fields ||
    typeof fieldsOrConfig.fields !== 'object' ||
    !(Object.values(fieldsOrConfig.fields)[0] instanceof BaseSchema)
  ) {
    fieldsOrConfig = { fields: fieldsOrConfig } as IObjectSchemaConfig<any, any>;
  }
  return new ObjectSchema(fieldsOrConfig as any);
}

export function array<E extends BaseSchema<any>>(element: E): ArraySchema<E>;
export function array<E extends BaseSchema<any>, TOptional extends boolean = false>(
  config: IArraySchemaConfig<E, TOptional>,
): ArraySchema<E, TOptional>;
export function array<E extends BaseSchema<any>, TOptional extends boolean = false>(
  elementOrConfig: IArraySchemaConfig<E, TOptional> | E,
): ArraySchema<E, TOptional> {
  if (elementOrConfig instanceof BaseSchema) {
    elementOrConfig = { element: elementOrConfig };
  }
  return new ArraySchema(elementOrConfig);
}
