import type ITypedEventEmitter from '@ulixee/commons/interfaces/ITypedEventEmitter';
import INavigation, { NavigationStatus } from './INavigation';
import { LoadStatus } from './Location';
export interface IFrameNavigations extends ITypedEventEmitter<IFrameNavigationEvents> {
    top: INavigation;
    lastHttpNavigationRequest: INavigation;
    history: INavigation[];
    currentUrl: string;
    get(id: number): INavigation;
    findMostRecentHistory(findFn: (history: INavigation) => boolean): INavigation;
    hasLoadStatus(status: LoadStatus): boolean;
    getPaintStableStatus(): {
        isStable: boolean;
        timeUntilReadyMs?: number;
    };
}
export interface IFrameNavigationEvents {
    change: {
        navigation: INavigation;
    };
    'navigation-requested': INavigation;
    'status-change': {
        id: number;
        url: string;
        statusChanges: Record<NavigationStatus, number>;
        newStatus: NavigationStatus;
    };
}
