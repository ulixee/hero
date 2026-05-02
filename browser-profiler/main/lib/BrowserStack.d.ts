import * as webdriver from 'selenium-webdriver';
import IBrowser from '@ulixee/real-user-agents/interfaces/IBrowser';
import IOperatingSystem from '@ulixee/real-user-agents/interfaces/IOperatingSystem';
import IBrowserstackAgent from '../interfaces/IBrowserstackAgent';
export default class BrowserStack {
    static supportedCapabilities: any[];
    static buildWebDriver(browser: IBrowserstackAgent, customCapabilities?: any): Promise<webdriver.WebDriver>;
    static createAgent(os: IOperatingSystem, browser: IBrowser): Promise<IBrowserstackAgent>;
    static getCapabilities(): Promise<IBrowserstackAgent[]>;
    private static isBrowserSupported;
}
