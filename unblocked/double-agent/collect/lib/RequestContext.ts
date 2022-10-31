import { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import * as http2 from 'http2';
import Config from '@double-agent/config/index';
import IRequestContext from '../interfaces/IRequestContext';
import IRequestDetails from '../interfaces/IRequestDetails';
import Session from './Session';
import { addSessionIdToUrl, DomainType } from './DomainUtils';
import BaseServer, { IServerProtocol } from '../servers/BaseServer';
import Plugin, { IPluginPage } from './Plugin';

export default class RequestContext implements IRequestContext {
  private readonly plugin: Plugin;
  private readonly currentPageIndex: number;
  private readonly nextPageIndex: number;

  constructor(
    public readonly server: BaseServer,
    public readonly req: IncomingMessage | http2.Http2ServerRequest,
    public readonly res: ServerResponse | http2.Http2ServerResponse,
    public readonly url: URL,
    public readonly requestDetails: IRequestDetails,
    public readonly session: Session,
  ) {
    this.plugin = server.plugin;
    const pageIndexStr = url.searchParams.get('pageIndex');
    if (pageIndexStr) {
      const pages = this.plugin.pagesByAssignmentType[this.session.assignmentType];
      const pageIndex = Number(pageIndexStr);
      this.currentPageIndex = pageIndex;
      this.nextPageIndex = pageIndex + 1;
      if (this.nextPageIndex >= pages.length) this.nextPageIndex = undefined;
      this.session.trackCurrentPageIndex(this.plugin.id, this.currentPageIndex);
    }
  }

  public get page(): IPluginPage {
    return this.plugin.pagesByAssignmentType[this.session.assignmentType][this.currentPageIndex];
  }

  public get nextPageLink(): string {
    if (this.nextPageIndex === undefined) return;
    const pageIndex = this.nextPageIndex;
    const page = this.plugin.pagesByAssignmentType[this.session.assignmentType][pageIndex];
    return this.plugin.convertToSessionPage(page, this.session.id, pageIndex).url;
  }

  public buildUrl(path: string, domainType?: DomainType, protocol?: IServerProtocol): string {
    domainType = domainType || this.requestDetails.domainType;
    protocol = protocol || this.server.protocol;

    const { port, plugin } = this.plugin.getServer(protocol, this.session.id, this.server.protocol);
    const { CrossDomain, MainDomain, SubDomain } = Config.collect.domains;

    let domain: string;
    if (domainType === DomainType.SubDomain) {
      domain = SubDomain;
    } else if (domainType === DomainType.CrossDomain) {
      domain = CrossDomain;
    } else if (domainType === DomainType.MainDomain) {
      domain = MainDomain;
    } else {
      throw new Error(`Unknown domainType: ${domainType}`);
    }

    if (protocol === 'http2') {
      protocol = 'https';
    }
    const baseUrl = `${protocol}://${domain}:${port}`;
    const fullPath = `/${plugin.id}${path.startsWith('/') ? path : `/${path}`}`;
    const url = new URL(fullPath, baseUrl);

    if (domain === this.url.origin) {
      return [url.pathname, url.search].filter(Boolean).join('');
    }

    return addSessionIdToUrl(url.href, this.session.id);
  }
}
