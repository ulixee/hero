import * as Typeson from 'typeson';
import * as TypesonRegistry from 'typeson-registry/dist/presets/builtin';
import { CanceledPromiseError } from './interfaces/IPendingWaitEvent';

const buffer = {
  buffer: {
    test(x) {
      return x !== null && x instanceof Buffer;
    },
    replace(n) {
      return n?.toJSON().data;
    },
    revive(s) {
      return Buffer.from(s);
    },
  },
};

const errorHandler = {
  error: {
    test(x) {
      return x instanceof Error || Typeson.toStringTag(x) === 'Error';
    },
    replace({ name, message, stack, ...data }) {
      return { name, message, stack, ...data };
    },
    revive({ name, message, stack, ...data }) {
      let Constructor = Error;
      if (global[name]) {
        Constructor = global[name];
      }
      if (name === 'CanceledPromiseError') Constructor = CanceledPromiseError as any;

      const e = new Constructor(message);
      e.name = name;
      if (stack) e.stack = stack;
      Object.assign(e, data);
      return e;
    },
  },
};

const TSON = new Typeson().register(TypesonRegistry).register(buffer).register(errorHandler);

export default class TypeSerializer {
  static stringify(object: any): string {
    return TSON.stringify(object);
  }

  static parse(stringified: string): any {
    return TSON.parse(stringified);
  }
}
