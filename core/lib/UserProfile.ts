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
          originStorage.indexedDB = liveData.indexedDB;
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

  public static async installStorage(session: Session, page: IPuppetPage): Promise<void> {
    const { userProfile } = session;
    const domStorage: IDomStorage = {};
    const origins: string[] = [];
    for (const [origin, storage] of Object.entries(userProfile.storage)) {
      const og = origin.toLowerCase();
      origins.push(og);
      domStorage[og] = storage;
    }
    if (!origins.length) return;
    const sessionId = session.id;

    const interceptorHandlers = session.mitmRequestSession.interceptorHandlers;

    const parentLogId = log.info('UserProfile.installStorage', {
      sessionId,
      storageDomains: origins?.length,
    });

    try {
      session.mitmRequestSession.interceptorHandlers = [
        {
          urls: origins,
          handlerFn(url, type, req, res) {
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
              readyClass ='';
              script += `\n\n 
             ${InjectedScripts.getIndexedDbStorageRestoreScript()}
             
             const dbs = ${JSON.stringify(originStorage.indexedDB)};
             restoreUserStorage(dbs).then(() => {
               document.body.setAttribute('class', 'ready');
             });`;
            }

            res.end(`<html><body class="${readyClass}">
<h5>${url.origin}</h5>
<script>
${script}
</script>
</body></html>`);

            return true;
          },
        },
      ];
      await page.devtoolsSession.send('Page.setDocumentContent', {
        frameId: page.mainFrame.id,
        html: `<html>
<body>
<h1>Restoring Dom Storage</h1>
${origins.map(x => `<iframe src="${x}"></iframe>`).join('\n')}
</body>
</html>`,
      });

      for (const frame of page.frames) {
        if (frame === page.mainFrame) {
          // no loader is set, so need to have special handling
          if (!frame.activeLoader.lifecycle.load) {
            await frame.waitOn('frame-lifecycle', x => x.name === 'load');
          }
          continue;
        }
        await frame.waitForLifecycleEvent('load');

        await frame.evaluate(
          `(async function() {
            while (!document.querySelector("body.ready")) {
              await new Promise(resolve => setTimeout(resolve, 20));
            }
          })()`,
          true,
          {
            shouldAwaitExpression: true,
          },
        );
      }
    } finally {
      session.mitmRequestSession.interceptorHandlers = interceptorHandlers;
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
