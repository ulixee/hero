import deepDiff from '@ulixee/unblocked-browser-profiler/lib/deepDiff';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function warnForChromeOsDifferences(browserChromes: any, browserKey: string): void {
  const chromes = browserChromes[browserKey] ?? [];
  const firstChrome = chromes[0];
  for (const entry of chromes.slice(1)) {
    if (entry.prevProperty !== firstChrome.prevProperty) {
      console.log(
        'WARN: Browser chrome has different prev property by osKey',
        browserKey,
        entry.osKey,
        entry.prevProperty,
        firstChrome.prevProperty,
      );
    }
    const diff = deepDiff(firstChrome.chrome, entry.chrome);
    if (diff.added.length) {
      console.log(
        'WARN: Browser chrome has added props for this OS',
        browserKey,
        entry.osKey,
        diff.added,
      );
    }
    if (diff.removed.length) {
      console.log(
        'WARN: Browser chrome has removed props for this OS',
        browserKey,
        entry.osKey,
        diff.removed,
      );
    }
  }
}
