"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
function NodeTrackerStatics(staticClass) { }
let NodeTracker = class NodeTracker {
    static has(node) {
        return !!node[this.nodeIdSymbol];
    }
    static getNodeId(node) {
        if (!node)
            return undefined;
        return node[this.nodeIdSymbol] ?? undefined;
    }
    static watchNode(node) {
        let id = this.getNodeId(node);
        if (!id) {
            // extract so we detect any nodes that haven't been extracted yet. Ie, called from jsPath
            if ('extractDomChanges' in window) {
                window.extractDomChanges();
            }
            if (!this.has(node) && 'trackElement' in window) {
                window.trackElement(node);
            }
            id = this.track(node);
        }
        this.watchedNodesById.set(id, node);
        return id;
    }
    static track(node) {
        if (!node)
            return;
        if (node[this.nodeIdSymbol]) {
            return node[this.nodeIdSymbol];
        }
        const id = this.nextId;
        this.nextId += 1;
        node[this.nodeIdSymbol] = id;
        return id;
    }
    static getWatchedNodeWithId(id, throwIfNotFound = true) {
        if (this.watchedNodesById.has(id)) {
            return this.watchedNodesById.get(id);
        }
        if (throwIfNotFound)
            throw new Error(`Node with id not found -> ${id}`);
    }
    static restore(id, node) {
        node[this.nodeIdSymbol] = id;
        this.watchedNodesById.set(id, node);
        if (id > this.nextId)
            this.nextId = id + 1;
    }
};
NodeTracker.nodeIdSymbol = Symbol.for('heroNodeId');
NodeTracker.nextId = 1;
NodeTracker.watchedNodesById = new Map();
NodeTracker = __decorate([
    NodeTrackerStatics
], NodeTracker);
window.NodeTracker = NodeTracker;
//# sourceMappingURL=NodeTracker.js.map