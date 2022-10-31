import * as Fs from 'fs';
import * as Path from 'path';
import RealUserAgents from '@unblocked-web/real-user-agents';
import IUserAgentToTest, {
  UserAgentToTestPickType,
} from '@double-agent/config/interfaces/IUserAgentToTest';
import Config from '@double-agent/config/index';
import UserAgent from '@unblocked-web/real-user-agents/lib/UserAgent';
import IUserAgentConfig from '../interfaces/IUserAgentConfig';

const FsPromises = Fs.promises;

async function writeUserAgentsToTest(
  userAgentConfig: IUserAgentConfig,
  outFilePath: string,
): Promise<void> {
  const userAgentsToTest = await collectUserAgentsToTest(userAgentConfig);

  const outDir = Path.dirname(outFilePath);
  await FsPromises.mkdir(outDir, { recursive: true });

  await FsPromises.writeFile(`${outFilePath}.json`, JSON.stringify(userAgentsToTest, null, 2));
}

async function collectUserAgentsToTest(
  userAgentConfig: IUserAgentConfig,
): Promise<IUserAgentToTest[]> {
  const userAgentsToTest: IUserAgentToTest[] = [];

  // use TcpProbes to determine user agents
  const probeTcpFilePath = Path.join(Config.probesDataDir, '/probe-buckets/tcp.json');
  if (!(await exists(probeTcpFilePath))) {
    return userAgentsToTest;
  }

  const tcpProbeBuckets = JSON.parse(await FsPromises.readFile(probeTcpFilePath, 'utf8'));
  const userAgentIds: Set<string> = new Set();
  tcpProbeBuckets.forEach(probeBucket => {
    probeBucket.userAgentIds.forEach(userAgentId => userAgentIds.add(userAgentId));
  });

  for (const userAgentId of userAgentIds) {
    if (!userAgentConfig.browserIds.some(x => userAgentId.includes(x))) {
      continue;
    }

    const userAgent = RealUserAgents.getId(userAgentId);
    if (!userAgent) {
      throw new Error(`${userAgentId} not supported by RealUserAgents`);
    }

    let string = userAgent.pattern;
    if (userAgent.stablePatchVersions) {
      const patch = userAgent.stablePatchVersions[0];
      const os = userAgent.uaClientHintsPlatformVersions[0];
      string = UserAgent.parse(userAgent, patch, os);
    }

    const userAgentToTest = {
      browserId: userAgent.browserId,
      operatingSystemId: userAgent.operatingSystemId,
      pickTypes: [],
      usagePercent: {
        [UserAgentToTestPickType.popular]: 0,
        [UserAgentToTestPickType.random]: 0,
      },
      string,
    };

    userAgentsToTest.push(userAgentToTest);
  }

  return userAgentsToTest;
}

async function exists(path: string): Promise<boolean> {
  try {
    await FsPromises.access(path);
    return true;
  } catch {
    return false;
  }
}

export { writeUserAgentsToTest, collectUserAgentsToTest };
