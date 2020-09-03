import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';
import IDomStorage from '@secret-agent/core-interfaces/IDomStorage';
import Log from '@secret-agent/commons/Logger';
import { Page } from '@secret-agent/puppet-chrome/lib/Page';
import Tab from './Tab';

const { log } = Log(module);

export default class UserProfile {
  public static async export(sessionId: string, page: Page) {
    const origins = await page.frames.getSecurityOrigins();
    const storage: IDomStorage = {};

    for (const { origin, frameId } of origins) {
      const databaseNames = await page.getIndexedDbsForOrigin(origin);
      const executionId = page.frames.getActiveContext(frameId, true);
      storage[origin] = await page.frames.runInContext(
        `window.exportDomStorage(${JSON.stringify(databaseNames)})`,
        executionId.executionContextId,
      );
    }
    const cookies = await page.getAllCookies();

    return {
      cookies,
      storage,
    } as IUserProfile;
  }

  public static async install(fromProfile: IUserProfile, tab: Tab) {
    const { puppetPage } = tab;

    const parentLogId = log.info('UserProfile.install', { sessionId: tab.sessionId });

    if (fromProfile?.cookies) {
      await puppetPage.setCookies(fromProfile.cookies, Object.keys(fromProfile?.storage ?? {}));
    }

    if (fromProfile?.storage && Object.keys(fromProfile.storage).length) {
      // prime each page
      for (const origin of Object.keys(fromProfile.storage)) {
        await tab.setBrowserOrigin(origin);
        await puppetPage.frames.runInFrame(
          `window.restoreUserStorage(${JSON.stringify(fromProfile.storage[origin])})`,
          puppetPage.mainFrameId,
        );
      }
      // reset browser to start page
      await tab.setBrowserOrigin('about:blank');
    }
    log.info('UserProfile.installed', { sessionId: tab.sessionId, parentLogId });
    return this;
  }
}
