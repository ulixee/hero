import IElementRect from './IElementRect';
export default interface INodeVisibility {
    isVisible: boolean;
    isClickable: boolean;
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
    obstructedByElementRect?: IElementRect;
    isUnobstructedByOtherElements?: boolean;
    boundingClientRect?: IElementRect;
}
