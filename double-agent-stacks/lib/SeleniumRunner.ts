import {
  Builder,
  By,
  Key,
  until,
  WebDriver,
  WebElement,
  WebElementPromise,
} from 'selenium-webdriver';
import IAssignment from '@double-agent/collect-controller/interfaces/IAssignment';
import ISessionPage from '@double-agent/collect/interfaces/ISessionPage';
import BaseRunner from './BaseRunner';

interface ISeleniumRunnerOptions {
  needsEnterKey: boolean;
  needsErrorPageChecks: boolean;
}

export default class SeleniumRunner extends BaseRunner {
  hasNavigated = false;
  needsEnterKey = false;
  needsErrorPageChecks = false;
  lastPage: ISessionPage;

  constructor(public driver: WebDriver, options: ISeleniumRunnerOptions) {
    super();
    this.needsEnterKey = options.needsEnterKey ?? false;
    this.needsErrorPageChecks = options.needsErrorPageChecks ?? false;
  }

  override async runPage(assignment: IAssignment, page: ISessionPage, step: string): Promise<void> {
    const driver = this.driver;
    let currentUrl = await this.driver.getCurrentUrl();
    if (page.isRedirect) return;

    // selenium has to wait for page urls
    if (!!this.lastPage?.clickElementSelector && currentUrl !== page.url) {
      // edge 18 takes forever to test codecs.. so need to wait a long time for page to load
      console.log(`URL ${currentUrl} SHOULD BE ${page.url}`);
      await driver.wait(until.urlIs(page.url), 60e3);
      currentUrl = await driver.getCurrentUrl();
    }
    this.lastPage = page;

    if (page.url !== currentUrl) {
      console.log('%s GOTO -- %s', step, page.url);
      await driver.get(page.url);
    }
    this.hasNavigated = true;

    if (await this.checkErrorPage(page, currentUrl)) {
      console.log('%s ERROR on url -- %s', step, page.url);
      return;
    }

    if (page.waitForElementSelector) {
      console.log(
        '%s waitForElementSelector -- %s on %s',
        step,
        page.waitForElementSelector,
        page.url,
      );
      await this.waitForElement(page.waitForElementSelector);
    } else {
      console.log('%s waitForBody -- %s on %s', step, page.url);
      await this.waitForElement('body');
    }

    if (page.clickElementSelector) {
      console.log('%s clickElementSelector -- %s on %s', step, page.clickElementSelector, page.url);
      const elem = await this.waitForElement(page.clickElementSelector);
      await driver.wait(until.elementIsVisible(elem));

      await this.clickElement(elem);
    }
  }

  async stop(): Promise<void> {
    await this.driver?.quit();
  }

  private async checkErrorPage(page: ISessionPage, currentUrl: string): Promise<boolean> {
    if (this.needsErrorPageChecks && (await this.isSafariErrorPage(page.url))) {
      console.log('Safari error page encountered %s (was %s)', page.url, currentUrl);
      this.lastPage = null;
      return true;
    }
    return false;
  }

  private async isSafariErrorPage(url: string): Promise<boolean> {
    try {
      const errorText = await this.driver.findElement(By.css('.error-title')).getText();
      if (errorText === 'Safari Can’t Open the Page') {
        console.log(
          "Safari couldn't load page! NOTE: This flow is now broken, need to go back to get Safari functional!!",
          url,
        );
        await this.driver.navigate().back();
        return true;
      }
    } catch (err) {}
    return false;
  }

  private waitForElement(cssSelector: string): WebElementPromise {
    return this.driver.wait(until.elementLocated(By.css(cssSelector)));
  }

  private async clickElement(elem: WebElement): Promise<void> {
    if (this.needsEnterKey) {
      // safari 13.0 has a known bug where clicks don't work that's making this necessary
      await this.driver.actions().move({ origin: elem }).click(elem).perform();
      try {
        await elem.click();
      } catch (error) {
        console.log('Error: could not click');
      }
      try {
        await elem.sendKeys(Key.RETURN);
      } catch (error) {
        console.log('Error: could not sendKeys');
      }
    } else {
      await elem.click();
    }
  }

  public static getRunnerOptions(
    browserName: string,
    browserVersion: string,
  ): ISeleniumRunnerOptions {
    const [browserMajor, browserMinor] = browserVersion.split(/[.-]/).map(Number);
    const options = { needsEnterKey: false, needsErrorPageChecks: false };
    if (browserName.toLowerCase() === 'safari') {
      options.needsEnterKey = browserMajor === 13 && browserMinor === 0;
      options.needsErrorPageChecks = browserMajor === 12 && browserMinor === 1;
    }
    return options;
  }

  public static async createDriver(url: string, capabilities: any): Promise<WebDriver> {
    return await new Builder().usingServer(url).withCapabilities(capabilities).build();
  }
}
