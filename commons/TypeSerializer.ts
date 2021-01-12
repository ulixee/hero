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

const TSON = new Typeson().register(TypesonRegistry).register(buffer);

export default class TypeSerializer {
  static stringify(object: any): string {
    return TSON.stringify(object);
  }

  static parse(stringified: string): any {
    return TSON.parse(stringified);
  }
}
