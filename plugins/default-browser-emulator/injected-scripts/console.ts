// This plugin is only needed when runtime domain is enabled,

import type { ScriptInput } from './_utils';

// and maybe when console domain is enabled.
export type Args = never;

export function main({
  utils: { ReflectCached, replaceFunction, proxyToTarget },
}: ScriptInput<Args>) {
  // Ported from chromium/src/v8/src/builtins/builtins-console.cc
  type ConsoleKeys = Array<keyof typeof console>;
  const CONSOLE_METHODS_WITH_FORMATTING: ConsoleKeys = [
    'debug',
    'error',
    'info',
    'log',
    'warn',
    'trace',
    'group',
    'groupCollapsed',
    'assert',
  ] as const;

  const CONSOLE_METHODS: ConsoleKeys = [
    'dir',
    'dirxml',
    'table',
    'groupEnd',
    'clear',
    'count',
    'countReset',
    'profile',
    'profileEnd',
    'timeLog',
  ] as const;

  const ALL_CONSOLE_METHODS: ConsoleKeys = [
    ...CONSOLE_METHODS_WITH_FORMATTING,
    ...CONSOLE_METHODS,
  ] as const;

  // TODO move to utils in PR to cache everything
  const CACHED = {
    Object,
    Date,
    Function,
    Error,
    RegExp,
    String,
    ArrayIsArray: Array.isArray,
    NumberParseFloat: Number.parseFloat,
    NumberParseInt: Number.parseInt,
    NumberNaN: Number.NaN,
    // eslint-disable-next-line no-restricted-properties
    ObjectPrototypeToString: Object.prototype.toString,
  };

  ALL_CONSOLE_METHODS.forEach(key => {
    if (typeof console[key] !== 'function') return;
    replaceFunction(console, key, (target, thisArg, argArray) => {
      if (CONSOLE_METHODS_WITH_FORMATTING.includes(key)) {
        formatter(argArray);
      }

      // Don't use map here, or it will leak in stacktraces
      for (let idx = 0; idx < argArray.length; idx++) {
        argArray[idx] = V8ValueStringBuilder.toString(argArray[idx]);
      }
      return ReflectCached.apply(target, thisArg, argArray);
    });
  });

  // Ported from chromium/src/v8/src/builtins/builtins-console.cc
  function formatter(args: any[]) {
    let idx = 0;
    if (args.length < 2 || typeof args[0] !== 'string') return true;

    const states: { str: string; offset: number }[] = [];
    states.push({ str: args[idx++], offset: 0 });
    while (states.length && idx < args.length) {
      const state = states.at(-1)!;
      state.offset = state.str.indexOf('%', state.offset);
      if (state.offset < 0 || state.offset === state.str.length - 1) {
        states.pop();
        continue;
      }
      let current = args.at(idx);
      const specifier = state.str[state.offset + 1];
      if (['d', 'f', 'i'].includes(specifier)) {
        if (typeof current === 'symbol') {
          current = CACHED.NumberNaN;
        } else {
          const fn = specifier === 'f' ? CACHED.NumberParseFloat : CACHED.NumberParseInt;
          const fnArgs = [current, 10] as const;
          try {
            current = fn(...fnArgs);
          } catch {
            return false;
          }
        }
      } else if (specifier === 's') {
        try {
          current = CACHED.String(current);
        } catch {
          return false;
        }
        states.push({ str: current, offset: 0 });
      } else if (['c', 'o', 'O', '_'].includes(specifier)) {
        idx++;
        state.offset += 2;
        continue;
      } else if (specifier === '%') {
        state.offset += 2;
        continue;
      } else {
        state.offset++;
        continue;
      }

      args[idx++] = current;
      state.offset += 2;
    }
    return true;
  }

  // Ported from chromium/src/v8/src/inspector/v8-console-message.cc
  const maxArrayItemsLimit = 10000;
  const maxStackDepthLimit = 32;

  class V8ValueStringBuilder {
    m_arrayLimit = maxArrayItemsLimit;
    m_tryCatch = false;
    m_builder = '';
    m_visitedArrays = new Set<Array<any>>();

    appendValue(value: any): boolean {
      if (value === null) return true;
      if (value === undefined) return true;
      // skip type casting

      if (typeof value === 'string') return this.appendString(value);
      if (typeof value === 'bigint') return this.appendBigInt(value);
      if (typeof value === 'symbol') return this.appendSymbol(value);
      if (CACHED.ArrayIsArray(value)) return this.appendArray(value);
      if (proxyToTarget.has(value)) {
        this.m_builder += '[object Proxy]';
        return true;
      }

      if (
        value instanceof CACHED.Object &&
        !(value instanceof CACHED.Date) &&
        !(value instanceof CACHED.Function) &&
        !(value instanceof CACHED.Error) &&
        !(value instanceof CACHED.RegExp)
      ) {
        try {
          // eslint-disable-next-line no-restricted-properties
          const string = CACHED.ObjectPrototypeToString.call(value);
          return this.appendString(string);
        } catch {
          this.m_tryCatch = true;
        }
      }

      try {
        const string = value.toString();
        return this.appendString(string);
      } catch {
        this.m_tryCatch = true;
        return false;
      }
    }

    appendArray(array: Array<any>): boolean {
      if (this.m_visitedArrays.has(array)) return true;
      const length = array.length;
      if (length > this.m_arrayLimit) return false;
      if (this.m_visitedArrays.size > maxStackDepthLimit) return false;

      let result = true;
      this.m_arrayLimit -= length;
      this.m_visitedArrays.add(array);
      for (let i = 0; i < length; i++) {
        if (i) this.m_builder += ',';
        const value = array[i];
        if (!this.appendValue(value)) {
          result = false;
          break;
        }
      }

      this.m_visitedArrays.delete(array);
      return result;
    }

    appendSymbol(symbol: symbol): boolean {
      this.m_builder += 'Symbol(';
      const result = this.appendValue(symbol.description);
      this.m_builder += ')';
      return result;
    }

    appendBigInt(bigint: bigint): boolean {
      let string;
      try {
        string = bigint.toString();
      } catch {
        this.m_tryCatch = true;
        return false;
      }
      const result = this.appendString(string);
      if (this.m_tryCatch) return false;
      this.m_builder += 'n';
      return result;
    }

    appendString(string: string): boolean {
      if (this.m_tryCatch) return false;
      this.m_builder += string;
      return true;
    }

    toString() {
      if (this.m_tryCatch) return '';
      return this.m_builder;
    }

    static toString(value: any): string {
      const builder = new this();
      if (!builder.appendValue(value)) return '';
      return builder.toString();
    }
  }
}
