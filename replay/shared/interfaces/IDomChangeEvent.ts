export interface IDomChangeEvent {
  nodeId: number;
  tabId:string;
  action: 'newDocument' | 'shadowRootAttached' | 'location' | 'added' | 'removed' | 'text' | 'attribute' | 'property';
  timestamp: string;
  isMainFrame: boolean;
  commandId: number;
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
