"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IDomChangeEvent_1 = require("@ulixee/hero-interfaces/IDomChangeEvent");
const DomNode_1 = require("./DomNode");
const XPathGenerator_1 = require("./XPathGenerator");
class DomRebuilder {
    constructor(mainFrameIds) {
        this.mainFrameIds = mainFrameIds;
        this.domByFrameId = {};
    }
    getXpathGenerator(frameId) {
        return new XPathGenerator_1.default(this.domByFrameId[frameId]);
    }
    apply(...paintEvents) {
        for (const paintEvent of paintEvents) {
            for (const change of paintEvent.changeEvents) {
                if (change.action === IDomChangeEvent_1.DomActionType.newDocument) {
                    // if main frame, clear the whole dom tree
                    if (this.mainFrameIds.has(change.frameId))
                        this.domByFrameId = {};
                    else
                        delete this.domByFrameId[change.frameId];
                    continue;
                }
                if (change.action === IDomChangeEvent_1.DomActionType.location)
                    continue;
                this.domByFrameId[change.frameId] ??= {
                    nodesById: {},
                    nodeCounts: { byId: {}, byClass: {} },
                };
                const { nodesById } = this.domByFrameId[change.frameId];
                nodesById[change.nodeId] ??= new DomNode_1.default(nodesById, change.nodeId);
                this.clearStats(change);
                nodesById[change.nodeId].apply(change);
                this.updateStats(change);
            }
        }
    }
    getNode(frameId, nodeId) {
        return this.domByFrameId[frameId].nodesById[nodeId];
    }
    getFrameNodes(frameId) {
        return Object.values(this.domByFrameId[frameId].nodesById);
    }
    getNodeStats(frameId) {
        frameId ??= [...this.mainFrameIds.values()][0];
        return this.domByFrameId[frameId].nodeCounts;
    }
    clearStats(change) {
        const { nodeCounts, nodesById } = this.domByFrameId[change.frameId];
        const node = nodesById[change.nodeId];
        const hasClassChange = change.action === IDomChangeEvent_1.DomActionType.attribute && change.attributes?.class;
        const hasIdChange = change.action === IDomChangeEvent_1.DomActionType.attribute && change.attributes?.id;
        if (node.id && (change.action === IDomChangeEvent_1.DomActionType.removed || hasIdChange)) {
            nodeCounts.byId[node.id]?.delete(node);
        }
        if (node.classes && (change.action === IDomChangeEvent_1.DomActionType.removed || hasClassChange)) {
            for (const className of node.classes) {
                nodeCounts.byClass[className]?.delete(node);
            }
        }
        // if removed, need to clear hierarchy
        if (change.action === IDomChangeEvent_1.DomActionType.removed && node.childNodeIds.length) {
            this.clearHierarchyStats(change.frameId, node);
        }
    }
    updateStats(change) {
        const { nodeCounts, nodesById } = this.domByFrameId[change.frameId];
        const node = nodesById[change.nodeId];
        const hasClassChange = change.action === IDomChangeEvent_1.DomActionType.attribute && change.attributes?.class;
        const hasIdChange = change.action === IDomChangeEvent_1.DomActionType.attribute && change.attributes?.id;
        if (node.id && (hasIdChange || change.action === IDomChangeEvent_1.DomActionType.added)) {
            nodeCounts.byId[node.id] ??= new Set();
            nodeCounts.byId[node.id].add(node);
        }
        if (node.classes && (hasClassChange || change.action === IDomChangeEvent_1.DomActionType.added)) {
            for (const classname of node.classes) {
                nodeCounts.byClass[classname] ??= new Set();
                nodeCounts.byClass[classname].add(node);
            }
        }
        // if added back a hierarchy, need to re-add hierarchy
        if (change.action === IDomChangeEvent_1.DomActionType.added && node.childNodeIds.length) {
            this.addHierarchyStats(change.frameId, node);
        }
    }
    clearHierarchyStats(frameId, node) {
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
    addHierarchyStats(frameId, node) {
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
exports.default = DomRebuilder;
//# sourceMappingURL=DomRebuilder.js.map