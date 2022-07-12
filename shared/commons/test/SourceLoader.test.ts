import { getCallsite } from '../lib/utils';
import SourceLoader from '../lib/SourceLoader';
import ISourceCodeLocation from '../interfaces/ISourceCodeLocation';

it('can lookup source code', () => {
  let callsite: ISourceCodeLocation[];
  // run code like this so we can see the true load (?? will be translated by typescript)
  function loadCallsite() {
    callsite ??= getCallsite();
    return callsite;
  }
  const site = loadCallsite();
  expect(SourceLoader.getSource(site[0]).code).toBe(`    callsite ??= getCallsite();`);
  expect(SourceLoader.getSource(site[1]).code).toBe(`  const site = loadCallsite();`);
});
