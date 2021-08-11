import { IPuppetPage } from '@ulixee/hero-interfaces/IPuppetPage';
import Log from '@ulixee/commons/lib/Logger';
import IPuppetContext from '@ulixee/hero-interfaces/IPuppetContext';
import decodeBuffer from '@ulixee/commons/lib/decodeBuffer';
import * as util from 'util';
import SessionReplayTab from './SessionReplayTab';
import ConnectionToCoreApi from '../connections/ConnectionToCoreApi';
import { ISessionFindArgs } from '../dbs/SessionDb';
import { IDocument } from '../apis/Session.ticks';
import { ISessionResource } from '../apis/Session.resources';
import { ISessionResourceDetails } from '../apis/Session.resource';
import CorePlugins from './CorePlugins';
import { Session } from '../index';
import GlobalPool from './GlobalPool';
import InjectedScripts from './InjectedScripts';
import { ISessionRecord } from '../models/SessionTable';

const { log } = Log(module);

export default class SessionReplay {
  public tabsById = new Map<number, SessionReplayTab>();
  public session: ISessionRecord;
  public dataLocation: string;
  public startTab: SessionReplayTab;

  private readonly resourceLookup: { [method_url: string]: ISessionResource[] } = {};

  private readonly documents: IDocument[] = [];
  private get sessionArgs(): { sessionId: string; dataLocation: string } {
    return {
      sessionId: this.session.id,
      dataLocation: this.dataLocation,
    };
  }

  private browserContext: IPuppetContext;

  constructor(readonly connection: ConnectionToCoreApi, readonly debugLogging = false) {}

  public async load(args: ISessionFindArgs): Promise<void> {
    const { session, dataLocation } = await this.connection.run({ api: 'Session.find', args });
    this.session = session;
    this.dataLocation = dataLocation;

    const ticksResult = await this.connection.run({
      api: 'Session.ticks',
      args: {
        ...this.sessionArgs,
        includeCommands: true,
        includeInteractionEvents: true,
        includePaintEvents: true,
      },
    });
    if (this.debugLogging) {
      // eslint-disable-next-line no-console
      console.log(util.inspect(ticksResult.tabDetails, true, null, true));
    }
    for (const tabDetails of ticksResult.tabDetails) {
      const tab = new SessionReplayTab(tabDetails, this);
      this.tabsById.set(tabDetails.tab.id, tab);
      this.startTab ??= tab;
      this.documents.push(...tabDetails.documents);
    }
    const resourcesResult = await this.connection.run({
      api: 'Session.resources',
      args: { ...this.sessionArgs, omitWithoutResponse: true, omitNonHttpGet: true },
    });
    for (const resource of resourcesResult.resources) {
      const key = `${resource.method}_${resource.url}`;
      this.resourceLookup[key] ??= [];
      this.resourceLookup[key].push(resource);
    }

    const options = Session.restoreOptionsFromSessionRecord({}, this.session);
    options.sessionResume = null;
    options.showBrowserInteractions = true;
    options.showBrowser = true;
    options.allowManualBrowserInteraction = false;

    const plugins = new CorePlugins(
      {
        humanEmulatorId: this.session.humanEmulatorId,
        browserEmulatorId: this.session.browserEmulatorId,
        userAgentSelector: options.userAgent,
        deviceProfile: options?.userProfile?.deviceProfile,
        getSessionSummary() {
          return {
            id: session.id,
            options,
            sessionsDataLocation: GlobalPool.sessionsDir,
          };
        },
      },
      log,
    );
    plugins.browserEngine.isHeaded = true;
    plugins.configure(options);

    const puppet = await GlobalPool.getPuppet(plugins.browserEngine);
    this.browserContext = await puppet.newContext(plugins, log);

    this.browserContext.defaultPageInitializationFn = page =>
      InjectedScripts.installDetachedScripts(page, true);

    await this.startTab.openTab();
  }

  public async close(): Promise<void> {
    await this.browserContext.close();
  }

  public async createNewPage(): Promise<IPuppetPage> {
    const page = await this.browserContext.newPage();

    await Promise.all([
      page.setNetworkRequestInterceptor(this.mockNetworkRequests.bind(this)),
      page.setJavaScriptEnabled(false),
    ]);
    return page;
  }

  public mockNetworkRequests: Parameters<IPuppetPage['setNetworkRequestInterceptor']>[0] =
    async request => {
      const { url, method } = request.request;
      if (request.resourceType === 'Document') {
        const doctype = this.documents.find(x => x.url === url)?.doctype ?? '';
        return {
          requestId: request.requestId,
          responseCode: 200,
          responseHeaders: [{ name: 'Content-Type', value: 'text/html; charset=utf-8' }],
          body: Buffer.from(`${doctype}<html><head></head><body></body></html>`).toString('base64'),
        };
      }

      const matches = this.resourceLookup[`${method}_${url}`];
      if (!matches?.length) return null;

      const { resource } = await this.connection.run({
        api: 'Session.resource',
        args: {
          ...this.sessionArgs,
          resourceId: matches[0].id,
        },
      });

      const { headers, contentEncoding } = this.getMockHeaders(resource);
      let body = resource.body;
      if (contentEncoding) {
        // TODO: can't send compressed content to devtools for some reason
        body = await decodeBuffer(resource.body, contentEncoding);
        headers.splice(
          headers.findIndex(x => x.name === 'content-encoding'),
          1,
        );
      }
      return {
        requestId: request.requestId,
        body: body.toString('base64'),
        responseHeaders: headers,
        responseCode: resource.statusCode,
      };
    };

  private getMockHeaders(resource: ISessionResourceDetails): {
    isJavascript: boolean;
    hasChunkedTransfer: boolean;
    contentEncoding: string;
    headers: { name: string; value: string }[];
  } {
    const headers: { name: string; value: string }[] = [];
    let isJavascript = false;
    let contentEncoding: string;
    let hasChunkedTransfer = false;

    for (const [key, header] of Object.entries(resource.headers)) {
      const name = key.toLowerCase();

      if (name === 'content-encoding') {
        contentEncoding = header as string;
      }

      if (name === 'transfer-encoding' && header === 'chunked') {
        hasChunkedTransfer = true;
        continue;
      }

      if (name === 'content-type' && header.includes('javascript')) {
        isJavascript = true;
        break;
      }

      if (Array.isArray(header)) {
        for (const value of header) {
          headers.push({ name, value });
        }
      } else {
        headers.push({ name, value: header });
      }
    }
    return { headers, isJavascript, contentEncoding, hasChunkedTransfer };
  }
}
