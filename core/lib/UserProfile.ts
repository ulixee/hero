import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';
import IDomStorage from '@secret-agent/core-interfaces/IDomStorage';
import Log from '@secret-agent/commons/Logger';
import { ICookie } from '@secret-agent/core-interfaces/ICookie';
import { IPuppetPage } from '@secret-agent/puppet/interfaces/IPuppetPage';
import { assert } from '@secret-agent/commons/utils';
import Session from './Session';
import DomEnv from './DomEnv';
import Tab from './Tab';

const { log } = Log(module);

export default class UserProfile {
  public static async export(session: Session) {
    const storage: IDomStorage = {};
    const cookies: ICookie[] = [];
    for (const tab of session.tabs) {
      const page = tab.puppetPage;

      const dbs = await page.getIndexedDbDatabaseNames();
      for (const { origin, frameId, databases } of dbs) {
        storage[origin] = await page.runInFrame(
          frameId,
          `window.exportDomStorage(${JSON.stringify(databases)})`,
          true,
        );
      }
      cookies.push(...(await page.getAllCookies()));
    }

    return {
      cookies,
      storage,
    } as IUserProfile;
  }

  public static async install(session: Session) {
    const { userProfile } = session;
    assert(userProfile, 'UserProfile exists');
    const sessionId = session.id;

    const { storage, cookies } = userProfile;
    const origins = Object.keys(storage ?? {});

    const hasStorage = storage && origins.length;
    if (!cookies && !hasStorage) {
      return this;
    }

    const parentLogId = log.info('UserProfile.install', { sessionId });

    const mitmSession = session.mitmRequestSession;
    const originalBlocker = mitmSession.blockedResources;

    let page: IPuppetPage;
    try {
      page = await session.browserContext.newPage();
      if (cookies) {
        await page.setCookies(cookies, origins);
      }

      if (hasStorage) {
        // install scripts so we can restore storage
        const domEnv = new DomEnv(sessionId, page);
        await domEnv.install();
        // prime each page
        mitmSession.blockedResources = {
          types: [],
          urls: origins,
          handlerFn(request, response) {
            response.end(`<html lang="en"><body>Empty</body></html>`);
            return true;
          },
        };

        for (const origin of origins) {
          const originStorage = storage[origin];
          await page.navigate(origin);
          await page.mainFrame.run(
            `window.restoreUserStorage(${JSON.stringify(originStorage)})`,
            true,
          );
        }
      }
    } finally {
      mitmSession.blockedResources = originalBlocker;
      if (page) await page.close();
      log.info('UserProfile.installed', { sessionId, parentLogId });
    }

    return this;
  }

  public static async installSessionStorage(session: Session, tab: Tab) {
    const { userProfile } = session;

    let needsOriginReset = false;
    // reinstall session storage for the
    for (const [origin, storage] of Object.entries(userProfile.storage)) {
      if (storage.sessionStorage.length) {
        needsOriginReset = true;
        await tab.setOrigin(origin);
        await tab.puppetPage.mainFrame.run(
          `${JSON.stringify(
            storage.sessionStorage,
          )}.forEach(([key,value]) => sessionStorage.setItem(key,value))`,
          false,
        );
      }
    }
    if (needsOriginReset) {
      await tab.setOrigin('about:blank');
    }
  }
}
