import { INodeVisibility } from '@ulixee/js-path';
export default interface IMouseResult {
    pageX: number;
    pageY: number;
    targetNodeId: number;
    relatedTargetNodeId: number;
    didClickLocation: boolean;
    targetNodePreview?: string;
    expectedNodePreview?: string;
    expectedNodeVisibility?: INodeVisibility;
    didStartInteractWithPaintingStable?: boolean;
}
