import IResourceFilterProperties from '@ulixee/hero-interfaces/IResourceFilterProperties';
import IWaitForResourceOptions from '@ulixee/hero-interfaces/IWaitForResourceOptions';
import IResourceMeta from '@ulixee/unblocked-specification/agent/net/IResourceMeta';
import IResourceType from '@ulixee/unblocked-specification/agent/net/IResourceType';
import IWaitForResourceFilter from '../interfaces/IWaitForResourceFilter';
import IWaitForResourcesFilter from '../interfaces/IWaitForResourcesFilter';
import CoreTab from './CoreTab';
import DetachedResource from './DetachedResource';
import { InternalPropertiesSymbol } from './internal';
import ResourceRequest from './ResourceRequest';
import ResourceResponse from './ResourceResponse';
import Tab from './Tab';
export default class Resource {
    #private;
    readonly id: number;
    readonly url: string;
    readonly type: IResourceType;
    readonly documentUrl: string;
    readonly isRedirect?: boolean;
    readonly request: ResourceRequest;
    readonly response: ResourceResponse;
    get [InternalPropertiesSymbol](): {
        coreTabPromise: Promise<CoreTab>;
        resourceMeta: IResourceMeta;
    };
    constructor(coreTabPromise: Promise<CoreTab>, resourceMeta: IResourceMeta);
    get buffer(): Promise<Buffer>;
    get text(): Promise<string>;
    get json(): Promise<any>;
    $detach(): Promise<DetachedResource>;
    $addToDetachedResources(name: string): Promise<void>;
    static findLatest(tab: Tab, filter: IResourceFilterProperties, options: {
        sinceCommandId: number;
    }): Promise<Resource>;
    static findAll(tab: Tab, filter: IResourceFilterProperties, options: {
        sinceCommandId: number;
    }): Promise<Resource[]>;
    static waitForOne(tab: Tab, filter: IWaitForResourceFilter, options: IWaitForResourceOptions): Promise<Resource>;
    static waitForMany(tab: Tab, filter: IWaitForResourcesFilter, options: IWaitForResourceOptions): Promise<Resource[]>;
}
export declare function createResource(coreTab: Promise<CoreTab>, resourceMeta: IResourceMeta): Resource;
