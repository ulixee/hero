import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';
import SeleniumRunner from '@ulixee/double-agent-stacks/lib/SeleniumRunner';
import AssignmentsClient from '@double-agent/runner/lib/AssignmentsClient';
import BrowserStack from './BrowserStack';
import BrowserProfiler from '../index';
import IBrowserstackAgent from '../interfaces/IBrowserstackAgent';

export default class SeleniumRunners {
  protected runners = new Set<SeleniumRunner>();

  constructor() {
    ShutdownHandler.register(() => Promise.allSettled([...this.runners].map(x => x.stop())));
  }

  public async singleAssignment(
    agent: IBrowserstackAgent,
    userAgentId: string,
    options: {
      userId?: string;
      rerunPluginIds?: string[];
      downloadDir?: string;
    } = {},
  ): Promise<boolean> {
    options.downloadDir ??= BrowserProfiler.userAgentDir(userAgentId);
    const { userId, rerunPluginIds, downloadDir } = options;
    const client = new AssignmentsClient(userId ?? userAgentId);
    let runner: SeleniumRunner;
    try {
      const assignment = await client.createSingleUserAgentIdAssignment(userAgentId);
      console.log('Running agent [%s]', userAgentId, agent);
      const driver = await BrowserStack.buildWebDriver(agent);
      if (!driver) return false;

      const runnerOptions = SeleniumRunner.getRunnerOptions(agent.browser, agent.browser_version);

      runner = new SeleniumRunner(driver, runnerOptions);
      this.runners.add(runner);

      await runner.run(assignment, { onlyRunPluginIds: rerunPluginIds });

      console.log(`DOWNLOADING ${userAgentId} to ${downloadDir}`);
      await client.downloadAssignmentProfiles(assignment.id, downloadDir);
      return true;
    } catch (error) {
      console.log('ERROR Running Agent %s', userAgentId, error);
      return false;
    } finally {
      this.runners.delete(runner);
      await runner?.stop();
    }
  }
}
