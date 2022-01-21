import { Protocol } from '@ulixee/hero-interfaces/IDevtoolsSession';
import IResourceSummary from '@ulixee/hero-interfaces/IResourceSummary';
import decodeBuffer from '@ulixee/commons/lib/decodeBuffer';
import { bindFunctions } from '@ulixee/commons/lib/utils';
import { ISessionResourceDetails } from '@ulixee/hero-core/apis/Session.resource';
import ResourcesTable, { IResourcesRecord } from '@ulixee/hero-core/models/ResourcesTable';
import SessionDb from '@ulixee/hero-core/dbs/SessionDb';
import Fetch = Protocol.Fetch;

interface IMirrorNetworkConfig {
  headersFilter?: (string | RegExp)[];
  ignoreJavascriptRequests?: boolean;
  useResourcesOnce?: boolean;
}

export default class MirrorNetwork {
  public resourceLookup: { [method_url: string]: IResourceSummary[] } = {};
  public headersFilter: (string | RegExp)[];
  public ignoreJavascriptRequests: boolean;
  public useResourcesOnce: boolean;

  private readonly doctypesByUrl: { [url: string]: string } = {};
  private loadResourceDetails: (
    id: number,
  ) => Promise<ISessionResourceDetails> | ISessionResourceDetails;

  constructor(config?: IMirrorNetworkConfig) {
    this.headersFilter = config?.headersFilter ?? [];
    this.ignoreJavascriptRequests = config?.ignoreJavascriptRequests ?? false;
    this.useResourcesOnce = config?.useResourcesOnce ?? false;
    bindFunctions(this);
  }

  public registerDoctype(url: string, doctype: string): void {
    this.doctypesByUrl[url] = doctype;
  }

  public close(): void {
    this.resourceLookup = {};
  }

  public async mirrorNetworkRequests(
    request: Fetch.RequestPausedEvent,
  ): Promise<Fetch.FulfillRequestRequest> {
    const { url, method } = request.request;
    if (request.resourceType === 'Document' || url === 'about:blank') {
      const doctype = this.doctypesByUrl[url] ?? '';
      return {
        requestId: request.requestId,
        responseCode: 200,
        responseHeaders: [{ name: 'Content-Type', value: 'text/html; charset=utf-8' }],
        body: Buffer.from(`${doctype}<html><head></head><body></body></html>`).toString('base64'),
      };
    }

    const matches = this.resourceLookup[`${method}_${url}`];
    if (!matches?.length) {
      return {
        requestId: request.requestId,
        responseCode: 404,
        body: Buffer.from(`Not Found`).toString('base64'),
      };
    }
    const match = matches[0];
    if (this.useResourcesOnce) {
      matches.shift();
    }
    const resource = await this.loadResourceDetails(match.id);
    const { headers, contentEncoding, isJavascript } = this.getMockHeaders(resource);

    if (
      this.ignoreJavascriptRequests &&
      (request.resourceType === 'Script' ||
        matches[0].contentType.includes('json') ||
        matches[0].contentType.includes('javascript'))
    ) {
      return {
        requestId: request.requestId,
        responseCode: 200,
        responseHeaders: [{ name: 'Content-Type', value: matches[0].contentType }],
        body: '',
      };
    }

    let body = resource.body;

    // Chrome Devtools has an upstream issue that gzipped responses don't work, so we have to do it.. :(
    // https://bugs.chromium.org/p/chromium/issues/detail?id=1138839
    if (contentEncoding) {
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
  }

  public loadResources(
    resources: (IResourceSummary | IResourcesRecord)[],
    loadResourceDetails: (id: number) => Promise<ISessionResourceDetails> | ISessionResourceDetails,
  ): void {
    this.resourceLookup = {};
    for (let resource of resources) {
      if (!(resource as IResourceSummary).method) {
        resource = ResourcesTable.toResourceSummary(resource as IResourcesRecord);
      }
      resource = resource as IResourceSummary;
      const key = `${resource.method}_${resource.url}`;
      this.resourceLookup[key] ??= [];
      this.resourceLookup[key].push(resource);
    }
    this.loadResourceDetails = loadResourceDetails;
  }

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

      for (const entry of this.headersFilter) {
        if (key.match(entry)) continue;
      }

      if (name === 'content-encoding') {
        contentEncoding = header as string;
      }

      if (name === 'transfer-encoding' && header === 'chunked') {
        // node has stripped this out by the time we have the body
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

  public static createFromSessionDb(
    db: SessionDb,
    tabId?: number,
    resourceFilters: { hasResponse?: boolean; isGetOrDocument?: boolean } = {
      hasResponse: true,
      isGetOrDocument: true,
    },
    config?: IMirrorNetworkConfig,
  ): MirrorNetwork {
    const network = new MirrorNetwork(config);

    const resources = db.resources.filter(resourceFilters ?? {}).filter(x => {
      if (tabId) return x.tabId === tabId;
      return true;
    });

    network.loadResources(resources, MirrorNetwork.loadResourceFromDb.bind(MirrorNetwork, db));
    return network;
  }

  public static loadResourceFromDb(
    db: SessionDb,
    resourceId: number,
  ): { statusCode: number; headers: Record<string, string | string[]>; body: Buffer } {
    const resource = db.resources.getResponse(resourceId);
    const headers = JSON.parse(resource.responseHeaders ?? '{}');
    return {
      statusCode: resource.statusCode,
      headers,
      body: resource.responseData,
    };
  }
}
