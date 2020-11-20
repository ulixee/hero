import { IMousePosition } from './IInteractions';
import IRect from './IRect';
import IPoint from './IPoint';
import IViewport from './IViewport';

export default interface IInteractionsHelper {
  lookupBoundingRect(mousePosition: IMousePosition): Promise<IRect & { elementTag?: string }>;
  mousePosition: IPoint;
  scrollOffset: Promise<IPoint>;
  viewport: IViewport;
}
