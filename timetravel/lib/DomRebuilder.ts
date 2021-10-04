import { DomActionType } from '@ulixee/hero-interfaces/IDomChangeEvent';
import { IDomChangeRecord, IPaintEvent } from '@ulixee/hero-core/models/DomChangesTable';
import DomNode from './DomNode';
import XPathGenerator from './XPathGenerator';

export default class DomRebuilder {
  private domByFrameId: { [frameId: number]: IDomFrameContext } = {};

  constructor(readonly mainFrameIds: Set<number>) {}

  public getXpathGenerator(frameId: number): XPathGenerator {
    return new XPathGenerator(this.domByFrameId[frameId]);
  }

  public apply(...paintEvents: IPaintEvent[]): void {
    for (const paintEvent of paintEvents) {
      for (const change of paintEvent.changeEvents) {
        if (change.action === DomActionType.newDocument) {
          // if main frame, clear the whole dom tree
          if (this.mainFrameIds.has(change.frameId)) this.domByFrameId = {};
          else delete this.domByFrameId[change.frameId];
          continue;
        }
        if (change.action === DomActionType.location) continue;

        this.domByFrameId[change.frameId] ??= {
          nodesById: {},
          nodeCounts: { byId: {}, byClass: {} },
        };

        const { nodesById } = this.domByFrameId[change.frameId];

        nodesById[change.nodeId] ??= new DomNode(nodesById, change.nodeId);

        this.clearStats(change);
        nodesById[change.nodeId].apply(change);
        this.updateStats(change);
      }
    }
  }

  public getNode(frameId: number, nodeId: number): DomNode {
    return this.domByFrameId[frameId].nodesById[nodeId];
  }

  public getFrameNodes(frameId: number): DomNode[] {
    return Object.values(this.domByFrameId[frameId].nodesById);
  }

  public getNodeStats(frameId?: number): IDomFrameContext['nodeCounts'] {
    frameId ??= [...this.mainFrameIds.values()][0];
    return this.domByFrameId[frameId].nodeCounts;
  }

  private clearStats(change: IDomChangeRecord): void {
    const { nodeCounts, nodesById } = this.domByFrameId[change.frameId];
    const node = nodesById[change.nodeId];
    const hasClassChange = change.action === DomActionType.attribute && change.attributes?.class;
    const hasIdChange = change.action === DomActionType.attribute && change.attributes?.id;

    if (node.id && (change.action === DomActionType.removed || hasIdChange)) {
      nodeCounts.byId[node.id]?.delete(node);
    }

    if (node.classes && (change.action === DomActionType.removed || hasClassChange)) {
      for (const className of node.classes) {
        nodeCounts.byClass[className]?.delete(node);
      }
    }

    // if removed, need to clear hierarchy
    if (change.action === DomActionType.removed && node.childNodeIds.length) {
      this.clearHierarchyStats(change.frameId, node);
    }
  }

  private updateStats(change: IDomChangeRecord): void {
    const { nodeCounts, nodesById } = this.domByFrameId[change.frameId];
    const node = nodesById[change.nodeId];
    const hasClassChange = change.action === DomActionType.attribute && change.attributes?.class;
    const hasIdChange = change.action === DomActionType.attribute && change.attributes?.id;

    if (node.id && (hasIdChange || change.action === DomActionType.added)) {
      nodeCounts.byId[node.id] ??= new Set();
      nodeCounts.byId[node.id].add(node);
    }
    if (node.classes && (hasClassChange || change.action === DomActionType.added)) {
      for (const classname of node.classes) {
        nodeCounts.byClass[classname] ??= new Set();
        nodeCounts.byClass[classname].add(node);
      }
    }
    // if added back a hierarchy, need to re-add hierarchy
    if (change.action === DomActionType.added && node.childNodeIds.length) {
      this.addHierarchyStats(change.frameId, node);
    }
  }

  private clearHierarchyStats(frameId: number, node: DomNode): void {
    const { nodeCounts } = this.domByFrameId[frameId];
    if (node.classes) {
      for (const className of node.classes) {
        nodeCounts.byClass[className]?.delete(node);
      }
    }
    nodeCounts.byId[node.id]?.delete(node);
    for (const child of node.children) {
      this.clearHierarchyStats(frameId, child);
    }
  }

  private addHierarchyStats(frameId: number, node: DomNode): void {
    const { nodeCounts } = this.domByFrameId[frameId];
    if (node.classes) {
      for (const classname of node.classes) {
        nodeCounts.byClass[classname] ??= new Set();
        nodeCounts.byClass[classname].add(node);
      }
    }
    if (node.id) {
      nodeCounts.byId[node.id] ??= new Set();
      nodeCounts.byId[node.id].add(node);
    }
    for (const child of node.children) {
      this.addHierarchyStats(frameId, child);
    }
  }
}

export interface IDomFrameContext {
  nodesById: INodesById;
  nodeCounts: {
    byClass: { [classname: string]: Set<DomNode> };
    byId: { [id: string]: Set<DomNode> };
  };
}

export interface INodesById {
  [nodeId: number]: DomNode;
}
