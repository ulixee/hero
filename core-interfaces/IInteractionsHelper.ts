import type IMouseUpResult from '@secret-agent/injected-scripts/interfaces/IMouseUpResult';
import { IMousePosition } from './IInteractions';
import IRect from './IRect';
import IPoint from './IPoint';
import IViewport from './IViewport';
import { IBoundLog } from './ILog';

export default interface IInteractionsHelper {
  lookupBoundingRect(
    mousePosition: IMousePosition,
  ): Promise<IRect & { elementTag?: string; nodeId?: number }>;
  startMouseupListener(
    nodeId: number,
    timeoutMs: number,
  ): Promise<{ onTriggered: Promise<IMouseUpResult> }>;
  startMouseoverListener(
    nodeId: number,
    timeoutMs: number,
  ): Promise<{ onTriggered: Promise<boolean> }>;
  mousePosition: IPoint;
  scrollOffset: Promise<IPoint>;
  viewport: IViewport;
  logger: IBoundLog;
}
