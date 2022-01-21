// tslint:disable-next-line
import type { UnixTimestamp } from './GenericTypes';

type Idx = number;

export type IDomChangeEvent = [DomActionType, INodeData, UnixTimestamp, Idx];

export enum DomActionType {
  newDocument = 0,
  location = 1,
  added = 2,
  removed = 3,
  text = 4,
  attribute = 5,
  property = 6,
}

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

export interface IFrontendDomChangeEvent extends Omit<INodeData, 'id'> {
  nodeId: number;
  eventIndex: number;
  action: DomActionType;
  previousPreviousSiblingId?: number;
  previousParentNodeId?: number;
  previousTextContent?: string;
  previousAttributes?: { [key: string]: string };
  previousProperties?: { [key: string]: string | boolean | number | string[] };
  frameIdPath?: string;
}
