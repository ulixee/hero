export default function getTcpSettingsForOs(os?: { family: string; major: string }) {
  if (!os) return null;

  const osFamily = os.family;
  const osVersion = os.major;
  const ttl = expectedTtlValues[osFamily] ?? 64;

  let windowSize = expectedWindowSizes[osFamily];
  if (!windowSize || !windowSize.length) {
    if (osFamily === 'Windows') {
      if (parseInt(osVersion, 10) >= 10) {
        windowSize = expectedWindowSizes.Windows10;
      } else {
        windowSize = expectedWindowSizes.Windows7;
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
  'Mac OS X': 64,
  Linux: 64,
  Windows: 128,
};

const expectedWindowSizes = {
  'Mac OS X': [65535],
  Linux: [5840, 29200, 5720],
  Windows7: [8192],
  Windows10: [64240, 65535],
};
