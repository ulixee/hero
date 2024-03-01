/// <reference types="node" />
import IResourceMeta from '@ulixee/unblocked-specification/agent/net/IResourceMeta';
import IWebsocketMessage from '@ulixee/hero-interfaces/IWebsocketMessage';
import CoreTab from './CoreTab';
import DetachedResource from './DetachedResource';
import ResourceRequest from './ResourceRequest';
import ResourceResponse from './ResourceResponse';
import AwaitedEventTarget from './AwaitedEventTarget';
import { InternalPropertiesSymbol } from './internal';
interface IEventType {
    message: (message: IWebsocketMessage) => void;
}
export default class WebsocketResource extends AwaitedEventTarget<IEventType> {
    #private;
    readonly url: string;
    readonly documentUrl: string;
    readonly type: "Document" | "Stylesheet" | "Image" | "Media" | "Font" | "Script" | "TextTrack" | "XHR" | "Fetch" | "EventSource" | "Websocket" | "Manifest" | "SignedExchange" | "Ping" | "CSPViolationReport" | "Redirect" | "Ico" | "Preflight" | "Other";
    readonly isRedirect: boolean;
    readonly request: ResourceRequest;
    readonly response: ResourceResponse;
    get [InternalPropertiesSymbol](): {
        coreTabPromise: Promise<CoreTab>;
        resourceMeta: IResourceMeta;
    };
    constructor(coreTabPromise: Promise<CoreTab>, resourceMeta: IResourceMeta);
    get messages(): Promise<IWebsocketMessage[]>;
    get buffer(): Promise<Buffer>;
    get text(): Promise<string>;
    get json(): Promise<any>;
    $detach(): Promise<DetachedResource>;
    $addToDetachedResources(name: string): Promise<void>;
}
export declare function createWebsocketResource(resourceMeta: IResourceMeta, coreTab: Promise<CoreTab>): WebsocketResource;
export {};
