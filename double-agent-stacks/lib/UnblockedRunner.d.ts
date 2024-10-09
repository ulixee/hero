import IAssignment from '@double-agent/collect-controller/interfaces/IAssignment';
import ISessionPage from '@double-agent/collect/interfaces/ISessionPage';
import { Agent, Page } from '@ulixee/unblocked-agent';
import BaseRunner from './BaseRunner';
export default class UnblockedRunner extends BaseRunner {
    agent: Agent;
    page: Page;
    hasNavigated: boolean;
    constructor(agent: Agent, page: Page);
    runPage(assignment: IAssignment, sessionPage: ISessionPage, step: string): Promise<void>;
    stop(): Promise<void>;
}
