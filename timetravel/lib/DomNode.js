"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _DomNode_textContent, _DomNode_isConnectedToHierarchy;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeType = void 0;
const IDomChangeEvent_1 = require("@ulixee/hero-interfaces/IDomChangeEvent");
class DomNode {
    get isConnected() {
        if (__classPrivateFieldGet(this, _DomNode_isConnectedToHierarchy, "f") === false)
            return false;
        if (!this.parentNode) {
            return this.nodeType === NodeType.Document || this.nodeType === NodeType.DocumentType;
        }
        return this.parentNode.isConnected;
    }
    get parentNode() {
        return this.nodesById[this.parentNodeId];
    }
    get parentElement() {
        let element = this.parentNode;
        while (element) {
            if (element.nodeType === NodeType.Element)
                return element;
            element = element.parentNode;
        }
        return null;
    }
    get textContent() {
        if (this.nodeType === NodeType.Element) {
            return this.children.map(x => x.textContent).join('\n');
        }
        return __classPrivateFieldGet(this, _DomNode_textContent, "f");
    }
    get children() {
        return this.childNodeIds.map(x => this.nodesById[x]).filter(Boolean);
    }
    constructor(nodesById, nodeId) {
        this.nodesById = nodesById;
        this.nodeId = nodeId;
        _DomNode_textContent.set(this, void 0);
        _DomNode_isConnectedToHierarchy.set(this, false);
        this.childNodeIds = [];
        this.attributes = {};
        this.properties = {};
        this.changes = [];
    }
    apply(change) {
        this.changes.push(change);
        if (change.tagName)
            this.tagName = change.tagName;
        if (change.nodeType)
            this.nodeType = change.nodeType;
        if (change.textContent)
            __classPrivateFieldSet(this, _DomNode_textContent, change.textContent, "f");
        if (change.attributes) {
            for (const [key, value] of Object.entries(change.attributes)) {
                if (key === 'id')
                    this.id = value;
                if (key === 'class')
                    this.classes = new Set((value ?? '').split(' '));
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
        if (change.action === IDomChangeEvent_1.DomActionType.removed) {
            const prevIndex = this.parentNode.childNodeIds.indexOf(this.nodeId);
            if (prevIndex !== -1) {
                this.parentNode.childNodeIds.splice(prevIndex, 1);
            }
            __classPrivateFieldSet(this, _DomNode_isConnectedToHierarchy, false, "f");
        }
        if (change.action === IDomChangeEvent_1.DomActionType.added) {
            __classPrivateFieldSet(this, _DomNode_isConnectedToHierarchy, true, "f");
            if (this.parentNodeId) {
                const prevIndex = this.parentNode.childNodeIds.indexOf(change.previousSiblingId) + 1;
                this.parentNode.childNodeIds.splice(prevIndex, 0, this.nodeId);
            }
        }
    }
}
_DomNode_textContent = new WeakMap(), _DomNode_isConnectedToHierarchy = new WeakMap();
exports.default = DomNode;
var NodeType;
(function (NodeType) {
    NodeType[NodeType["Element"] = 1] = "Element";
    NodeType[NodeType["Text"] = 3] = "Text";
    NodeType[NodeType["Comment"] = 8] = "Comment";
    NodeType[NodeType["Document"] = 9] = "Document";
    NodeType[NodeType["DocumentType"] = 10] = "DocumentType";
    NodeType[NodeType["ShadowRoot"] = 40] = "ShadowRoot";
})(NodeType || (exports.NodeType = NodeType = {}));
//# sourceMappingURL=DomNode.js.map