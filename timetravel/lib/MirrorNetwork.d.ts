import IResourceSummary from '@ulixee/hero-interfaces/IResourceSummary';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import { IResourcesRecord } from '@ulixee/hero-core/models/ResourcesTable';
import SessionDb from '@ulixee/hero-core/dbs/SessionDb';
import { Protocol } from '@ulixee/unblocked-specification/agent/browser/IDevtoolsSession';
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
    resourceLookup: {
        [method_url: string]: (IResourceSummary & {
            responsePromise?: Resolvable<IResourceSummary>;
        })[];
    };
    headersFilter: (string | RegExp)[];
    ignoreJavascriptRequests: boolean;
    useResourcesOnce: boolean;
    resourceFilter: {
        hasResponse?: boolean;
        isGetOrDocument?: boolean;
    };
    waitForPendingResources: Set<Promise<any>>;
    private readonly doctypesByUrl;
    private loadResourceDetails;
    constructor(config: IMirrorNetworkConfig);
    registerDoctype(url: string, doctype: string): void;
    close(): void;
    mirrorNetworkRequests(request: Fetch.RequestPausedEvent): Promise<Fetch.FulfillRequestRequest>;
    addRequestedResource(resource: IResourceSummary): void;
    addResource(resource: IResourceSummary): void;
    setResources(resources: (IResourceSummary | IResourcesRecord)[], loadDetails: IMirrorNetworkConfig['loadResourceDetails']): void;
    private getMockHeaders;
    static createFromSessionDb(db: SessionDb, tabId?: number, options?: {
        hasResponse?: boolean;
        isGetOrDocument?: boolean;
    } & Partial<IMirrorNetworkConfig>): MirrorNetwork;
    static loadResourceFromDb(db: SessionDb, resourceId: number): {
        statusCode: number;
        headers: Record<string, string | string[]>;
        body: Buffer;
    };
}
export {};
