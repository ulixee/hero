"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// copied since we can't import data types
var DomActionType;
(function (DomActionType) {
    DomActionType[DomActionType["newDocument"] = 0] = "newDocument";
    DomActionType[DomActionType["location"] = 1] = "location";
    DomActionType[DomActionType["added"] = 2] = "added";
    DomActionType[DomActionType["removed"] = 3] = "removed";
    DomActionType[DomActionType["text"] = 4] = "text";
    DomActionType[DomActionType["attribute"] = 5] = "attribute";
    DomActionType[DomActionType["property"] = 6] = "property";
})(DomActionType || (DomActionType = {}));
const preserveElements = new Set(['HTML', 'HEAD', 'BODY']);
class DomActions {
    static replayDomEvent(event, isReverse = false) {
        let { action } = event;
        if (action === DomActionType.newDocument)
            return this.onNewDocument(event);
        if (action === DomActionType.location)
            return this.onLocation(event, isReverse);
        if (isReverse) {
            if (action === DomActionType.added)
                action = DomActionType.removed;
            else if (action === DomActionType.removed)
                action = DomActionType.added;
        }
        if (this.isPreservedElement(event, isReverse))
            return;
        let node;
        let parentNode;
        try {
            parentNode = this.getNode(isReverse ? event.previousParentNodeId : event.parentNodeId);
            node = this.deserializeNode(event, parentNode, isReverse);
            if (action === DomActionType.added)
                this.onNodeAdded(node, parentNode, event, isReverse);
            if (action === DomActionType.removed)
                this.onNodeRemoved(node, parentNode, event, isReverse);
            if (action === DomActionType.attribute)
                this.setNodeAttributes(node, event, isReverse);
            if (action === DomActionType.property)
                this.setNodeProperties(node, event, isReverse);
            if (action === DomActionType.text)
                node.textContent = event.textContent;
            if (node instanceof HTMLIFrameElement || node instanceof HTMLFrameElement) {
                this.onFrameModified(node, event);
            }
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.error('ERROR: applying action', error, { parentNode, node, event });
        }
    }
    static getNode(id) {
        if (id === null || id === undefined)
            return null;
        return NodeTracker.getWatchedNodeWithId(id, false);
    }
    static isNavigation(action) {
        return action === DomActionType.location || action === DomActionType.newDocument;
    }
    static onFrameModified(node, event) {
        for (const cb of this.onFrameModifiedCallbacks) {
            cb(node, event);
        }
    }
    static isPreservedElement(event, isReverse) {
        const { nodeId, nodeType } = event;
        if (nodeId && nodeType === document.DOCUMENT_NODE) {
            NodeTracker.restore(nodeId, document);
            return true;
        }
        if (nodeId && nodeType === document.DOCUMENT_TYPE_NODE) {
            NodeTracker.restore(nodeId, document.doctype);
            return true;
        }
        let tagName = event.tagName;
        if (!tagName) {
            const existing = this.getNode(nodeId);
            // if we're reversing, we can end up with the existing node as the nodeId
            if (existing) {
                if (existing === document || existing === document.doctype)
                    return true;
                tagName = existing.tagName;
            }
        }
        if (!preserveElements.has(tagName))
            return false;
        const elem = document.querySelector(tagName);
        if (!elem) {
            debugLog('Preserved element doesnt exist!', tagName);
            return true;
        }
        let action = event.action;
        if (isReverse) {
            if (action === DomActionType.removed)
                action = DomActionType.added;
            else if (action === DomActionType.added)
                action = DomActionType.removed;
        }
        NodeTracker.restore(nodeId, elem);
        if (action === DomActionType.removed) {
            elem.innerHTML = '';
            for (const attr of elem.attributes) {
                elem.removeAttributeNS(attr.name, attr.namespaceURI);
                elem.removeAttribute(attr.name);
            }
            debugLog('WARN: script trying to remove preserved node', event, elem);
            return true;
        }
        if (action === DomActionType.added) {
            elem.innerHTML = '';
            if (elem.tagName === 'BODY' && 'reattachUI' in window) {
                window.reattachUI();
            }
        }
        if (event.attributes) {
            this.setNodeAttributes(elem, event, isReverse);
        }
        if (event.properties) {
            this.setNodeProperties(elem, event, isReverse);
        }
        return true;
    }
    static onNodeAdded(node, parentNode, event, isReverse) {
        if (!isReverse)
            this.trackPreviousState(node, event);
        if (!parentNode) {
            debugLog('WARN: parent node id not found', event);
            return;
        }
        const previousSiblingId = isReverse ? event.previousPreviousSiblingId : event.previousSiblingId;
        if (!previousSiblingId) {
            parentNode.prepend(node);
        }
        else {
            const previous = this.getNode(previousSiblingId);
            if (previous) {
                const next = previous.nextSibling;
                parentNode.insertBefore(node, next ?? null);
            }
        }
    }
    static trackPreviousState(node, event) {
        if (node.isConnected) {
            event.previousParentNodeId = node.parentNode ? NodeTracker.getNodeId(node.parentNode) : null;
            event.previousPreviousSiblingId = node.previousSibling
                ? NodeTracker.getNodeId(node.previousSibling)
                : null;
        }
    }
    static onNodeRemoved(node, parentNode, event, isReverse) {
        if (!isReverse)
            this.trackPreviousState(node, event);
        if (!parentNode && isReverse) {
            node.parentNode.removeChild(node);
            return;
        }
        if (!parentNode) {
            debugLog('WARN: parent node id not found', event);
            return;
        }
        if (parentNode.contains(node))
            parentNode.removeChild(node);
        if (isReverse && parentNode) {
            if (!event.previousPreviousSiblingId) {
                parentNode.prepend(node);
            }
            else {
                const previousNode = NodeTracker.getWatchedNodeWithId(event.previousPreviousSiblingId, false);
                parentNode.insertBefore(node, previousNode?.nextSibling ?? null);
            }
        }
    }
    static onNewDocument(event) {
        const { textContent } = event;
        const href = textContent;
        if (!window.isMainFrame) {
            debugLog('Location: (new document) %s, frame: %s, idx: %s', href, event.frameIdPath, event.eventIndex);
            if (window.location.href !== href) {
                window.location.href = href;
            }
            return;
        }
        window.scrollTo({ top: 0 });
    }
    static onLocation(event, usePrevious = false) {
        debugLog('Location: href=%s', event.textContent);
        if (!usePrevious) {
            event.previousLocation = window.location.href;
        }
        const url = usePrevious ? event.previousLocation : event.textContent;
        window.history.replaceState({}, 'TimeTravel', url);
    }
    static setNodeAttributes(node, data, usePrevious = false) {
        const attributes = usePrevious ? data.previousAttributes : data.attributes;
        if (!attributes)
            return;
        const namespaces = data.attributeNamespaces;
        const loadPrevious = !usePrevious && !data.previousAttributes;
        if (loadPrevious)
            data.previousAttributes ??= {};
        for (const [name, value] of Object.entries(attributes)) {
            const ns = namespaces ? namespaces[name] : null;
            try {
                if (loadPrevious)
                    data.previousAttributes[name] = ns
                        ? node.getAttributeNS(ns, name)
                        : node.getAttribute(name);
                if (name === 'xmlns' || name.startsWith('xmlns') || node.tagName === 'HTML' || !ns) {
                    if (value === null)
                        node.removeAttribute(name);
                    else
                        node.setAttribute(name, value);
                }
                else if (value === null) {
                    node.removeAttributeNS(ns || null, name);
                }
                else {
                    node.setAttributeNS(ns || null, name, value);
                }
            }
            catch (err) {
                if (!err.toString().includes('not a valid attribute name') &&
                    !err.toString().includes('qualified name'))
                    throw err;
            }
        }
    }
    static setNodeProperties(node, data, usePrevious = false) {
        const properties = usePrevious ? data.previousProperties : data.properties;
        if (!properties)
            return;
        const getPrevious = !usePrevious && !data.previousProperties;
        data.previousProperties ??= {};
        for (const [name, value] of Object.entries(properties)) {
            if (name === 'sheet.cssRules') {
                const sheet = node.sheet;
                const newRules = value;
                if (getPrevious)
                    data.previousProperties[name] = [];
                let i = 0;
                for (i = 0; i < sheet.cssRules.length; i += 1) {
                    const newRule = newRules[i];
                    const currentRule = sheet.cssRules[i].cssText;
                    if (getPrevious)
                        data.previousProperties[name].push(currentRule);
                    if (newRule !== currentRule) {
                        sheet.deleteRule(i);
                        if (newRule)
                            sheet.insertRule(newRule, i);
                    }
                }
                for (; i < newRules.length; i += 1) {
                    sheet.insertRule(newRules[i], i);
                }
            }
            else {
                if (getPrevious)
                    data.previousProperties[name] = node[name];
                node[name] = value;
            }
        }
    }
    static deserializeNode(data, parent, isReverse) {
        if (data === null)
            return null;
        let node = this.getNode(data.nodeId);
        if (node) {
            if (isReverse)
                return node;
            this.setNodeProperties(node, data);
            this.setNodeAttributes(node, data);
            if (data.textContent)
                node.textContent = data.textContent;
            return node;
        }
        const SHADOW_NODE_TYPE = 40;
        if (parent && typeof parent.attachShadow === 'function' && data.nodeType === SHADOW_NODE_TYPE) {
            // NOTE: we just make all shadows open in replay
            if (isReverse) {
                node = parent.shadowRoot;
            }
            else {
                node = parent.attachShadow({ mode: 'open' });
                NodeTracker.restore(data.nodeId, node);
            }
            return node;
        }
        if (data.nodeType === Node.COMMENT_NODE) {
            node = document.createComment(data.textContent);
        }
        else if (data.nodeType === Node.TEXT_NODE) {
            node = document.createTextNode(data.textContent);
        }
        else if (data.nodeType === Node.ELEMENT_NODE) {
            if (data.namespaceUri) {
                node = document.createElementNS(data.namespaceUri, data.tagName);
            }
            else {
                node = document.createElement(data.tagName);
            }
            if (data.tagName === 'NOSCRIPT' &&
                'CSSStyleSheet' in window &&
                'adoptedStyleSheets' in document) {
                const sheet = new CSSStyleSheet();
                // @ts-ignore
                sheet.replaceSync(`noscript { display:none !important; }
     noscript * { display:none !important; }`);
                // @ts-ignore
                document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
            }
            this.setNodeAttributes(node, data);
            this.setNodeProperties(node, data);
            if (data.textContent) {
                node.textContent = data.textContent;
            }
        }
        if (!node)
            throw new Error(`Unable to translate node! {nodeType: ${data.nodeType}}`);
        NodeTracker.restore(data.nodeId, node);
        return node;
    }
}
DomActions.onFrameModifiedCallbacks = [];
window.DomActions = DomActions;
window.getNodeById = DomActions.getNode;
//# sourceMappingURL=DomActions.js.map