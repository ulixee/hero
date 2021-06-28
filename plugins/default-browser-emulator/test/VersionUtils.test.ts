import { findClosestVersionMatch } from '../lib/VersionUtils';

test('it should findClosestVersionMatch even if minor is not matched', async () => {
  const versionMatch1 = findClosestVersionMatch('10-16', ['11']);
  const versionMatch2 = findClosestVersionMatch('11-2', ['11']);
  const versionMatch3 = findClosestVersionMatch('11-3', ['11']);

  expect(versionMatch1).toBe('11');
  expect(versionMatch2).toBe('11');
  expect(versionMatch3).toBe('11');
}, 60e3);
