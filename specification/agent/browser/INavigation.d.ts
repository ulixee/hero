import type IResolvablePromise from '@ulixee/commons/interfaces/IResolvablePromise';
import { NavigationReason } from './NavigationReason';
import { ILoadStatus } from './Location';
export default interface INavigation {
    id: number;
    documentNavigationId: number;
    frameId: number;
    tabId: number;
    resourceId: number;
    resourceIdResolvable: IResolvablePromise<number>;
    browserRequestId: string;
    doctype: string;
    loaderId: string;
    navigationError?: Error;
    startCommandId: number;
    requestedUrl: string;
    initiatedTime: number;
    navigationReason: NavigationReason;
    finalUrl?: string;
    statusChanges: Map<NavigationStatus, number>;
}
export declare const ContentPaint = "ContentPaint";
export type NavigationStatus = ILoadStatus | 'ContentPaint';
