const Types = {
  number: 'number',
  string: 'string',
  boolean: 'boolean',
  object: 'object',
  bigint: 'bigint',
  NaN: 'NaN',
  Infinity: 'Infinity',
  NegativeInfinity: '-Infinity',
  DateIso: 'DateIso',
  Buffer64: 'Buffer64',
  ArrayBuffer64: 'ArrayBuffer64',
  RegExp: 'RegExp',
  Map: 'Map',
  Set: 'Set',
  Error: 'Error',
};

declare let Buffer;
declare let global;

export default class TypeSerializer {
  public static errorTypes = new Map<string, { new (message?: string): Error }>();

  private static isNodejs =
    // prettier-ignore
    // @ts-ignore
    typeof process !== 'undefined' && ('release' in process) && process.release?.name === 'node';

  public static parse(stringified: string, stackMarker = 'SERIALIZER'): any {
    return JSON.parse(stringified, this.reviver.bind(this, stackMarker));
  }

  public static revive(object: any, objectKey?: string): any {
    if (!object) return object;
    const marker = 'SERIALIZER';
    const revived = this.reviver(marker, objectKey, object);

    if (revived !== object) {
      if (revived instanceof Map) {
        return new Map([...revived].map(([key, value]) => this.reviver(marker, key, value)));
      }
      if (revived instanceof Set) {
        return new Set([...revived].map(value => this.reviver(marker, '', value)));
      }
      return revived;
    }

    if (object && typeof object === Types.object) {
      if (Array.isArray(object)) {
        object = object.map(x => this.revive(x));
      }
      const response = {};
      for (const [key, value] of Object.entries(object)) {
        response[key] = this.revive(value, key);
      }
      object = response;
    }
    return object;
  }

  public static stringify<T>(
    object: T,
    options?: { ignoreProperties?: (keyof T)[]; sortKeys?: boolean; format?: boolean },
  ): string {
    const final = TypeSerializer.replace(object, options);
    return JSON.stringify(final, null, options?.format ? 2 : null);
  }

  public static replace<T>(
    object: T,
    options?: { ignoreProperties?: (keyof T)[]; sortKeys?: boolean },
  ): unknown {
    if (object === undefined || object === null) return object;

    const replaced = this.typeReplacer(null, object, { sortKeys: options?.sortKeys });
    if (replaced !== object || (typeof replaced === 'object' && '__type' in replaced)) {
      return replaced;
    }

    if (object && typeof object === Types.object) {
      if (Array.isArray(object)) {
        return object.map(x => this.replace(x, options));
      }

      const keys = Object.keys(object);

      if (options?.sortKeys) keys.sort();
      const response: any = {};
      for (const key of keys) {
        if (options?.ignoreProperties) {
          if (options.ignoreProperties.includes(key as any)) continue;
        }
        response[key] = this.replace(object[key], options);
      }
      return response;
    }
    return object;
  }

  private static typeReplacer(_: string, value: any, options?: { sortKeys?: boolean }): any {
    if (value === null || value === undefined) return value;
    if (value === true || value === false) return value;

    if (Number.isNaN(value)) {
      return { __type: Types.NaN };
    }

    if (value === Number.POSITIVE_INFINITY) {
      return { __type: Types.Infinity };
    }

    if (value === Number.NEGATIVE_INFINITY) {
      return { __type: Types.NegativeInfinity };
    }

    const type = typeof value;

    if (type === Types.boolean || type === Types.string || type === Types.number) return value;
    if (type === Types.bigint || value instanceof BigInt) {
      return { __type: Types.bigint, value: value.toString() };
    }

    if (value instanceof Date) {
      return { __type: Types.DateIso, value: value.toISOString() };
    }

    if (value instanceof RegExp) {
      return { __type: Types.RegExp, value: [value.source, value.flags] };
    }

    if (
      value instanceof Error ||
      (type === 'object' &&
        'stack' in value &&
        'name' in value &&
        (value.name as string)?.endsWith?.('Error'))
    ) {
      const { name, message, stack, ...data } = value;
      const extras = this.replace(data, options) as object;
      return { __type: Types.Error, value: { name, message, stack, ...extras } };
    }

    if (value instanceof Map) {
      return {
        __type: Types.Map,
        value: [...value.entries()].map(x => this.replace(x, options)),
      };
    }

    if (value instanceof Set) {
      return { __type: Types.Set, value: [...value].map(x => this.replace(x, options)) };
    }

    if (this.isNodejs) {
      if (value instanceof Buffer || Buffer.isBuffer(value)) {
        return { __type: Types.Buffer64, value: value.toString('base64') };
      }
    } else {
      // @ts-ignore
      if (value instanceof DOMRect) {
        return value.toJSON();
      }
      // @ts-ignore
      if (value instanceof CSSStyleDeclaration) {
        const isNumber = /^\d+$/;
        const result = {};
        for (const key of Object.keys(value)) {
          if (isNumber.test(key)) continue;
          result[key] = value[key];
        }
        return result;
      }

      if (ArrayBuffer.isView(value)) {
        // @ts-ignore
        const binary = new TextDecoder('utf8').decode(value.buffer);
        return {
          __type: Types.ArrayBuffer64,
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
          __type: Types.ArrayBuffer64,
          value: globalThis.btoa(binary),
        };
      }
    }

    if (type === 'object' && 'toJSON' in value) {
      return value.toJSON();
    }

    return value;
  }

  private static reviver(stackMarker: string, key: string, entry: any): any {
    if (!entry || !entry.__type) return entry;

    const { value, __type: type } = entry;

    if (type === Types.number || type === Types.string || type === Types.boolean) return value;
    if (type === Types.bigint) return BigInt(value);
    if (type === Types.NaN) return Number.NaN;
    if (type === Types.Infinity) return Number.POSITIVE_INFINITY;
    if (type === Types.NegativeInfinity) return Number.NEGATIVE_INFINITY;
    if (type === Types.DateIso) return new Date(value);
    if (type === Types.Buffer64 || type === Types.ArrayBuffer64) {
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
    if (type === Types.RegExp) return new RegExp(value[0], value[1]);
    if (type === Types.Map) {
      return new Map(value);
    }
    if (type === Types.Set) {
      return new Set(value);
    }
    if (type === Types.Error) {
      const { name, message, stack, ...data } = value;
      const extras = this.revive(data);
      let Constructor = this.errorTypes && this.errorTypes.get(name);
      if (!Constructor) {
        if (this.isNodejs) {
          Constructor = global[name] || Error;
        } else {
          Constructor = globalThis[name] || Error;
        }
      }

      const startStack = new Error('').stack.slice(8); // "Error: \n" is 8 chars

      const e = new Constructor();
      e.message = message;
      e.name = name;
      Object.assign(e, extras);
      if (stack) {
        e.stack = `${stack}\n${`------${stackMarker}`.padEnd(50, '-')}\n${startStack}`;
      }
      return e;
    }

    return entry;
  }
}

export function registerSerializableErrorType(errorConstructor: {
  new (...args: any[]): Error;
}): void {
  TypeSerializer.errorTypes.set(errorConstructor.name, errorConstructor);
}

export const stringifiedTypeSerializerClass = `const Types = ${JSON.stringify(
  Types,
)};\n${TypeSerializer.toString()}`;
