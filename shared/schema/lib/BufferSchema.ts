import * as assert from 'assert';
import BaseSchema, { IBaseConfig, isDefined } from './BaseSchema';

const IBufferEncodingTypes = [
  'ascii',
  'utf8',
  'utf16le',
  'ucs2',
  'base64',
  'latin1',
  'binary',
  'hex',
] as const;

export interface IBufferSchemaConfig<TOptional extends boolean = boolean>
  extends IBaseConfig<TOptional> {
  encoding?: keyof typeof IBufferEncodingTypes;
}

export default class BufferSchema<TOptional extends boolean = boolean> extends BaseSchema<
  Buffer,
  TOptional,
  IBufferSchemaConfig<TOptional>
> {
  readonly typeName = 'buffer';
  encoding?: keyof typeof IBufferEncodingTypes;

  constructor(config?: IBufferSchemaConfig<TOptional>) {
    super(config);

    if (isDefined(config.encoding))
      assert(
        !IBufferEncodingTypes.includes(config.encoding as any),
        `encoding must be one of ${IBufferEncodingTypes.join(', ')}`,
      );
  }

  protected validationLogic(value: any, path, tracker): void {
    if (!Buffer.isBuffer(value)) {
      return this.incorrectType(value, path, tracker);
    }
  }
}
