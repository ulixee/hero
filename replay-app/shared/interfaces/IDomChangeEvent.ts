export interface IDomChangeEvent {
  nodeId: number;
  action: 'newDocument' | 'location' | 'added' | 'removed' | 'text' | 'attribute' | 'property';
  timestamp: string;
  isMainFrame: boolean;
  commandId: number;
  nodeType?: number;
  textContent?: string;
  tagName?: string;
  previousSiblingId?: number;
  parentNodeId?: number;
  attributes?: { [key: string]: string };
  properties?: { [key: string]: string | boolean | number };
}
