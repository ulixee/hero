import { findClosestVersionMatch } from '../lib/VersionUtils';

test('it should findClosestVersionMatch even if minor is not matched', async () => {
  const versionMatch = findClosestVersionMatch('11-2', ['11']);
  expect(versionMatch).toBe('11');
}, 60e3);
