// tslint:disable-next-line
import type { UnixTimestamp } from './GenericTypes';

type Idx = number;

export type IDomChangeEvent = [
  'newDocument' | 'location' | 'added' | 'removed' | 'text' | 'attribute' | 'property',
  INodeData,
  UnixTimestamp,
  Idx,
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
  properties?: { [key: string]: string | boolean | number | string[] };
}
