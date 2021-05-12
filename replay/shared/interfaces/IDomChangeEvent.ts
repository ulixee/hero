export interface IDomChangeEvent {
  nodeId: number;
  tabId: number;
  eventIndex: number;
  action: DomActionType;
  timestamp: number;
  frameIdPath: string;
  commandId: number;
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

export type IFrontendDomChangeEvent = Omit<IDomChangeEvent, 'tabId' | 'commandId'>;

// NOTE: copied from interfaces
export enum DomActionType {
  newDocument = 0,
  location = 1,
  added = 2,
  removed = 3,
  text = 4,
  attribute = 5,
  property = 6,
}
