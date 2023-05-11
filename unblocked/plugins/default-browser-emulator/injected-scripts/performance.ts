// This is here, because on Linux using Devtools, the lack of activationStart and renderBlockingStatus leads to blocking on some protections

proxyFunction(
  performance,
  'getEntriesByType',
  (target, thisArg, argArray): PerformanceEntryList => {
    const entries = ReflectCached.apply(target, thisArg, argArray);

    if (argArray[0] === 'navigation') {
      entries.forEach(entry => {
        proxyGetter(entry, 'activationStart', () => 0);
        proxyGetter(entry, 'renderBlockingStatus', () => 'non-blocking');
      });
    }

    return entries;
  },
);

proxyFunction(performance, 'getEntries', (target, thisArg, argArray): PerformanceEntryList => {
  const entries = ReflectCached.apply(target, thisArg, argArray);

  entries.forEach(entry => {
    if (entry.entryType === 'navigation') {
      proxyGetter(entry, 'activationStart', () => 0);
      proxyGetter(entry, 'renderBlockingStatus', () => 'non-blocking');
    }
  });

  return entries;
});
