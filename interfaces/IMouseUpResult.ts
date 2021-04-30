import { INodeVisibility } from './INodeVisibility';

export default interface IMouseUpResult {
  pageX: number;
  pageY: number;
  targetNodeId: number;
  relatedTargetNodeId: number;
  didClickLocation: boolean;
  targetNodePreview?: string;
  expectedNodePreview?: string;
  expectedNodeVisibility?: INodeVisibility;
}
