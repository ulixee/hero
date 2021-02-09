import Typeson from 'typeson';
import TypesonRegistry from 'typeson-registry/dist/presets/builtin';

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

const error = {
  error: {
    test(x) {
      return Typeson.toStringTag(x) === 'Error';
    },
    replace({ name, message, stack }) {
      return { name, message, stack };
    },
    revive({ name, message, stack }) {
      let Constructor = Error;
      if (global[name]) {
        Constructor = global[name];
      }
      const e = new Constructor(message);
      e.name = name;
      if (stack) e.stack = stack;
      return e;
    },
  },
};

const TSON = new Typeson().register(TypesonRegistry).register(buffer).register(error);

export default class TypeSerializer {
  static stringify(object: any): string {
    return TSON.stringify(object);
  }

  static parse(stringified: string): any {
    return TSON.parse(stringified);
  }
}
