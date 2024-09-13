import type { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { IJsPath, INodePointer, INodeVisibility } from '@ulixee/js-path';
import IMouseResult from './IMouseResult';
import IPoint from '../browser/IPoint';
import { IMousePosition } from './IInteractions';
import IRect from '../browser/IRect';

export default interface IInteractionsHelper {
  mousePosition: IPoint;
  scrollOffset: Promise<IPoint>;
  viewportSize: IViewportSize;
  logger: IBoundLog;
  doesBrowserAnimateScrolling: boolean;

  createMousedownTrigger(nodeId: number): Promise<{
    nodeVisibility: INodeVisibility;
    didTrigger: () => Promise<IMouseResult>;
  }>;

  reloadJsPath(jsPath: IJsPath): Promise<INodePointer>;
  lookupBoundingRect(
    mousePosition: IMousePosition,
    options?: {
      relativeToScrollOffset?: IPoint;
      includeNodeVisibility?: boolean;
      useLastKnownPosition?: boolean;
    },
  ): Promise<IRectLookup>;

  // rect utils
  createPointInRect(
    rect: IRect,
    options?: {
      paddingPercent?: { height: number; width: number };
      constrainToViewport?: IViewportSize;
    },
  ): IPoint;
  createScrollPointForRect(rect: IRect, viewport: IViewportSize): IPoint;
  isPointWithinRect(point: IPoint, rect: IRect): boolean;
  isRectInViewport(
    rect: IRect,
    viewport: { width: number; height: number },
    percent: number,
  ): { width: boolean; height: boolean };
}

export type IRectLookup = IRect & {
  elementTag?: string;
  nodeId?: number;
  nodeVisibility?: INodeVisibility;
};

export interface IViewportSize {
  width: number;
  height: number;
}
