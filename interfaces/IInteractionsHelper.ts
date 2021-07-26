import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import type IMouseUpResult from './IMouseUpResult';
import { IMousePosition } from './IInteractions';
import IRect from './IRect';
import IPoint from './IPoint';
import IViewport from './IViewport';
import { INodeVisibility } from './INodeVisibility';

export default interface IInteractionsHelper {
  lookupBoundingRect(
    mousePosition: IMousePosition,
    throwIfNotPresent?: boolean,
    includeNodeVisibility?: boolean,
  ): Promise<
    IRect & {
      elementTag?: string;
      nodeId?: number;
      nodeVisibility?: INodeVisibility;
    }
  >;
  createMouseupTrigger(
    nodeId: number,
  ): Promise<{
    didTrigger: (mousePosition: IMousePosition, throwOnFail?: boolean) => Promise<IMouseUpResult>;
  }>;
  createMouseoverTrigger(nodeId: number): Promise<{ didTrigger: () => Promise<boolean> }>;
  mousePosition: IPoint;
  scrollOffset: Promise<IPoint>;
  viewport: IViewport;
  logger: IBoundLog;
}
