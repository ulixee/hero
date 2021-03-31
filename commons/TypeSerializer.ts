export default class TypeSerializer {
  public static errorTypes = new Map<string, { new (message?: string): Error }>();
  private static isNodejs = typeof process !== 'undefined' && process.release.name === 'node';

  public static parse(stringified: string, stackMarker = 'SERIALIZER'): any {
    return JSON.parse(stringified, (key, entry) => {
      if (!entry || !entry.type) return entry;

      const { value, type } = entry;

      if (type === 'BigInt') return BigInt(value);
      if (type === 'NaN') return Number.NaN;
      if (type === 'Infinity') return Number.POSITIVE_INFINITY;
      if (type === '-Infinity') return Number.NEGATIVE_INFINITY;
      if (type === 'DateIso') return new Date(value);
      if (type === 'Buffer64' || type === 'ArrayBuffer64') {
        if (this.isNodejs) {
          return Buffer.from(value, 'base64');
        }

        const decoded = globalThis.atob(value);
        // @ts-ignore
        const uint8Array = new TextEncoder().encode(decoded);
        if (!entry.args) return uint8Array;

        const { arrayType, byteOffset, byteLength } = entry.args;

        return new globalThis[arrayType](uint8Array.buffer, byteOffset, byteLength);
      }
      if (type === 'RegExp') return new RegExp(value[0], value[1]);
      if (type === 'Map') return new Map(value);
      if (type === 'Set') return new Set(value);
      if (type === 'Error') {
        const { name, message, stack, ...data } = value;
        let Constructor = this.errorTypes && this.errorTypes.get(name);
        if (!Constructor) {
          if (this.isNodejs) {
            Constructor = global[name] || Error;
          } else {
            Constructor = globalThis[name] || Error;
          }
        }

        const startStack = new Error('').stack.split(/\r?\n/).slice(1).join('\n');
        const e = new Constructor(message);
        e.name = name;
        Object.assign(e, data);
        if (stack) {
          e.stack = `${stack}\n${`------${stackMarker}`.padEnd(50, '-')}\n${startStack}`;
        }
        return e;
      }

      return entry;
    });
  }

  public static stringify(object: any): string {
    return JSON.stringify(object, (key, value) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const resultObject = {};
        for (const [k, v] of Object.entries(value)) {
          resultObject[k] = this.convertKeyValue(k, v);
        }
        return resultObject;
      }
      return this.convertKeyValue(key, value);
    });
  }

  private static convertKeyValue(_: string, value: any): any {
    if (Number.isNaN(value)) {
      return { type: 'NaN' };
    }

    if (value === Number.POSITIVE_INFINITY) {
      return { type: 'Infinity' };
    }

    if (value === Number.NEGATIVE_INFINITY) {
      return { type: '-Infinity' };
    }

    if (value === null || value === undefined) return value;

    const type = typeof value;
    if (type === 'boolean' || type === 'string' || type === 'number') return value;
    if (type === 'bigint') {
      return { type: 'BigInt', value: value.toString() };
    }

    if (value instanceof Date) {
      return { type: 'DateIso', value: value.toISOString() };
    }

    if (value instanceof RegExp) {
      return { type: 'RegExp', value: [value.source, value.flags] };
    }

    if (value instanceof Error) {
      const { name, message, stack, ...data } = value;
      return { type: 'Error', value: { name, message, stack, ...data } };
    }

    if (value instanceof Map) {
      return { type: 'Map', value: [...value.entries()] };
    }

    if (value instanceof Set) {
      return { type: 'Set', value: [...value] };
    }

    if (this.isNodejs) {
      if (value instanceof Buffer || Buffer.isBuffer(value)) {
        return { type: 'Buffer64', value: value.toString('base64') };
      }
    } else {
      if (ArrayBuffer.isView(value)) {
        // @ts-ignore
        const binary = new TextDecoder('utf8').decode(value.buffer);
        return {
          type: 'ArrayBuffer64',
          value: globalThis.btoa(binary),
          args: {
            arrayType: value[Symbol.toStringTag],
            byteOffset: value.byteOffset,
            byteLength: value.byteLength,
          },
        };
      }
      if (value instanceof ArrayBuffer) {
        // @ts-ignore
        const binary = new TextDecoder('utf8').decode(value);
        return {
          type: 'ArrayBuffer64',
          value: globalThis.btoa(binary),
        };
      }
    }

    return value;
  }
}

export function registerSerializableErrorType(errorConstructor: {
  new (message?: string): Error;
}): void {
  TypeSerializer.errorTypes.set(errorConstructor.name, errorConstructor);
}

export const stringifiedTypeSerializerClass = TypeSerializer.toString();
