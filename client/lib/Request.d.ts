import { IRequestInfo, IRequestInit } from '@ulixee/awaited-dom/base/interfaces/official';
import CoreFrameEnvironment from './CoreFrameEnvironment';
export default function RequestGenerator(coreFrame: Promise<CoreFrameEnvironment>): {
    new (input: IRequestInfo, init?: IRequestInit): {
        readonly headers: import("@ulixee/awaited-dom/base/interfaces/official").IHeaders;
        readonly cache: Promise<import("@ulixee/awaited-dom/base/interfaces/official").IRequestCache>;
        readonly credentials: Promise<import("@ulixee/awaited-dom/base/interfaces/official").IRequestCredentials>;
        readonly destination: Promise<import("@ulixee/awaited-dom/base/interfaces/official").IRequestDestination>;
        readonly integrity: Promise<string>;
        readonly isHistoryNavigation: Promise<boolean>;
        readonly isReloadNavigation: Promise<boolean>;
        readonly keepalive: Promise<boolean>;
        readonly method: Promise<string>;
        readonly mode: Promise<import("@ulixee/awaited-dom/base/interfaces/official").IRequestMode>;
        readonly redirect: Promise<import("@ulixee/awaited-dom/base/interfaces/official").IRequestRedirect>;
        readonly referrer: Promise<string>;
        readonly referrerPolicy: Promise<import("@ulixee/awaited-dom/base/interfaces/official").IReferrerPolicy>;
        readonly url: Promise<string>;
        readonly bodyUsed: Promise<boolean>;
        arrayBuffer(): Promise<ArrayBuffer>;
        json(): Promise<any>;
        text(): Promise<string>;
    };
};
export declare function getRequestIdOrUrl(input: IRequestInfo): Promise<number | string>;
