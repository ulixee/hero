import { IRunner, IRunnerFilter } from '@double-agent/runner/interfaces/IRunnerFactory';
import IAssignment from '@double-agent/collect-controller/interfaces/IAssignment';
import ISessionPage from '@double-agent/collect/interfaces/ISessionPage';

export default abstract class BaseRunner implements IRunner {
  public currentPage?: ISessionPage;
  public isFirst = true;

  public async run(assignment: IAssignment, filters?: IRunnerFilter): Promise<void> {
    try {
      console.log('--------------------------------------');
      console.log('STARTING ', assignment.id, assignment.userAgentString);

      let counter = 1;
      // eslint-disable-next-line prefer-const
      for (let [pluginId, pages] of Object.entries(assignment.pagesByPlugin)) {
        if (filters?.onlyRunPluginIds && !filters?.onlyRunPluginIds.includes(pluginId)) {
          console.log('SKIPPING: ', pluginId);
          continue;
        }

        for (const page of pages) {
          this.currentPage = page;
          const step = `[${assignment.num ?? assignment.sessionId}.${counter}]`;
          await this.runPage(assignment, page, step);
          this.isFirst = false;
          counter += 1;
        }
      }
      console.log(`[%s.✔] FINISHED ${assignment.id}`, assignment.num);
    } catch (err) {
      console.log('[%s.x] Error on %s', assignment.num, this.currentPage?.url, err);
      throw err;
    }
    console.log('--------------------------------------');
  }

  abstract stop(): Promise<void>;
  abstract runPage(assignment: IAssignment, page: ISessionPage, step: string): Promise<void>;
}
