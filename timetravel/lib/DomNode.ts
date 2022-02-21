import { DomActionType } from '@ulixee/hero-interfaces/IDomChangeEvent';
import { IDomChangeRecord } from '@ulixee/hero-core/models/DomChangesTable';
import { INodesById } from './DomRebuilder';

export default class DomNode {
  #textContent: string;
  #isConnectedToHierarchy = false;

  parentNodeId: number;
  previousSiblingId: number;
  childNodeIds: number[] = [];
  tagName: string;
  classes: Set<string>;
  id: string;
  attributes: { [name: string]: string } = {};
  properties: { [name: string]: string } = {};
  nodeType: NodeType;
  changes: IDomChangeRecord[] = [];

  get isConnected(): boolean {
    if (this.#isConnectedToHierarchy === false) return false;
    if (!this.parentNode) {
      return this.nodeType === NodeType.Document || this.nodeType === NodeType.DocumentType;
    }
    return this.parentNode.isConnected;
  }

  get parentNode(): DomNode {
    return this.nodesById[this.parentNodeId];
  }

  get parentElement(): DomNode {
    let element = this.parentNode;
    while (element) {
      if (element.nodeType === NodeType.Element) return element;
      element = element.parentNode;
    }
    return null;
  }

  get textContent(): string {
    if (this.nodeType === NodeType.Element) {
      return this.children.map(x => x.textContent).join('\n');
    }
    return this.#textContent;
  }

  get children(): DomNode[] {
    return this.childNodeIds.map(x => this.nodesById[x]).filter(Boolean);
  }

  constructor(private nodesById: INodesById, readonly nodeId: number) {}

  apply(change: IDomChangeRecord): void {
    this.changes.push(change);

    if (change.tagName) this.tagName = change.tagName;
    if (change.nodeType) this.nodeType = change.nodeType;
    if (change.textContent) this.#textContent = change.textContent;

    if (change.attributes) {
      for (const [key, value] of Object.entries(change.attributes)) {
        if (key === 'id') this.id = value;
        if (key === 'class') this.classes = new Set((value ?? '').split(' '));

        this.attributes[key] = value;
      }
    }
    if (change.properties) {
      for (const [key, value] of Object.entries(change.properties)) {
        this.properties[key] = value;
      }
    }

    if (change.parentNodeId) {
      this.parentNodeId = change.parentNodeId;
    }

    if (change.previousSiblingId) {
      this.previousSiblingId = change.previousSiblingId;
    }

    if (change.action === DomActionType.removed) {
      const prevIndex = this.parentNode.childNodeIds.indexOf(this.nodeId);
      if (prevIndex !== -1) {
        this.parentNode.childNodeIds.splice(prevIndex, 1);
      }
      this.#isConnectedToHierarchy = false;
    }

    if (change.action === DomActionType.added) {
      this.#isConnectedToHierarchy = true;
      if (this.parentNodeId) {
        const prevIndex = this.parentNode.childNodeIds.indexOf(change.previousSiblingId) + 1;
        this.parentNode.childNodeIds.splice(prevIndex, 0, this.nodeId);
      }
    }
  }
}

export enum NodeType {
  Element = 1,
  Text = 3,
  Comment = 8,
  Document = 9,
  DocumentType = 10,
  ShadowRoot = 40,
}
