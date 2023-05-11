import Callsite from '../lib/Callsite';
import SourceLoader from '../lib/SourceLoader';
import ISourceCodeLocation from '../interfaces/ISourceCodeLocation';

it('can lookup source code', () => {
  let callsite: ISourceCodeLocation[];
  // run code like this so we can see the true load (?? will be translated by typescript)
  function loadCallsite() {
    callsite ??= Callsite.getSourceCodeLocation();
    return callsite;
  }
  const site = loadCallsite();
  console.log(site);
  expect(SourceLoader.getSource(site[0]).code).toBe(`    callsite ??= Callsite.getSourceCodeLocation();`);
  expect(SourceLoader.getSource(site[1]).code).toBe(`  const site = loadCallsite();`);
});
