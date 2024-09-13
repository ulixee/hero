import ITcpProfile from '@double-agent/collect/plugins/tcp/interfaces/IProfile';
import RealUserAgents from '@ulixee/real-user-agents';
import ExpectedValueCheck from './checks/ExpectedValueCheck';
import ExpectedValuesCheck from './checks/ExpectedValuesCheck';

export default class CheckGenerator {
  public readonly ttlChecks = [];
  public readonly winChecks = [];

  private readonly profile: ITcpProfile;

  constructor(profile: ITcpProfile) {
    this.profile = profile;
    this.extractTtlChecks();
    this.extractWindowSizeChecks();
  }

  private extractTtlChecks() {
    const { userAgentId } = this.profile;
    const { operatingSystemName } = RealUserAgents.extractMetaFromUserAgentId(userAgentId);
    const expectedValue = expectedTtlValues[operatingSystemName];

    const check = new ExpectedValueCheck(
      { userAgentId },
      { path: 'time-to-live' },
      expectedValue,
      this.profile.data.ttl,
    );
    this.ttlChecks.push(check);
  }

  private extractWindowSizeChecks() {
    const { userAgentId } = this.profile;
    const { operatingSystemName, operatingSystemVersion } =
      RealUserAgents.extractMetaFromUserAgentId(userAgentId);

    let expectedValues = expectedWindowSizes[operatingSystemName];

    if (operatingSystemName === 'windows') {
      const windowsVersion = Number(operatingSystemVersion.split('-', 1)) >= 10 ? '10' : '7';
      expectedValues = expectedWindowSizes[operatingSystemName][windowsVersion];
    }
    if (!expectedValues) {
      console.log('WARN: No expected window sizes found', userAgentId);
    }

    const check = new ExpectedValuesCheck(
      { userAgentId },
      { path: 'window-sizes' },
      expectedValues,
      this.profile.data.windowSize,
    );
    this.winChecks.push(check);
  }
}

const expectedTtlValues = {
  'mac-os-x': 64,
  linux: 64,
  windows: 128,
};

const expectedWindowSizes = {
  'mac-os': [65535],
  linux: [5840, 29200, 5720],
  windows: {
    7: [8192],
    10: [64240, 65535],
  },
};
