import IUserProfile from '@ulixee/hero-interfaces/IUserProfile';
import IDomStorage, {
  IDomStorageForOrigin,
} from '@ulixee/unblocked-specification/agent/browser/IDomStorage';
import Log from '@ulixee/commons/lib/Logger';
import { assert } from '@ulixee/commons/lib/utils';
import Page from '@ulixee/unblocked-agent/lib/Page';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import Session from './Session';
import InjectedScripts from './InjectedScripts';

const { log } = Log(module);

export default class UserProfile {
  public static async export(session: Session): Promise<IUserProfile> {
    const cookies = await session.browserContext.getCookies();

    const exportedStorage: IDomStorage = { ...(session.options.userProfile?.storage ?? {}) };
    for (const tab of session.tabsById.values()) {
      const page = tab.page;

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
          try {
            const liveData = await frame.evaluate<IDomStorageForOrigin>(
              `window.exportDomStorage(${databases})`,
              true,
            );
            originStorage.localStorage = liveData.localStorage;
            originStorage.sessionStorage = liveData.sessionStorage;
            originStorage.indexedDB = liveData.indexedDB.filter(Boolean);
          } catch (error) {
            if (frame.isAttached && !(error instanceof CanceledPromiseError)) {
              throw error;
            }
          }
        }
      }
    }

    return {
      cookies,
      storage: exportedStorage,
      userAgentString: session.emulationProfile.userAgentOption.string,
      deviceProfile: session.emulationProfile.deviceProfile,
    } as IUserProfile;
  }

  public static async installCookies(session: Session): Promise<UserProfile> {
    const { userProfile } = session;
    assert(userProfile, 'UserProfile exists');

    const { storage, cookies } = userProfile;
    const origins = Object.keys(storage ?? {});

    const hasStorage = storage && origins.length;
    if (!cookies && !hasStorage) {
      return this;
    }

    if (cookies && cookies.length) {
      await session.browserContext.addCookies(cookies, origins);
    }
    return this;
  }

  public static async installStorage(session: Session, page: Page): Promise<void> {
    const { userProfile } = session;
    const domStorage: IDomStorage = {};
    const origins: string[] = [];
    for (const [origin, storage] of Object.entries(userProfile.storage)) {
      if (
        storage.indexedDB.length === 0 &&
        storage.sessionStorage.length === 0 &&
        storage.localStorage.length === 0
      ) {
        continue;
      }
      const og = origin.toLowerCase();
      origins.push(og);
      domStorage[og] = storage;
    }
    if (!origins.length) return;
    const sessionId = session.id;

    const parentLogId = log.info('UserProfile.installStorage', {
      sessionId,
      storageDomains: origins?.length,
    });
    const browserContext = session.browserContext;
    const isSecure = origins.some(x => x.startsWith('https://'));
    const storageRestoreDomain = `http${isSecure ? 's' : ''}://restore-hero-dom.org`;
    session.mitmRequestSession.interceptorHandlers.push({
      urls: [/:\/\/restore-hero-dom\.org.*/],
    });
    try {
      browserContext.resources.isCollecting = false;
      page.storeEventsWithoutListeners = false;
      page.runPageScripts = true;

      // eslint-disable-next-line require-await,@typescript-eslint/require-await
      await page.networkManager.setNetworkInterceptor(async ({ request, requestId }) => {
        const url = new URL(request.url);

        if (url.href.includes(storageRestoreDomain)) {
          return {
            responseCode: 200,
            requestId,
            responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
            body: Buffer.from(
              `<html>
<body>
<h1>Restoring Dom Storage</h1>
${origins.map(x => `<iframe src="${x}"></iframe>`).join('\n')}
</body>
</html>`,
            ).toString('base64'),
          };
        }
        let script = '';
        const originStorage = domStorage[url.origin];
        const sessionStorage = originStorage?.sessionStorage;
        if (sessionStorage) {
          script += `
for (const [key,value] of ${JSON.stringify(sessionStorage)}) {
  sessionStorage.setItem(key,value);
}\n`;
        }
        const localStorage = originStorage?.localStorage;
        if (localStorage) {
          script += `\n
for (const [key,value] of ${JSON.stringify(localStorage)}) {
  localStorage.setItem(key,value);
}\n`;
        }

        let readyClass = 'ready';
        if (originStorage?.indexedDB?.length) {
          readyClass = '';
          script += `\n\n 
             ${InjectedScripts.getIndexedDbStorageRestoreScript()}
             
             const dbs = ${JSON.stringify(originStorage.indexedDB)};
             restoreUserStorage(dbs).then(() => {
               document.body.setAttribute('class', 'ready');
             });`;
        }

        return {
          responseCode: 200,
          requestId,
          body: Buffer.from(
            `<html><body class="${readyClass}">
<h5>${url.origin}</h5>
<script>
${script}
</script>
</body></html>`,
          ).toString('base64'),
        };
      }, true);

      // clear out frame state
      await page.navigate(storageRestoreDomain);
      while (page.frames.length <= origins.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      await Promise.all(
        page.frames.map(async frame => {
          if (frame === page.mainFrame) {
            // no loader is set, so need to have special handling
            if (!frame.activeLoader.lifecycle.load) {
              await frame.waitOn('frame-lifecycle', x => x.name === 'load');
            }
            return;
          }
          await frame.waitForLifecycleEvent('DOMContentLoaded');

          await frame.evaluate(
            `(async function() {
            while (!document.querySelector("body.ready")) {
              await new Promise(resolve => setTimeout(resolve, 20));
            }
          })()`,
            false,
            {
              shouldAwaitExpression: true,
              returnByValue: true,
            },
          );
        }),
      );

      session.mitmRequestSession.interceptorHandlers.pop();
      page.mainFrame.navigations.reset();

      // clear out frame state
      await page.networkManager.setNetworkInterceptor(null, false);
      await page.networkManager.initialize();
      await page.navigate('about:blank');
      await page.mainFrame.waitForLifecycleEvent('load');
      page.storeEventsWithoutListeners = true;

      page.domStorageTracker.isEnabled = true;
      await page.domStorageTracker.initialize();
      // run initialization after page is initialized
      page.runPageScripts = true;
      await browserContext.initializePage(page);
    } finally {
      browserContext.resources.isCollecting = true;
      log.stats('UserProfile.installedStorage', { sessionId, parentLogId });
    }

    session.browserContext.domStorage = {};

    for (const [origin, originStorage] of Object.entries(domStorage)) {
      session.browserContext.domStorage[origin] = {
        indexedDB: originStorage.indexedDB.map(x => ({
          ...x,
          data: { ...x.data },
          objectStores: [...x.objectStores],
        })),
        sessionStorage: originStorage.sessionStorage.map(x => ({ ...x })),
        localStorage: originStorage.localStorage.map(x => ({ ...x })),
      };
    }
  }
}
