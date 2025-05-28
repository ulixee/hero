import { IPaintEvent } from '@ulixee/hero-core/models/DomChangesTable';
import DomNode from './DomNode';
import XPathGenerator from './XPathGenerator';
export default class DomRebuilder {
    readonly mainFrameIds: Set<number>;
    private domByFrameId;
    constructor(mainFrameIds: Set<number>);
    getXpathGenerator(frameId: number): XPathGenerator;
    apply(...paintEvents: IPaintEvent[]): void;
    getNode(frameId: number, nodeId: number): DomNode;
    getFrameNodes(frameId: number): DomNode[];
    getNodeStats(frameId?: number): IDomFrameContext['nodeCounts'];
    private clearStats;
    private updateStats;
    private clearHierarchyStats;
    private addHierarchyStats;
}
export interface IDomFrameContext {
    nodesById: INodesById;
    nodeCounts: {
        byClass: {
            [classname: string]: Set<DomNode>;
        };
        byId: {
            [id: string]: Set<DomNode>;
        };
    };
}
export interface INodesById {
    [nodeId: number]: DomNode;
}
