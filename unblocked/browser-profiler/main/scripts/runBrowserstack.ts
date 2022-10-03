import '../env';
import Queue from 'p-queue';
import { createUserAgentIdFromIds } from '@double-agent/config';
import RealUserAgents from '@unblocked-web/real-user-agents';
import getAllPlugins from '@double-agent/collect/lib/getAllPlugins';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';
import BrowserProfiler from '../index';
import BrowserStack from '../lib/BrowserStack';
import SeleniumRunners from '../lib/SeleniumRunners';

// configure plugins to re-run

export default async function runBrowserstack(): Promise<void> {
  BrowserProfiler.init();
  const runners = new SeleniumRunners();

  let totalCount = 0;
  const queue = new Queue({ concurrency: 5 });
  ShutdownHandler.register(() => {
    queue.clear();
    queue.pause();
  });
  const plugins = getAllPlugins();
  console.log('RUNNING X ACTIVE PLUGINS', plugins.length);

  for (const agent of RealUserAgents.all()) {
    const userAgentId = createUserAgentIdFromIds(agent.operatingSystemId, agent.browserId);
    const operatingSystem = RealUserAgents.getOperatingSystem(agent.operatingSystemId);
    const browser = RealUserAgents.getBrowser(agent.browserId);
    if (!browser) {
      console.log('RealUserAgents is missing browser: ', agent.operatingSystemId, agent.browserId);
      continue;
    }

    // too old for the double agent suite
    if (browser.name === 'Firefox' && Number(browser.version.major) < 63) continue;
    if (browser.name === 'Chrome' && Number(browser.version.major) < 58) continue;
    if (browser.name === 'Safari' && Number(browser.version.major) < 11) continue;
    // no support for Promises, lambdas... detections need refactor for support
    if (browser.name === 'IE') continue;

    const rerunPluginIds = BrowserProfiler.findMissingPlugins(userAgentId, plugins);
    if (!rerunPluginIds.length) continue;
    console.log('RERUNNING PLUGINS', { rerunPluginIds, userAgentId });

    const browserStackAgent = await BrowserStack.createAgent(operatingSystem, browser);
    if (!browserStackAgent) continue;

    void queue.add(
      runners.singleAssignment.bind(runners, browserStackAgent, userAgentId, { rerunPluginIds }),
    );
    totalCount += 1;
  }

  await queue.onIdle();

  console.log(''.padEnd(100, '-'));
  console.log(`${totalCount} browser profiles`);
  console.log(''.padEnd(100, '-'));
}

export function cleanProfiles(): void {
  const removePluginIds = process.argv[1]?.split(',')?.map(x => x.trim()) ?? [];
  console.log('REMOVING plugin-ids', removePluginIds)
  // remove files of plugins we want to rerun, comment this out on subsequent runs
  if (removePluginIds.length) {
    BrowserProfiler.cleanPluginProfiles(removePluginIds);
  }
}
