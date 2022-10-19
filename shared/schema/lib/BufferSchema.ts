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

export interface IBufferSchemaConfig extends IBaseConfig {
  encoding?: keyof typeof IBufferEncodingTypes;
}

export default class BufferSchema extends BaseSchema<Buffer, IBufferSchemaConfig> {
  readonly typeName = 'buffer';
  encoding?: keyof typeof IBufferEncodingTypes;

  constructor(config?: IBufferSchemaConfig) {
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
