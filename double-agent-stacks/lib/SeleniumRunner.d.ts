import { WebDriver } from 'selenium-webdriver';
import IAssignment from '@double-agent/collect-controller/interfaces/IAssignment';
import ISessionPage from '@double-agent/collect/interfaces/ISessionPage';
import BaseRunner from './BaseRunner';
interface ISeleniumRunnerOptions {
    needsEnterKey: boolean;
    needsErrorPageChecks: boolean;
}
export default class SeleniumRunner extends BaseRunner {
    driver: WebDriver;
    hasNavigated: boolean;
    needsEnterKey: boolean;
    needsErrorPageChecks: boolean;
    lastPage: ISessionPage;
    constructor(driver: WebDriver, options: ISeleniumRunnerOptions);
    runPage(assignment: IAssignment, page: ISessionPage, step: string): Promise<void>;
    stop(): Promise<void>;
    private checkErrorPage;
    private isSafariErrorPage;
    private waitForElement;
    private clickElement;
    static getRunnerOptions(browserName: string, browserVersion: string): ISeleniumRunnerOptions;
    static createDriver(url: string, capabilities: any): Promise<WebDriver>;
}
export {};
