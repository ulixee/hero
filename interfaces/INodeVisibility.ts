import IElementRect from './IElementRect';

export interface INodeVisibility {
  isVisible?: boolean;
  nodeExists?: boolean;
  isOnscreenVertical?: boolean;
  isOnscreenHorizontal?: boolean;
  hasContainingElement?: boolean;
  isConnected?: boolean;
  hasCssOpacity?: boolean;
  hasCssDisplay?: boolean;
  hasCssVisibility?: boolean;
  hasDimensions?: boolean;
  obstructedByElementId?: number;
  isUnobstructedByOtherElements?: boolean;
  boundingClientRect?: IElementRect;
}
