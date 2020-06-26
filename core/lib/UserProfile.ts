import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';
import { ICookie } from '@secret-agent/core-interfaces/ICookie';
import Window from './Window';
import IDomStorage, { IDomStorageForOrigin } from '@secret-agent/core-interfaces/IDomStorage';
import Protocol from 'devtools-protocol';
import Log from '@secret-agent/commons/Logger';
import { exceptionDetailsToError } from './Utils';
import IDevtoolsClient from '../interfaces/IDevtoolsClient';
import { URL } from 'url';
import SetCookiesRequest = Protocol.Network.SetCookiesRequest;
import CookieParam = Protocol.Network.CookieParam;
import DomEnv from './DomEnv';

const { log } = Log(module);

export default class UserProfile {
  public static installedWorld = DomEnv.installedDomWorldName;
  private readonly devtoolsClient: IDevtoolsClient;

  constructor(devtoolsClient: IDevtoolsClient) {
    this.devtoolsClient = devtoolsClient;
  }

  private async getStorageItems(securityOrigins: { origin: string; executionId: number }[]) {
    const items: IDomStorage = {};
    for (const securityOrigin of securityOrigins) {
      const databaseNames = await this.getDatabaseNames(securityOrigin.origin);
      items[securityOrigin.origin] = await this.readDomStorage(
        databaseNames,
        securityOrigin.executionId,
      );
    }
    return items;
  }

  private async readDomStorage(
    databaseNames: string[],
    executionContextId: number,
  ): Promise<IDomStorageForOrigin> {
    const record = await this.devtoolsClient.send('Runtime.evaluate', {
      expression: `window.exportDomStorage(${JSON.stringify(databaseNames)})`,
      awaitPromise: true,
      contextId: executionContextId,
      returnByValue: true,
    });
    if (record.exceptionDetails) {
      const error = exceptionDetailsToError(record.exceptionDetails);
      log.warn('ReadDomStorage.Error', { error });
      throw error;
    }
    return record.result?.value;
  }

  private async getDatabaseNames(securityOrigin: string) {
    return this.devtoolsClient
      .send('IndexedDB.requestDatabaseNames', {
        securityOrigin: securityOrigin,
      })
      .then(x => x.databaseNames);
  }

  public static async export(
    devtoolsClient: IDevtoolsClient,
    origins: { origin: string; executionId: number }[],
  ) {
    const instance = new UserProfile(devtoolsClient);
    return {
      cookies: await this.getAllCookies(devtoolsClient),
      storage: await instance.getStorageItems(origins),
    } as IUserProfile;
  }

  public static async install(fromProfile: IUserProfile, window: Window) {
    const { devtoolsClient } = window;

    await window.domEnv.install();

    if (fromProfile?.cookies) {
      await this.setCookies(
        fromProfile.cookies,
        devtoolsClient,
        Object.keys(fromProfile?.storage ?? {}),
      );
    }

    if (fromProfile?.storage && Object.keys(fromProfile.storage).length) {
      // prime each page
      for (const origin of Object.keys(fromProfile.storage)) {
        const executionContextId = new Promise<number>(resolve => {
          const waitForContext = event => {
            if (event.context.name === UserProfile.installedWorld) {
              devtoolsClient.off('Runtime.executionContextCreated', waitForContext);
              resolve(event.context.id);
            }
          };
          devtoolsClient.on('Runtime.executionContextCreated', waitForContext);
        });
        await window.setBrowserOrigin(origin);
        await devtoolsClient.send('Runtime.evaluate', {
          expression: `window.restoreUserStorage(${JSON.stringify(fromProfile.storage[origin])})`,
          awaitPromise: true,
          contextId: await executionContextId,
          returnByValue: true,
        });
      }
      // reset browser to start page
      await window.setBrowserOrigin('about:blank');
    }
    return this;
  }

  public static async getAllCookies(devtoolsClient: IDevtoolsClient) {
    const cookieResponse = await devtoolsClient.send('Network.getAllCookies');
    return cookieResponse.cookies.map(
      x =>
        ({
          ...x,
          expires: String(x.expires),
        } as ICookie),
    );
  }

  private static async setCookies(
    cookies: ICookie[],
    devtoolsClient: IDevtoolsClient,
    origins: string[],
  ) {
    const originUrls = (origins ?? []).map(x => new URL(x));
    const parsedCookies: CookieParam[] = [];
    for (const cookie of cookies) {
      const cookieToSend: CookieParam = {
        ...cookie,
        expires: cookie.expires ? parseInt(cookie.expires, 10) : null,
      };
      cookieToSend.url = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
      const match = originUrls.find(x => {
        return x.hostname.endsWith(cookie.domain);
      });
      if (match) cookieToSend.url = match.href;

      parsedCookies.push(cookieToSend);
    }
    return await devtoolsClient.send('Network.setCookies', {
      cookies: parsedCookies,
    } as SetCookiesRequest);
  }
}
