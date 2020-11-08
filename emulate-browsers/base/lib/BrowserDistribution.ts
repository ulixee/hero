import Log from '@secret-agent/commons/Logger';
import IBrowserEmulatorClass from '@secret-agent/core-interfaces/IBrowserEmulatorClass';
import Browsers from '../data/browsers.json';

const { log } = Log(module);

export default class BrowserDistribution {
  public static getBrowserConsumerUsage(browserClass: IBrowserEmulatorClass) {
    const statCounterUsage = Browsers.browsers.find(
      y => y.browser === browserClass.statcounterBrowser,
    );

    const usagePct = statCounterUsage?.usage ?? 0;

    if (!usagePct && process.env.NODE_ENV !== 'test') {
      log.warn(
        `${browserClass.id} doesn't have a consumer browser usage percentage > 0%, so will not be used much in "random" round-robin-ing of installed BrowserEmulators`,
        {
          sessionId: null,
          emulatorId: browserClass.id,
        },
      );
    }
    return usagePct;
  }
}
