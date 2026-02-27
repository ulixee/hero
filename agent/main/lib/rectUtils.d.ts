import IRect from '@ulixee/unblocked-specification/agent/browser/IRect';
import IPoint from '@ulixee/unblocked-specification/agent/browser/IPoint';
import { IViewportSize } from '@ulixee/unblocked-specification/agent/interact/IInteractionsHelper';
export declare function isPointWithinRect(point: IPoint, rect: IRect): boolean;
export declare function isRectInViewport(rect: IRect, viewport: IViewportSize, percent: number): {
    all: boolean;
    width: boolean;
    height: boolean;
};
export declare function createScrollPointForRect(targetRect: IRect, viewport: IViewportSize): IPoint;
export declare function createPointInRect(rect: IRect, options?: {
    paddingPercent?: {
        height: number;
        width: number;
    };
    constrainToViewport?: IViewportSize;
}): IPoint;
