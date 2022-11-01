import { IVersion } from '@ulixee/unblocked-specification/plugin/IUserAgentOption';

export default function getTcpSettingsForOs(
  name: string,
  version: IVersion,
): { ttl: number; windowSize: number } {
  if (!name) return null;

  const ttl = expectedTtlValues[name] ?? 64;

  let windowSize = expectedWindowSizes[name];
  if (!windowSize || !windowSize.length) {
    if (name === 'windows') {
      if (parseInt(version.major, 10) >= 10) {
        windowSize = expectedWindowSizes['windows-10'];
      } else {
        windowSize = expectedWindowSizes['windows-7'];
      }
    }
  }

  if (!windowSize || !windowSize.length) {
    return null;
  }

  return {
    ttl,
    windowSize: windowSize[0],
  };
}

const expectedTtlValues = {
  'mac-os': 64,
  linux: 64,
  windows: 128,
};

const expectedWindowSizes = {
  'mac-os': [65535],
  linux: [5840, 29200, 5720],
  'windows-7': [8192],
  'Windows-10': [64240, 65535],
};
