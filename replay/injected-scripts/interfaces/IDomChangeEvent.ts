// tslint:disable-next-line
import type { CommandId, ISOTimestamp } from './GenericTypes';

export type IDomChangeEvent = [
  CommandId,
  'newDocument' | 'added' | 'removed' | 'text' | 'attribute' | 'property',
  INodeData,
  ISOTimestamp,
];

export interface INodeData {
  id: number;
  nodeType?: number;
  textContent?: string;
  tagName?: string;
  previousSiblingId?: number;
  parentNodeId?: number;
  attributes?: { [key: string]: string };
  properties?: { [key: string]: string | boolean | number };
}
