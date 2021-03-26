import type IMouseUpResult from './IMouseUpResult';
import { IMousePosition } from './IInteractions';
import IRect from './IRect';
import IPoint from './IPoint';
import IViewport from './IViewport';
import { IBoundLog } from './ILog';

export default interface IInteractionsHelper {
  lookupBoundingRect(
    mousePosition: IMousePosition,
  ): Promise<IRect & { elementTag?: string; nodeId?: number; isNodeVisible?: boolean }>;
  createMouseupTrigger(nodeId: number): Promise<{ didTrigger: () => Promise<IMouseUpResult> }>;
  createMouseoverTrigger(nodeId: number): Promise<{ didTrigger: () => Promise<boolean> }>;
  mousePosition: IPoint;
  scrollOffset: Promise<IPoint>;
  viewport: IViewport;
  logger: IBoundLog;
}
