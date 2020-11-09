import Browsers from '../data/browsers.json';

export default class StatcounterBrowserUsage {
  public static getConsumerUsageForBrowser(browserName: string) {
    const statCounterUsage = Browsers.browsers.find(y => y.browser === browserName);

    return statCounterUsage?.usage ?? 0;
  }
}
