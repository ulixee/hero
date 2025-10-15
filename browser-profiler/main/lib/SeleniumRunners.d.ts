import SeleniumRunner from '@ulixee/double-agent-stacks/lib/SeleniumRunner';
import IBrowserstackAgent from '../interfaces/IBrowserstackAgent';
export default class SeleniumRunners {
    protected runners: Set<SeleniumRunner>;
    constructor();
    singleAssignment(agent: IBrowserstackAgent, userAgentId: string, options?: {
        userId?: string;
        rerunPluginIds?: string[];
        downloadDir?: string;
    }): Promise<boolean>;
}
