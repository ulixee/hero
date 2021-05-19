import { IPuppetPageOptions } from '@secret-agent/interfaces/IPuppetContext';
import INavigation from '@secret-agent/interfaces/INavigation';
import IResourceMeta from '@secret-agent/interfaces/IResourceMeta';
import { DomActionType } from '@secret-agent/interfaces/IDomChangeEvent';
import { IDomChangeRecord } from '../models/DomChangesTable';
import Session from './Session';
import InjectedScripts from './InjectedScripts';
import Tab from './Tab';

export default class DetachedTabState {
  public get url(): string {
    return this.initialPageNavigation.finalUrl;
  }

  public detachedAtCommandId: number;
  public get domChangeRange(): { indexRange: [number, number]; timestampRange: [number, number] } {
    const first = this.domChanges[0];
    const last = this.domChanges[this.domChanges.length - 1];
    return {
      indexRange: [first.eventIndex, last.eventIndex],
      timestampRange: [first.timestamp, last.timestamp],
    };
  }

  private readonly initialPageNavigation: INavigation;
  private readonly domChanges: IDomChangeRecord[];
  private readonly resourceLookup: { [method_url: string]: IResourceMeta[] };
  private session: Session;
  private doctype = '';

  constructor(
    session: Session,
    initialPageNavigation: INavigation,
    domRecording: IDomChangeRecord[],
    resourceLookup: { [method_url: string]: IResourceMeta[] },
  ) {
    this.detachedAtCommandId = session.sessionState.lastCommand.id;
    this.session = session;
    this.initialPageNavigation = initialPageNavigation;
    this.domChanges = this.filterDomChanges(domRecording);
    this.resourceLookup = resourceLookup;
  }

  public async restoreDomIntoTab(tab: Tab): Promise<void> {
    const page = tab.puppetPage;
    const loader = await page.navigate(this.url);

    tab.navigations.onNavigationRequested(
      'goto',
      this.url,
      this.detachedAtCommandId,
      loader.loaderId,
    );
    await page.mainFrame.waitForLoader(loader.loaderId);
    await Promise.all([
      InjectedScripts.installDetachedScripts(page),
      InjectedScripts.restoreDom(page, this.domChanges),
    ]);
  }

  public mockNetworkRequests: IPuppetPageOptions['mockNetworkRequests'] = async request => {
    const { url, method } = request.request;
    if (request.resourceType === 'Document' && url === this.url) {
      return {
        requestId: request.requestId,
        responseCode: 200,
        responseHeaders: [{ name: 'Content-Type', value: 'text/html; charset=utf-8' }],
        body: Buffer.from(`${this.doctype}<html><head></head><body></body></html>`).toString(
          'base64',
        ),
      };
    }

    const match = this.resourceLookup[`${method}_${url}`]?.shift();
    if (!match) return null;

    const { headers, isJavascript } = this.getMockHeaders(match);
    if (isJavascript || request.resourceType === 'Script') {
      return {
        requestId: request.requestId,
        responseCode: 200,
        responseHeaders: [{ name: 'Content-Type', value: 'application/javascript' }],
        body: '',
      };
    }

    const body = (await this.session.sessionState.getResourceData(match.id, false)).toString(
      'base64',
    );

    return {
      requestId: request.requestId,
      body,
      responseHeaders: headers,
      responseCode: match.response.statusCode,
    };
  };

  public toJSON(): any {
    return {
      domChangeRange: this.domChangeRange,
      url: this.url,
      detachedAtCommandId: this.detachedAtCommandId,
      resources: Object.values(this.resourceLookup).reduce((a, b) => (a += b.length), 0),
    };
  }

  private getMockHeaders(
    resource: IResourceMeta,
  ): { isJavascript: boolean; headers: { name: string; value: string }[] } {
    const headers: { name: string; value: string }[] = [];
    let isJavascript = false;

    for (const [key, header] of Object.entries(resource.response.headers)) {
      const name = key.toLowerCase();

      // only take limited set of headers
      if (
        name === 'date' ||
        name.startsWith('x-') ||
        name === 'set-cookie' ||
        name === 'alt-svc' ||
        name === 'server'
      ) {
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
    return { headers, isJavascript };
  }

  private filterDomChanges(allDomChanges: IDomChangeRecord[]): IDomChangeRecord[] {
    // find last "newDocument" entry
    const domChanges: IDomChangeRecord[] = [];
    for (const entry of allDomChanges) {
      // 10 is doctype
      if (entry.action === DomActionType.added && entry.nodeType === 10) {
        this.doctype = entry.textContent;
      }
      if (entry.action === DomActionType.newDocument && this.url === entry.textContent) {
        // reset list
        domChanges.length = 0;
        continue;
      }
      domChanges.push(entry);
    }
    return domChanges;
  }
}
