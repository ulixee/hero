import { IRunner, IRunnerFactory } from '@double-agent/runner/interfaces/IRunnerFactory';
import IAssignment from '@double-agent/collect-controller/interfaces/IAssignment';
import { Pool } from '@ulixee/unblocked-agent';
import DefaultHumanEmulator from '@ulixee/default-human-emulator';
import DefaultBrowserEmulator, { IEmulatorOptions } from '@ulixee/default-browser-emulator';
import UnblockedRunner from './UnblockedRunner';

export default class UnblockedRunnerFactory implements IRunnerFactory {
  private pool = new Pool({
    plugins: [DefaultBrowserEmulator as any, DefaultHumanEmulator as any],
  });

  public runnerId(): string {
    return 'unblocked-agent';
  }

  public async startFactory(): Promise<void> {
    await this.pool.start();
  }

  public async spawnRunner(assignment: IAssignment): Promise<IRunner> {
    const { operatingSystemName, operatingSystemVersion, browserName, browserVersion } =
      assignment.browserMeta;
    const agent = this.pool.createAgent({
      customEmulatorConfig: {
        userAgentSelector: `~ ${operatingSystemName} = ${operatingSystemVersion} & ${browserName} = ${browserVersion}`,
      } as IEmulatorOptions,
    });
    const page = await agent.newPage();
    return new UnblockedRunner(agent, page);
  }

  public async stopFactory(): Promise<void> {
    await this.pool.close();
  }
}
