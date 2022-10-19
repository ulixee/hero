import { IBaseConfig } from '../lib/BaseSchema';
import { IBigintSchemaConfig } from '../lib/BigintSchema';
import { IBooleanSchemaConfig } from '../lib/BooleanSchema';
import { IBufferSchemaConfig } from '../lib/BufferSchema';
import { IDateSchemaConfig } from '../lib/DateSchema';
import { INumberSchemaConfig } from '../lib/NumberSchema';
import { IStringSchemaConfig } from '../lib/StringSchema';

export type IAnySchemaJson =
  | IArraySchemaJson
  | IObjectSchemaJson
  | IBigintSchemaJson
  | IBooleanSchemaJson
  | IBufferSchemaJson
  | IDateSchemaJson
  | IStringSchemaJson
  | INumberSchemaJson
  | IRecordSchemaJson;

export interface IArraySchemaJson extends IBaseConfig {
  typeName: 'array';
  element: IObjectSchemaJson;
}

export interface IObjectSchemaJson extends IBaseConfig {
  typeName: 'object';
  fields: Record<string, IAnySchemaJson>;
}

export interface IBigintSchemaJson extends IBigintSchemaConfig {
  typeName: 'bigint';
}

export interface IBooleanSchemaJson extends IBooleanSchemaConfig {
  typeName: 'boolean';
}

export interface IBufferSchemaJson extends IBufferSchemaConfig {
  typeName: 'buffer';
}

export interface IDateSchemaJson extends IDateSchemaConfig {
  typeName: 'date';
}

export interface INumberSchemaJson extends INumberSchemaConfig {
  typeName: 'number';
}

export interface IStringSchemaJson extends IStringSchemaConfig {
  typeName: 'string';
}

export interface IRecordSchemaJson extends IBaseConfig {
  typeName: 'record';
  values: IAnySchemaJson;
  keys?: IStringSchemaJson;
}
