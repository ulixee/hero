import { Page } from 'puppeteer';
import ISessionPage from '@double-agent/collect/interfaces/ISessionPage';
import IAssignment from '@double-agent/collect-controller/interfaces/IAssignment';
import BaseRunner from './BaseRunner';
export default class PuppeteerRunner extends BaseRunner {
    page: Page;
    hasNavigated: boolean;
    constructor(page: Page);
    runPage(assignment: IAssignment, page: ISessionPage, step: string): Promise<void>;
    stop(): Promise<void>;
}
