export default interface IPaintEvent {
  timestamp: string;
  commandId: number;
  urlOrigin: string;
  changeEvents: IDomChangeEvent[];
}

type CommandId = number;
type ISOTimestamp = string;

type IDomChangeEvent = [
  CommandId,
  'newDocument' | 'added' | 'removed' | 'text' | 'attribute' | 'property',
  INodeData,
  ISOTimestamp,
];

interface INodeData {
  id: number;
  nodeType?: number;
  textContent?: string;
  tagName?: string;
  previousSiblingId?: number;
  parentNodeId?: number;
  attributes?: { [key: string]: string };
  properties?: { [key: string]: string | boolean | number };
}
