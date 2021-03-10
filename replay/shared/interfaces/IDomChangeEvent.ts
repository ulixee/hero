export interface IDomChangeEvent {
  nodeId: number;
  tabId: number;
  eventIndex: number;
  action: 'newDocument' | 'location' | 'added' | 'removed' | 'text' | 'attribute' | 'property';
  timestamp: string;
  frameIdPath?: string;
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
