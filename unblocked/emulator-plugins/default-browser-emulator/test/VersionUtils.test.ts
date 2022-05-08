import * as Path from 'path';
import { findClosestVersionMatch } from '../lib/VersionUtils';
import DefaultBrowserEmulator, { defaultBrowserEngine } from '../index';
import DataLoader from '../lib/DataLoader';
import getLocalOperatingSystemMeta from '../lib/utils/getLocalOperatingSystemMeta';

test('it should findClosestVersionMatch even if minor is not matched', async () => {
  const versionMatch1 = findClosestVersionMatch('10-16', ['11']);
  const versionMatch2 = findClosestVersionMatch('11-2', ['11']);
  const versionMatch3 = findClosestVersionMatch('11-3', ['11']);
  const versionMatch4 = findClosestVersionMatch('11-4', ['11']);

  expect(versionMatch1).toBe('11');
  expect(versionMatch2).toBe('11');
  expect(versionMatch3).toBe('11');
  expect(versionMatch4).toBe('11');
}, 60e3);

test('it should find correct browser meta', async () => {
  const browserMeta = DefaultBrowserEmulator.selectBrowserMeta(
    `Mozilla/5.0 (Macintosh; Intel Mac OS X 11_4_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${defaultBrowserEngine.version.major}.0.4324.182 Safari/537.36`,
  );
  const dataLoader = new DataLoader(Path.resolve(__dirname, '../'));
  const data = dataLoader.as(browserMeta.userAgentOption) as any;
  const asOsId = data.osDataDir.split('/').pop();
  expect(asOsId).toEqual('as-mac-os-11');
});

test('it should work with monteray', async () => {
  const OsMeta = getLocalOperatingSystemMeta('darwin', '500.0.0');
  expect(OsMeta.version.split('-').map(Number)[0]).toBeGreaterThanOrEqual(11);
});
