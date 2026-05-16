"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = require("@ulixee/commons/lib/Logger");
const utils_1 = require("@ulixee/commons/lib/utils");
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const InjectedScripts_1 = require("./InjectedScripts");
const { log } = (0, Logger_1.default)(module);
class UserProfile {
    static async export(session) {
        const cookies = await session.browserContext.getCookies();
        const exportedStorage = { ...(session.options.userProfile?.storage ?? {}) };
        for (const tab of session.tabsById.values()) {
            const page = tab.page;
            for (const { origin, storageForOrigin, databaseNames, frame, } of await page.domStorageTracker.getStorageByOrigin()) {
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
                        const liveData = await frame.evaluate(`window.exportDomStorage(${databases})`, {
                            isolateFromWebPageEnvironment: true,
                        });
                        originStorage.localStorage = liveData.localStorage;
                        originStorage.sessionStorage = liveData.sessionStorage;
                        originStorage.indexedDB = liveData.indexedDB.filter(Boolean);
                    }
                    catch (error) {
                        if (frame.isAttached && !(error instanceof IPendingWaitEvent_1.CanceledPromiseError)) {
                            throw error;
                        }
                    }
                }
            }
        }
        return {
            cookies,
            storage: exportedStorage,
            geolocation: session.emulationProfile.geolocation,
            locale: session.emulationProfile.locale,
            timezoneId: session.emulationProfile.timezoneId,
            userAgent: session.emulationProfile.userAgentOption,
            userAgentString: session.emulationProfile.userAgentOption.string,
            deviceProfile: session.emulationProfile.deviceProfile,
        };
    }
    static async installCookies(session) {
        const { userProfile } = session;
        (0, utils_1.assert)(userProfile, 'UserProfile exists');
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
    static async installStorage(session, page) {
        const { userProfile } = session;
        const domStorage = {};
        const origins = [];
        for (const [origin, storage] of Object.entries(userProfile.storage)) {
            if (storage.indexedDB.length === 0 &&
                storage.sessionStorage.length === 0 &&
                storage.localStorage.length === 0) {
                continue;
            }
            const og = origin.toLowerCase();
            origins.push(og);
            domStorage[og] = storage;
        }
        if (!origins.length)
            return;
        const sessionId = session.id;
        const parentLogId = log.info('UserProfile.installStorage', {
            sessionId,
            storageDomains: origins?.length,
        });
        const browserContext = session.browserContext;
        try {
            browserContext.resources.isCollecting = false;
            page.storeEventsWithoutListeners = false;
            // eslint-disable-next-line require-await,@typescript-eslint/require-await
            await page.networkManager.setNetworkInterceptor(async ({ request, requestId }) => {
                const url = new URL(request.url);
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
             ${InjectedScripts_1.default.getIndexedDbStorageRestoreScript()}
             
             const dbs = ${JSON.stringify(originStorage.indexedDB)};
             restoreUserStorage(dbs).then(() => {
               document.body.setAttribute('class', 'ready');
             });`;
                }
                return {
                    responseCode: 200,
                    requestId,
                    body: Buffer.from(`<html><head><link rel="icon" href="data:,"></head><body class="${readyClass}">
<h5>Loading UserProfile for ${url.origin}</h5>
<script>
${script}
</script>
</body></html>`).toString('base64'),
                };
            }, true);
            for (const origin of origins) {
                await page.navigate(origin);
                await page.mainFrame.evaluate(`(async function() {
            while (!document.querySelector("body.ready")) {
              await new Promise(resolve => setTimeout(resolve, 20));
            }
          })()`, {
                    isolateFromWebPageEnvironment: false,
                    shouldAwaitExpression: true,
                    returnByValue: true,
                });
            }
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
        }
        finally {
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
exports.default = UserProfile;
//# sourceMappingURL=UserProfile.js.map