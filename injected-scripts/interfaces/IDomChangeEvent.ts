// tslint:disable-next-line
import type { CommandId, ISOTimestamp } from './GenericTypes';

export type IDomChangeEvent = [
  CommandId,
  'newDocument' | 'shadowRootAttached' | 'location' | 'added' | 'removed' | 'text' | 'attribute' | 'property',
  INodeData,
  ISOTimestamp,
];

export interface INodeData {
  id: number;
  nodeType?: number;
  textContent?: string;
  tagName?: string;
  namespaceUri?: string;
  previousSiblingId?: number;
  parentNodeId?: number;
  attributes?: { [key: string]: string };
  attributeNamespaces?: { [key: string]: string };
  properties?: { [key: string]: string | boolean | number };
}
