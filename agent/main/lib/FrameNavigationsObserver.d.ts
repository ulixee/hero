import { ILoadStatus, ILocationTrigger } from '@ulixee/unblocked-specification/agent/browser/Location';
import INavigation from '@ulixee/unblocked-specification/agent/browser/INavigation';
import type FrameNavigations from './FrameNavigations';
import type IWaitForOptions from '../interfaces/IWaitForOptions';
export default class FrameNavigationsObserver {
    private readonly navigations;
    private resourceIdResolvable;
    private logger;
    private readonly statusTriggers;
    constructor(navigations: FrameNavigations);
    waitForLocation(status: ILocationTrigger, options?: IWaitForOptions): Promise<INavigation>;
    waitForLoad(status: ILoadStatus, options?: IWaitForOptions & {
        doNotIncrementMarker?: boolean;
    }): Promise<INavigation>;
    waitForNavigationResourceId(navigation?: INavigation): Promise<number>;
    cancelWaiting(cancelMessage: string): void;
    private onLoadStatusChange;
    private getResolutionStatus;
    private refreshPendingLoadTrigger;
    private resolvePendingTrigger;
    private hasLocationTrigger;
    private createStatusTriggeredPromise;
    private static isNavigationReload;
}
