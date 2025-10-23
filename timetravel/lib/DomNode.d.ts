import { IDomChangeRecord } from '@ulixee/hero-core/models/DomChangesTable';
import { INodesById } from './DomRebuilder';
export default class DomNode {
    #private;
    private nodesById;
    readonly nodeId: number;
    parentNodeId: number;
    previousSiblingId: number;
    childNodeIds: number[];
    tagName: string;
    classes: Set<string>;
    id: string;
    attributes: {
        [name: string]: string;
    };
    properties: {
        [name: string]: string;
    };
    nodeType: NodeType;
    changes: IDomChangeRecord[];
    get isConnected(): boolean;
    get parentNode(): DomNode;
    get parentElement(): DomNode;
    get textContent(): string;
    get children(): DomNode[];
    constructor(nodesById: INodesById, nodeId: number);
    apply(change: IDomChangeRecord): void;
}
export declare enum NodeType {
    Element = 1,
    Text = 3,
    Comment = 8,
    Document = 9,
    DocumentType = 10,
    ShadowRoot = 40
}
