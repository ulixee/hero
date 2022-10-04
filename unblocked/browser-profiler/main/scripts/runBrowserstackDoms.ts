import '../env';
import { existsSync, promises as Fs, rmdirSync } from 'fs';
import * as Path from 'path';
import getAllPlugins from '@double-agent/collect/lib/getAllPlugins';
import Queue from 'p-queue';
import { existsAsync } from '@ulixee/commons/lib/fileUtils';
import RealUserAgents from '@unblocked-web/real-user-agents';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';
import BrowserProfiler from '../index';
import IBrowserstackAgent from '../interfaces/IBrowserstackAgent';
import SeleniumRunners from '../lib/SeleniumRunners';
import BrowserStack from '../lib/BrowserStack';

const baseDomsDir = Path.resolve(BrowserProfiler.profiledDoms, 'browserstack');
const tmpDir = Path.resolve(BrowserProfiler.profiledDoms, '.tmp');
// clean up tmp dir
if (existsSync(tmpDir)) rmdirSync(tmpDir, { recursive: true });

const runners = new SeleniumRunners();

const features = 'headed-selenium';
const browserDomPlugin = getAllPlugins().find(x => x.id === 'browser-dom-environment');

export default async function runBrowserstack(): Promise<void> {
  let totalCount = 0;

  const queue = new Queue({ concurrency: 5 });
  ShutdownHandler.register(() => {
    queue.clear();
  });

  for (const userAgentId of BrowserProfiler.userAgentIds) {
    const { browserId, operatingSystemId } =
      BrowserProfiler.extractMetaFromUserAgentId(userAgentId);
    const operatingSystem = RealUserAgents.getOperatingSystem(operatingSystemId);
    const browser = RealUserAgents.getBrowser(browserId);
    if (!browser) {
      console.log('RealUserAgents is missing browser: ', operatingSystemId, browserId);
      continue;
    }

    // 1. Does this need to run? Clean up as needed.
    const domDir = Path.join(baseDomsDir, `${userAgentId}--${features}`);
    if (await existsAsync(domDir)) {
      const filesCount = (await Fs.readdir(domDir)).length;
      if (filesCount >= browserDomPlugin.outputFiles * 2) {
        console.log(`FOUND ${userAgentId}--${features}... skipping`);
        continue;
      } else {
        console.log(`FOUND CORRUPTED ${userAgentId}--${features}... REDOING`, {
          filesCount,
          expected: browserDomPlugin.outputFiles * 2,
        });
        // clean dir
        // await Fs.rmdir(domDir, { recursive: true });
      }
    }

    await Fs.mkdir(domDir, { recursive: true });

    const browserStackAgent = await BrowserStack.createAgent(operatingSystem, browser);
    if (!browserStackAgent) continue;

    void queue.add(createSecondDomProfile.bind(this, browserStackAgent, userAgentId, domDir));
    totalCount += 1;
  }

  console.log(`${totalCount} queued, wait for complete`, queue.size, queue.pending);
  await queue.onIdle();

  console.log(''.padEnd(100, '-'));
  console.log(`${totalCount} browser profiles`);
  console.log(''.padEnd(100, '-'));
}

async function createSecondDomProfile(
  agent: IBrowserstackAgent,
  userAgentId: string,
  domDir: string,
): Promise<void> {
  const tmpFilesDir = Path.join(tmpDir, userAgentId);
  const didSucceed = await runners.singleAssignment(agent, userAgentId, {
    rerunPluginIds: [browserDomPlugin.id],
    downloadDir: tmpFilesDir,
    userId: `${userAgentId}-doms`,
  });
  if (!didSucceed) return;

  // 1. Symlink-in starting profiles
  const profilesDir = BrowserProfiler.userAgentDir(userAgentId);
  for (const profileFileName of await Fs.readdir(profilesDir)) {
    if (profileFileName.startsWith(browserDomPlugin.id)) {
      const sourcePath = Path.join(profilesDir, profileFileName);
      const destPath = Path.join(domDir, profileFileName.replace('.json.gz', '--1.json.gz'));
      const relativeSourcePath = Path.relative(domDir, sourcePath);
      if (await existsAsync(destPath)) {
        await Fs.unlink(destPath);
      }

      await Fs.symlink(relativeSourcePath, destPath);
    }
  }

  // 2. Copy the newly generated profile files into the browserstack doms dir
  for (const tmpFileName of await Fs.readdir(tmpFilesDir)) {
    const destFileName = tmpFileName.replace('.json.gz', `--2.json.gz`);

    if (await existsAsync(`${domDir}/${destFileName}`)) {
      await Fs.unlink(`${domDir}/${destFileName}`);
    }
    await Fs.rename(`${tmpFilesDir}/${tmpFileName}`, `${domDir}/${destFileName}`);
  }
  await Fs.rmdir(tmpFilesDir, { recursive: true }).catch(() => null);
}
