import { INodeVisibility } from './INodeVisibility';

export default interface IElementRect {
  y: number;
  x: number;
  height: number;
  width: number;
  tag: string;
  nodeVisibility?: INodeVisibility;
}
