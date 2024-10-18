import type { ScriptInput } from './_utils';

// This is here, because on Linux using Devtools, the lack of activationStart and renderBlockingStatus leads to blocking on some protections
export type Args = never;

export function main({
  utils: { replaceFunction, replaceGetter, ReflectCached },
}: ScriptInput<Args>) {
  replaceFunction(
    performance,
    'getEntriesByType',
    (target, thisArg, argArray): PerformanceEntryList => {
      const entries = ReflectCached.apply(target, thisArg, argArray) as any;

      if (argArray[0] === 'navigation') {
        entries.forEach(entry => {
          replaceGetter(entry, 'activationStart', () => 0);
          replaceGetter(entry, 'renderBlockingStatus', () => 'non-blocking');
        });
      }

      return entries;
    },
  );

  replaceFunction(performance, 'getEntries', (target, thisArg, argArray): PerformanceEntryList => {
    const entries = ReflectCached.apply(target, thisArg, argArray) as any;

    entries.forEach(entry => {
      if (entry.entryType === 'navigation') {
        replaceGetter(entry, 'activationStart', () => 0);
        replaceGetter(entry, 'renderBlockingStatus', () => 'non-blocking');
      }
    });

    return entries;
  });
}
