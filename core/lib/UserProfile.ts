import IUserProfile from '@ulixee/hero-interfaces/IUserProfile';
import IDomStorage, { IDomStorageForOrigin } from '@ulixee/hero-interfaces/IDomStorage';
import Log from '@ulixee/commons/lib/Logger';
import { IPuppetPage } from '@ulixee/hero-interfaces/IPuppetPage';
import { assert } from '@ulixee/commons/lib/utils';
import Session from './Session';
import InjectedScripts from './InjectedScripts';

const { log } = Log(module);

export default class UserProfile {
  public static async export(session: Session): Promise<IUserProfile> {
    const cookies = await session.browserContext.getCookies();

    const exportedStorage: IDomStorage = { ...(session.options.userProfile?.storage ?? {}) };
    for (const tab of session.tabsById.values()) {
      const page = tab.puppetPage;

      for (const {
        origin,
        storageForOrigin,
        databaseNames,
        frame,
      } of await page.domStorageTracker.getStorageByOrigin()) {
        const originStorage = {
          ...storageForOrigin,
          indexedDB: storageForOrigin.indexedDB.map(x => ({
            ...x,
            data: { ...x.data },
            objectStores: [...x.objectStores],
          })),
        };
        exportedStorage[origin] = originStorage;

        if (frame) {
          const databases = JSON.stringify(databaseNames);
          const liveData = await frame.evaluate<IDomStorageForOrigin>(
            `window.exportDomStorage(${databases})`,
            true,
          );
          originStorage.localStorage = liveData.localStorage;
          originStorage.sessionStorage = liveData.sessionStorage;
          for (const dbWithData of liveData.indexedDB) {
            if (!dbWithData) continue;
            const idx = originStorage.indexedDB.findIndex(x => x.name === dbWithData.name);
            originStorage.indexedDB[idx] = dbWithData;
          }
        }
      }
    }

    return {
      cookies,
      storage: exportedStorage,
      userAgentString: session.plugins.browserEmulator.userAgentString,
      deviceProfile: session.plugins.browserEmulator.deviceProfile,
    } as IUserProfile;
  }

  public static async install(session: Session): Promise<UserProfile> {
    const { userProfile } = session;
    assert(userProfile, 'UserProfile exists');
    const sessionId = session.id;

    const { storage, cookies } = userProfile;
    const origins = Object.keys(storage ?? {});

    const hasStorage = storage && origins.length;
    if (!cookies && !hasStorage) {
      return this;
    }

    const parentLogId = log.info('UserProfile.install', {
      sessionId,
      cookies: cookies?.length,
      storageDomains: origins?.length,
    });

    let page: IPuppetPage;
    try {
      session.mitmRequestSession.bypassAllWithEmptyResponse = true;
      page = await session.browserContext.newPage();
      if (cookies && cookies.length) {
        await session.browserContext.addCookies(cookies, origins);
      }

      if (hasStorage) {
        session.browserContext.domStorage = {};

        // install scripts so we can restore storage
        await InjectedScripts.installDomStorageRestore(page);

        for (const origin of origins) {
          const originStorage = storage[origin];
          if (
            !originStorage ||
            (!originStorage.indexedDB.length &&
              !originStorage.localStorage.length &&
              !originStorage.sessionStorage.length)
          ) {
            continue;
          }

          try {
            await page.navigate(origin);
            await page.mainFrame.evaluate(
              `window.restoreUserStorage(${JSON.stringify(originStorage)})`,
              true,
            );

            session.browserContext.domStorage[origin] = {
              indexedDB: originStorage.indexedDB.map(x => ({
                ...x,
                data: { ...x.data },
                objectStores: [...x.objectStores],
              })),
              sessionStorage: originStorage.sessionStorage.map(x => ({ ...x })),
              localStorage: originStorage.localStorage.map(x => ({ ...x })),
            };
          } catch (error) {
            throw new Error(
              `Could not restore profile for origin ("${origin}") => ${error.message}`,
            );
          }
        }
      }
    } finally {
      session.mitmRequestSession.bypassAllWithEmptyResponse = false;
      if (page) await page.close();
      log.info('UserProfile.installed', { sessionId, parentLogId });
    }

    return this;
  }

  public static async installSessionStorage(session: Session, page: IPuppetPage): Promise<void> {
    const { userProfile } = session;

    try {
      session.mitmRequestSession.bypassAllWithEmptyResponse = true;
      // reinstall session storage for the
      for (const [origin, storage] of Object.entries(userProfile?.storage ?? {})) {
        if (!storage.sessionStorage.length) continue;
        const load = page.mainFrame.waitOn('frame-lifecycle', event => event.name === 'load');
        await page.navigate(origin);
        await load;
        await page.mainFrame.evaluate(
          `${JSON.stringify(
            storage.sessionStorage,
          )}.forEach(([key,value]) => sessionStorage.setItem(key,value))`,
          false,
        );
      }
      await page.navigate('about:blank');
    } finally {
      session.mitmRequestSession.bypassAllWithEmptyResponse = false;
    }
  }
}
