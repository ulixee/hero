interface IStaticNodeTracker {
    has(node: Node): boolean;
    getNodeId(node: Node): number | undefined;
    getWatchedNodeWithId(id: number, throwIfFound?: boolean): Node;
    watchNode(node: Node): number | undefined;
    track(node: Node): number;
    restore(id: number, node: Node): void;
}
declare global {
    interface Window {
        NodeTracker: IStaticNodeTracker;
    }
    let NodeTracker: IStaticNodeTracker;
}
export {};
