import IResourceSummary from '@ulixee/hero-interfaces/IResourceSummary';
import { decompressBuffer } from '@ulixee/commons/lib/bufferUtils';
import { bindFunctions } from '@ulixee/commons/lib/utils';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import ResourcesTable, { IResourcesRecord } from '@ulixee/hero-core/models/ResourcesTable';
import SessionDb from '@ulixee/hero-core/dbs/SessionDb';
import { Protocol } from '@ulixee/unblocked-specification/agent/browser/IDevtoolsSession';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import IHttpHeaders from '@ulixee/unblocked-specification/agent/net/IHttpHeaders';
import Fetch = Protocol.Fetch;

interface ISessionResourceDetails {
  body: Buffer;
  headers: IHttpHeaders;
  statusCode: number;
}

interface IMirrorNetworkConfig {
  headersFilter?: (string | RegExp)[];
  ignoreJavascriptRequests?: boolean;
  useResourcesOnce?: boolean;
  loadResourceDetails: (id: number) => Promise<ISessionResourceDetails> | ISessionResourceDetails;
}

export default class MirrorNetwork {
  public resourceLookup: {
    [method_url: string]: (IResourceSummary & { responsePromise?: Resolvable<IResourceSummary> })[];
  } = {};

  public headersFilter: (string | RegExp)[];
  public ignoreJavascriptRequests: boolean;
  public useResourcesOnce: boolean;
  public resourceFilter: { hasResponse?: boolean; isGetOrDocument?: boolean };

  public waitForPendingResources = new Set<Promise<any>>();

  private readonly doctypesByUrl: { [url: string]: string } = {};
  private loadResourceDetails: (
    id: number,
  ) => Promise<ISessionResourceDetails> | ISessionResourceDetails;

  constructor(config: IMirrorNetworkConfig) {
    this.headersFilter = config.headersFilter ?? [];
    this.ignoreJavascriptRequests = config.ignoreJavascriptRequests ?? false;
    this.useResourcesOnce = config.useResourcesOnce ?? false;
    this.loadResourceDetails = config.loadResourceDetails;
    bindFunctions(this);
  }

  public registerDoctype(url: string, doctype: string): void {
    this.doctypesByUrl[url] = doctype;
  }

  public close(): void {
    this.resourceLookup = {};
    this.loadResourceDetails = null;
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
        responseHeaders: [
          { name: 'Content-Type', value: 'text/html; charset=utf-8' },
          // TODO remove localhost stuff
          { name: 'Content-Security-Policy', value: "script-src 'nonce-hero-timetravel'; connect-src 'self' ws://agent.localhost:* http://agent.localhost:*" },
          { name: 'Access-Control-Allow-Origin', value: '*' },
        ],
        body: Buffer.from(`${doctype}<html><head></head><body></body></html>`).toString('base64'),
      };
    }

    const key = `${method}_${url}`;
    const matches = this.resourceLookup[key];
    if (!matches?.length) {
      return {
        requestId: request.requestId,
        responseCode: 404,
        body: Buffer.from(`Not Found`).toString('base64'),
      };
    }

    let match = matches[0];
    if (!match.hasResponse && match.responsePromise) {
      const responsePromise = match.responsePromise.promise;
      this.waitForPendingResources.add(responsePromise);
      match = await responsePromise;
      this.waitForPendingResources.delete(responsePromise);
    }

    if (this.useResourcesOnce) {
      matches.shift();
    }

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

    const resource = await this.loadResourceDetails(match.id);
    const { headers, contentEncoding, isJavascript } = this.getMockHeaders(resource);
    if (this.ignoreJavascriptRequests && isJavascript) {
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
      body = await decompressBuffer(resource.body, contentEncoding);
      headers.splice(
        headers.findIndex(x => x.name === 'content-encoding'),
        1,
      );
    }
    return {
      requestId: request.requestId,
      body: body?.toString('base64') ?? '',
      responseHeaders: headers,
      responseCode: resource.statusCode,
    };
  }

  public addRequestedResource(resource: IResourceSummary): void {
    const key = `${resource.method}_${resource.url}`;
    if (this.resourceLookup[key]?.length) return;

    (resource as any).responsePromise = new Resolvable();
    this.resourceLookup[key] = [resource];
  }

  public addResource(resource: IResourceSummary): void {
    const key = `${resource.method}_${resource.url}`;

    if (this.resourceFilter) {
      if (this.resourceFilter.hasResponse && !resource.hasResponse) {
        return;
      }
      if (
        this.resourceFilter.isGetOrDocument &&
        !(resource.type === 'Document' || resource.method === 'GET')
      ) {
        return;
      }
    }

    if (!this.resourceLookup[key]?.length) {
      this.resourceLookup[key] = [resource];
    } else {
      const pendingResolutionIdx = this.resourceLookup[key].findIndex(
        x => !!x.responsePromise && !x.responsePromise.isResolved,
      );
      if (pendingResolutionIdx >= 0) {
        this.resourceLookup[key][pendingResolutionIdx].responsePromise.resolve(resource);
        this.resourceLookup[key][pendingResolutionIdx] = resource;
      } else {
        this.resourceLookup[key].push(resource);
      }
    }
  }

  public setResources(
    resources: (IResourceSummary | IResourcesRecord)[],
    loadDetails: IMirrorNetworkConfig['loadResourceDetails'],
  ): void {
    this.loadResourceDetails = loadDetails;
    for (const resourceSet of Object.values(this.resourceLookup)) {
      for (const resource of resourceSet) {
        if (resource.responsePromise && !resource.responsePromise.isResolved)
          resource.responsePromise.reject(new CanceledPromiseError('Replacing resources'), true);
      }
    }
    this.resourceLookup = {};
    for (let resource of resources) {
      if (!(resource as IResourceSummary).method) {
        resource = ResourcesTable.toResourceSummary(resource as IResourcesRecord);
      }
      resource = resource as IResourceSummary;
      this.addResource(resource);
    }
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
        if (name.match(entry)) continue;
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
    options: {
      hasResponse?: boolean;
      isGetOrDocument?: boolean;
    } & Partial<IMirrorNetworkConfig> = {
      hasResponse: true,
      isGetOrDocument: true,
    },
  ): MirrorNetwork {
    options.loadResourceDetails ??= MirrorNetwork.loadResourceFromDb.bind(this, db);
    const network = new MirrorNetwork(options as IMirrorNetworkConfig);

    const resources = db.resources.filter(options).filter(x => {
      if (tabId) return x.tabId === tabId;
      return true;
    });
    network.resourceFilter = options;
    network.setResources(resources, options.loadResourceDetails);
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
