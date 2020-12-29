export default function getTcpSettingsForOs(operatingSystemId: string) {
  if (!operatingSystemId) return null;

  const [osName, osVersion] = operatingSystemId.match(/^([a-z-]+)-([0-9-]+)$/).slice(1);
  const ttl = expectedTtlValues[osName] ?? 64;

  let windowSize = expectedWindowSizes[osName];
  if (!windowSize || !windowSize.length) {
    if (osName === 'windows') {
      if (parseInt(osVersion, 10) >= 10) {
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
  'linux': 64,
  'windows': 128,
};

const expectedWindowSizes = {
  'mac-os': [65535],
  'linux': [5840, 29200, 5720],
  'windows-7': [8192],
  'Windows-10': [64240, 65535],
};
