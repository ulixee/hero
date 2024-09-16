import { promises as Fs } from 'fs';
import * as Path from 'path';
import Config from '@double-agent/config';
import RealUserAgents from '@ulixee/real-user-agents';
import IUserAgentConfig from '../interfaces/IUserAgentConfig';

export default async function importBrowserProfiles(
  profilesDir: string,
  userAgentConfig: IUserAgentConfig,
): Promise<void> {
  const sourceProfilesDir = Path.join(Config.profilesDataDir, 'profiles');

  for (const userAgentId of await Fs.readdir(sourceProfilesDir)) {
    if (!userAgentConfig.browserIds.some((x) => userAgentId.includes(x))) {
      continue;
    }

    const userAgent = RealUserAgents.getId(userAgentId);
    if (!userAgent) {
      throw new Error(`${userAgentId} not supported by RealUserAgents`);
    }

    const fromDir = `${sourceProfilesDir}/${userAgentId}`;
    const toDir = `${profilesDir}/${userAgentId}`;
    await copyDir(fromDir, toDir);
  }
}

async function copyDir(fromDir: string, toDir: string): Promise<void> {
  await Fs.mkdir(toDir, { recursive: true });
  for (const fileNameToCopy of await Fs.readdir(fromDir)) {
    await Fs.copyFile(`${fromDir}/${fileNameToCopy}`, `${toDir}/${fileNameToCopy}`);
  }
}
