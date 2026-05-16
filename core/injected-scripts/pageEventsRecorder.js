"use strict";
// NOTE: do not use node dependencies
Object.defineProperty(exports, "__esModule", { value: true });
const eventsCallback = callback.bind(null, callbackName);
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
const MutationRecordType = {
    attributes: 'attributes',
    childList: 'childList',
    characterData: 'characterData',
};
const SHADOW_NODE_TYPE = 40;
const hiddenTags = new Set([
    'STYLE',
    'SCRIPT',
    'FRAME',
    'IFRAME',
    'META',
    'LINK',
    'BODY',
    'HEAD',
    'TITLE',
]);
let lastUploadDate;
function upload(records) {
    try {
        if (!records.some(x => x.length)) {
            return;
        }
        eventsCallback(JSON.stringify(records));
        lastUploadDate = Date.now();
        return true;
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.log(`ERROR calling page recorder callback: ${String(err)}`, err);
    }
    return false;
}
let eventCounter = 0;
function idx() {
    return (eventCounter += 1);
}
let isStarted = false;
class PageEventsRecorder {
    constructor() {
        this.domChanges = [];
        this.mouseEvents = [];
        this.focusEvents = [];
        this.scrollEvents = [];
        this.loadEvents = [];
        this.doNotTrackElementsById = new Map();
        this.nodeIdToParentNodeId = {};
        this.location = window.self.location.href;
        this.isListeningForInteractionEvents = false;
        this.elementsToTrack = new WeakSet();
        this.propertyTrackingElements = new Map();
        this.stylesheets = new Map();
        this.didSerializeDocument = false;
        this.observer = new MutationObserver(this.onMutation.bind(this));
        if (document) {
            // preload with a document
            const newDocument = {
                id: -1,
                textContent: this.location,
            };
            const stamp = Date.now();
            this.pushChange(DomActionType.newDocument, newDocument, stamp);
            this.pushChange(DomActionType.added, this.serializeNode(document), stamp);
            this.serializeDocument(stamp);
            this.uploadChanges();
        }
    }
    start() {
        if (isStarted) {
            return;
        }
        isStarted = true;
        const stamp = Date.now();
        if (!this.didSerializeDocument) {
            // preload with a document
            this.pushChange(DomActionType.newDocument, {
                id: -1,
                textContent: this.location,
            }, stamp);
        }
        this.serializeDocument(stamp);
        this.observer.observe(document, {
            attributes: true,
            childList: true,
            subtree: true,
            characterData: true,
        });
        this.uploadChanges();
    }
    trackElement(element) {
        this.elementsToTrack.add(element);
    }
    doNotTrackElement(element) {
        const nodeId = NodeTracker.track(element);
        this.doNotTrackElementsById.set(nodeId, element);
    }
    extractChanges() {
        this.convertMutationsToChanges(this.observer.takeRecords());
        return this.pageResultset;
    }
    flushAndReturnLists(id) {
        const changes = recorder.extractChanges();
        recorder.resetLists();
        changes.push(id);
        upload(changes);
    }
    trackFocus(eventType, focusEvent) {
        const nodeId = NodeTracker.getNodeId(focusEvent.target);
        const relatedNodeId = NodeTracker.getNodeId(focusEvent.relatedTarget);
        const time = Date.now();
        const event = [eventType, nodeId, relatedNodeId, time];
        this.focusEvents.push(event);
        this.getPropertyChanges(time);
    }
    trackMouse(eventType, mouseEvent) {
        const nodeId = NodeTracker.getNodeId(mouseEvent.target);
        const relatedNodeId = NodeTracker.getNodeId(mouseEvent.relatedTarget);
        const event = [
            eventType,
            mouseEvent.pageX,
            mouseEvent.pageY,
            // might not want to do this - causes reflow
            mouseEvent.offsetX,
            mouseEvent.offsetY,
            mouseEvent.buttons,
            nodeId,
            relatedNodeId,
            Date.now(),
        ];
        this.mouseEvents.push(event);
        if ('replayInteractions' in window) {
            const [, pageX, pageY, offsetX, offsetY, buttons] = event;
            window.replayInteractions(undefined, {
                buttons,
                frameIdPath: '',
                offsetX,
                pageX,
                pageY,
                offsetY,
                targetNodeId: nodeId,
            });
        }
    }
    trackScroll(scrollX, scrollY) {
        this.scrollEvents.push([scrollX, scrollY, Date.now()]);
    }
    onLoadEvent(name, timestamp) {
        this.start();
        this.loadEvents.push([name, window.self.location.href, timestamp]);
        this.uploadChanges();
    }
    checkForAllPropertyChanges() {
        this.getPropertyChanges(Date.now());
    }
    checkForShadowRoot(path) {
        const timestamp = Date.now();
        const buildMap = new Map();
        let element = document.body;
        for (let i = 0; i < path.length; i += 1) {
            const { localName, index, id, hasShadowHost } = path[i];
            if (localName === 'body')
                continue;
            let queryBody = element;
            if (hasShadowHost) {
                queryBody = element.shadowRoot;
                if (!queryBody) {
                    return;
                }
                // make sure we're watching this
                this.serializeShadowRoot(element, timestamp, buildMap);
            }
            const children = Array.from(queryBody.children);
            element = children[index];
            if (!element || element.id !== id || element.localName !== localName) {
                element = children.find(x => (x.id === id || !id) && x.localName === localName);
            }
            if (!element) {
                const matches = children.filter(x => x.localName === localName);
                if (matches.length === 1)
                    element = matches[0];
            }
            if (!element || element.localName !== localName) {
                console.warn(`Element not found at step (step: ${i}) "${localName}#${id}[${index}]"`, JSON.stringify(path, null, 2), queryBody);
                return;
            }
        }
        this.serializeShadowRoot(element, timestamp, buildMap);
    }
    get pageResultset() {
        return [
            [...this.domChanges],
            [...this.mouseEvents],
            [...this.focusEvents],
            [...this.scrollEvents],
            [...this.loadEvents],
        ];
    }
    resetLists() {
        this.domChanges.length = 0;
        this.mouseEvents.length = 0;
        this.focusEvents.length = 0;
        this.scrollEvents.length = 0;
        this.loadEvents.length = 0;
    }
    disconnect() {
        this.extractChanges();
        this.observer.disconnect();
        this.uploadChanges();
    }
    uploadChanges() {
        if (upload(this.pageResultset)) {
            this.resetLists();
        }
    }
    listenToInteractionEvents() {
        if (this.isListeningForInteractionEvents)
            return;
        this.isListeningForInteractionEvents = true;
        for (const event of ['input', 'keydown', 'change']) {
            document.addEventListener(event, this.checkForAllPropertyChanges.bind(this), {
                capture: true,
                passive: true,
            });
        }
        document.addEventListener('mousemove', e => this.trackMouse(MouseEventType.MOVE, e), {
            capture: true,
            passive: true,
        });
        document.addEventListener('mousedown', e => this.trackMouse(MouseEventType.DOWN, e), {
            capture: true,
            passive: true,
        });
        document.addEventListener('mouseup', e => this.trackMouse(MouseEventType.UP, e), {
            capture: true,
            passive: true,
        });
        document.addEventListener('mouseover', e => this.trackMouse(MouseEventType.OVER, e), {
            capture: true,
            passive: true,
        });
        document.addEventListener('mouseleave', e => this.trackMouse(MouseEventType.OUT, e), {
            capture: true,
            passive: true,
        });
        document.addEventListener('focusin', e => this.trackFocus(FocusType.IN, e), {
            capture: true,
            passive: true,
        });
        document.addEventListener('focusout', e => this.trackFocus(FocusType.OUT, e), {
            capture: true,
            passive: true,
        });
        document.addEventListener('scroll', () => this.trackScroll(window.scrollX, window.scrollY), {
            capture: true,
            passive: true,
        });
    }
    serializeDocument(stamp) {
        if (document) {
            this.serializeChildren(document, stamp, new Map());
            this.didSerializeDocument = true;
        }
    }
    getLocationChange(changeUnixTime) {
        const currentLocation = window.self.location.href;
        if (this.location !== currentLocation) {
            this.location = currentLocation;
            const timestamp = changeUnixTime || Date.now();
            this.pushChange(DomActionType.location, { id: -1, textContent: currentLocation }, timestamp);
            this.trackScroll(window.scrollX, window.scrollY);
        }
    }
    getPropertyChanges(changeUnixTime) {
        for (const [input, propertyMap] of this.propertyTrackingElements) {
            let properties;
            for (const [propertyName, value] of propertyMap) {
                const newPropValue = input[propertyName];
                if (newPropValue !== value) {
                    if (!properties)
                        properties = {};
                    properties[propertyName] = newPropValue;
                    propertyMap.set(propertyName, newPropValue);
                }
            }
            if (properties) {
                const nodeId = NodeTracker.getNodeId(input);
                this.pushChange(DomActionType.property, { id: nodeId, properties }, changeUnixTime);
            }
        }
    }
    stylesheetRules(element) {
        const result = [];
        // don't record the text content of scripts
        if (!element || !element.sheet)
            return result;
        if (!(element.sheet instanceof CSSStyleSheet))
            return [];
        try {
            for (const rule of element.sheet.cssRules) {
                result.push(rule.cssText);
            }
            return result;
        }
        catch (err) {
            // can't track cors stylesheet rules
            return null;
        }
    }
    trackStylesheet(element) {
        if (!element || this.stylesheets.has(element))
            return;
        if (!element.sheet || !(element.sheet instanceof CSSStyleSheet))
            return;
        const storeStartingStyle = !!(element.textContent ?? '').trim();
        let startingStyle = [];
        if (storeStartingStyle) {
            startingStyle = this.stylesheetRules(element);
        }
        if (startingStyle !== null)
            this.stylesheets.set(element, startingStyle);
        return startingStyle;
    }
    checkForStylesheetChanges(changeUnixTime) {
        const timestamp = changeUnixTime || Date.now();
        for (const [style, current] of this.stylesheets) {
            const nodeId = NodeTracker.getNodeId(style);
            if (!style.sheet || !style.isConnected)
                continue;
            const newPropValue = this.stylesheetRules(style);
            if (newPropValue.toString() !== current.toString()) {
                this.pushChange(DomActionType.property, { id: nodeId, properties: { 'sheet.cssRules': newPropValue } }, timestamp);
                this.stylesheets.set(style, newPropValue);
            }
        }
    }
    onMutation(mutations) {
        this.convertMutationsToChanges(mutations);
        // debounce uploads
        if (document.readyState === 'complete') {
            clearTimeout(this.uploadOnDelay);
            this.uploadOnDelay = setTimeout(this.uploadChanges.bind(this), 50);
        }
    }
    convertMutationsToChanges(mutations) {
        const stamp = Date.now();
        this.getLocationChange(stamp);
        this.getPropertyChanges(stamp);
        const addedNodeMap = new Map();
        const removedNodes = new Set();
        for (const mutation of mutations) {
            const { type, target } = mutation;
            if (!NodeTracker.has(target) || this.elementsToTrack.has(target)) {
                this.serializeNodeToRoot(target, stamp, addedNodeMap);
                this.elementsToTrack.delete(target);
            }
            if (type === MutationRecordType.childList) {
                let isFirstRemoved = true;
                for (let i = 0, length = mutation.removedNodes.length; i < length; i += 1) {
                    const node = mutation.removedNodes[i];
                    removedNodes.add(node);
                    if (!NodeTracker.has(node))
                        continue;
                    const serial = this.serializeNode(node);
                    if (!serial)
                        continue;
                    serial.parentNodeId = NodeTracker.getNodeId(target);
                    serial.previousSiblingId = NodeTracker.getNodeId(isFirstRemoved ? mutation.previousSibling : node.previousSibling);
                    this.pushChange(DomActionType.removed, serial, stamp);
                    isFirstRemoved = false;
                }
                // A batch of changes includes changes in a set of nodes.
                // Since we're flattening, only the first one should be added after the mutation sibling.
                let isFirstAdded = true;
                for (let i = 0, length = mutation.addedNodes.length; i < length; i += 1) {
                    const node = mutation.addedNodes[i];
                    const serial = this.serializeNode(node);
                    if (!serial)
                        continue;
                    serial.parentNodeId = NodeTracker.getNodeId(target);
                    serial.previousSiblingId = NodeTracker.getNodeId(isFirstAdded ? mutation.previousSibling : node.previousSibling);
                    isFirstAdded = false;
                    // if we get a re-order of nodes, sometimes we'll remove nodes, and add them again
                    if (addedNodeMap.has(node) && !removedNodes.has(node)) {
                        const existing = addedNodeMap.get(node);
                        if (existing.previousSiblingId === serial.previousSiblingId &&
                            existing.parentNodeId === serial.parentNodeId) {
                            continue;
                        }
                    }
                    addedNodeMap.set(node, serial);
                    this.pushChange(DomActionType.added, serial, stamp);
                }
            }
            if (type === MutationRecordType.attributes) {
                // don't store
                if (!NodeTracker.has(target)) {
                    this.serializeNodeToRoot(target, stamp, addedNodeMap);
                }
                let serial = addedNodeMap.get(target) || this.serializeNode(target);
                if (!serial)
                    continue;
                let shouldPushChange = !addedNodeMap.has(target);
                // sometimes we get 1 change per attribute - put them all in one change
                const previous = this.domChanges[this.domChanges.length - 1];
                if (previous && previous[1].id === serial.id) {
                    serial = previous[1];
                    shouldPushChange = false;
                }
                serial.attributes ??= {};
                serial.attributes[mutation.attributeName] = target.getAttributeNS(mutation.attributeNamespace, mutation.attributeName);
                if (mutation.attributeNamespace && mutation.attributeNamespace !== '') {
                    serial.attributeNamespaces ??= {};
                    serial.attributeNamespaces[mutation.attributeName] = mutation.attributeNamespace;
                }
                if (shouldPushChange) {
                    this.pushChange(DomActionType.attribute, serial, stamp);
                }
            }
            if (type === MutationRecordType.characterData) {
                const serial = this.serializeNode(target);
                if (!serial)
                    continue;
                serial.textContent = target.textContent;
                this.pushChange(DomActionType.text, serial, stamp);
            }
        }
        for (const [node] of addedNodeMap) {
            // A batch of changes (setting innerHTML) will send nodes in a hierarchy instead of
            // individually so we need to extract child nodes into flat hierarchy
            this.serializeChildren(node, stamp, addedNodeMap);
        }
        this.checkForStylesheetChanges(stamp);
    }
    serializeNodeToRoot(node, changeTime, addedNodeMap) {
        if (NodeTracker.has(node) && !this.elementsToTrack.has(node)) {
            return this.serializeNode(node);
        }
        const serial = this.serializeNode(node);
        if (!serial)
            return;
        serial.parentNodeId = NodeTracker.getNodeId(node.parentNode);
        if (!serial.parentNodeId && node.parentNode) {
            const parentSerial = this.serializeNodeToRoot(node.parentNode, changeTime, addedNodeMap);
            serial.parentNodeId = parentSerial?.id;
        }
        serial.previousSiblingId = NodeTracker.getNodeId(node.previousSibling);
        if (!serial.previousSiblingId && node.previousSibling) {
            const previous = this.serializeNodeToRoot(node.previousSibling, changeTime, addedNodeMap);
            serial.previousSiblingId = previous?.id;
        }
        this.pushChange(DomActionType.added, serial, changeTime);
        addedNodeMap.set(node, serial);
        return serial;
    }
    serializeChildren(node, changeTime, addedNodes) {
        const parentId = NodeTracker.getNodeId(node);
        for (const child of node.childNodes) {
            const nodeId = NodeTracker.getNodeId(child);
            const hasChangedParent = parentId !== this.nodeIdToParentNodeId[nodeId];
            if (!NodeTracker.has(child) || hasChangedParent) {
                const serial = this.serializeNode(child);
                if (!serial)
                    continue;
                serial.parentNodeId = parentId;
                serial.previousSiblingId = NodeTracker.getNodeId(child.previousSibling);
                addedNodes.set(child, serial);
                this.pushChange(DomActionType.added, serial, changeTime);
                this.serializeChildren(child, changeTime, addedNodes);
            }
        }
        for (const element of [node, ...node.childNodes]) {
            this.serializeShadowRoot(element, changeTime, addedNodes);
        }
    }
    serializeShadowRoot(element, changeTime, addedNodes) {
        const shadowRoot = element.shadowRoot;
        if (!shadowRoot || NodeTracker.has(shadowRoot))
            return;
        const serial = this.serializeNode(shadowRoot);
        if (!serial)
            return;
        serial.parentNodeId = NodeTracker.getNodeId(element);
        this.pushChange(DomActionType.added, serial, changeTime);
        this.serializeChildren(shadowRoot, changeTime, addedNodes);
        this.observer.observe(shadowRoot, {
            attributes: true,
            childList: true,
            subtree: true,
            characterData: true,
        });
    }
    serializeNode(node) {
        if (node === null) {
            return undefined;
        }
        const id = NodeTracker.getNodeId(node);
        if (id !== undefined && !this.elementsToTrack.has(node)) {
            return { id };
        }
        const data = {
            nodeType: node.nodeType,
            id: NodeTracker.track(node),
        };
        if (node instanceof ShadowRoot) {
            data.nodeType = SHADOW_NODE_TYPE;
            return data;
        }
        switch (data.nodeType) {
            case Node.COMMENT_NODE:
            case Node.TEXT_NODE:
                data.textContent = node.textContent;
                break;
            case Node.DOCUMENT_TYPE_NODE:
                data.textContent = new XMLSerializer().serializeToString(node);
                break;
            case Node.ELEMENT_NODE:
                const element = node;
                data.tagName = element.tagName;
                if (element.namespaceURI && element.namespaceURI !== defaultNamespaceUri) {
                    data.namespaceUri = element.namespaceURI;
                }
                if (element.attributes.length) {
                    data.attributes = {};
                    for (let i = 0, length = element.attributes.length; i < length; i += 1) {
                        const attr = element.attributes[i];
                        data.attributes[attr.name] = attr.value;
                        if (attr.namespaceURI && attr.namespaceURI !== defaultNamespaceUri) {
                            if (!data.attributeNamespaces)
                                data.attributeNamespaces = {};
                            data.attributeNamespaces[attr.name] = attr.namespaceURI;
                        }
                    }
                }
                let propertyChecks;
                for (const prop of propertiesToCheck) {
                    if (prop in element) {
                        // don't store LI value as a property
                        if (prop === 'value' && data.tagName === 'LI')
                            continue;
                        if (!propertyChecks) {
                            propertyChecks = new Map();
                            data.properties = {};
                            this.propertyTrackingElements.set(node, propertyChecks);
                        }
                        propertyChecks.set(prop, element[prop]);
                        data.properties[prop] = element[prop];
                    }
                }
                if (data.tagName === 'STYLE') {
                    this.trackStylesheet(element);
                    data.textContent = element.textContent;
                }
                if (!this.isListeningForInteractionEvents && !hiddenTags.has(data.tagName)) {
                    this.listenToInteractionEvents();
                }
                break;
        }
        return data;
    }
    pushChange(action, serial, timestamp) {
        if (action === DomActionType.added) {
            this.nodeIdToParentNodeId[serial.id] = serial.parentNodeId;
            if (this.doNotTrackElementsById.has(serial.previousSiblingId)) {
                // get previous node that's tracked
                let previousNode = this.doNotTrackElementsById.get(serial.previousSiblingId);
                let nodeId = serial.previousSiblingId;
                do {
                    previousNode = previousNode.previousSibling;
                    nodeId = NodeTracker.getNodeId(previousNode);
                } while (previousNode && this.doNotTrackElementsById.has(nodeId));
                serial.previousSiblingId = nodeId;
            }
        }
        // don't include this if it's hero id
        if (this.doNotTrackElementsById.has(serial.id)) {
            return;
        }
        this.domChanges.push([action, serial, timestamp, idx()]);
    }
}
const defaultNamespaceUri = 'http://www.w3.org/1999/xhtml';
const propertiesToCheck = ['value', 'selected', 'selectedIndex', 'checked'];
const recorder = new PageEventsRecorder();
window.extractDomChanges = () => recorder.extractChanges();
window.trackElement = element => recorder.trackElement(element);
window.flushPageRecorder = (id) => recorder.flushAndReturnLists(id);
window.checkForShadowRoot = host => recorder.checkForShadowRoot(host);
window.listenToInteractionEvents = () => recorder.listenToInteractionEvents();
window.doNotTrackElement = element => recorder.doNotTrackElement(element);
const interval = setInterval(() => {
    if (!lastUploadDate || Date.now() - lastUploadDate > 1e3) {
        // if we haven't uploaded in 1 second, make sure nothing is pending
        requestAnimationFrame(() => recorder.uploadChanges());
    }
}, 500);
window.PaintEvents.onEventCallbackFn = (paintEvent, timestamp) => {
    if (paintEvent === 'FirstContentfulPaint') {
        recorder.start();
    }
    else {
        recorder.onLoadEvent(paintEvent, timestamp);
    }
};
window.addEventListener('beforeunload', () => {
    clearInterval(interval);
    recorder.disconnect();
});
// need duplicate since this is a variable - not just a type
var MouseEventType;
(function (MouseEventType) {
    MouseEventType[MouseEventType["MOVE"] = 0] = "MOVE";
    MouseEventType[MouseEventType["DOWN"] = 1] = "DOWN";
    MouseEventType[MouseEventType["UP"] = 2] = "UP";
    MouseEventType[MouseEventType["OVER"] = 3] = "OVER";
    MouseEventType[MouseEventType["OUT"] = 4] = "OUT";
})(MouseEventType || (MouseEventType = {}));
var FocusType;
(function (FocusType) {
    FocusType[FocusType["IN"] = 0] = "IN";
    FocusType[FocusType["OUT"] = 1] = "OUT";
})(FocusType || (FocusType = {}));
//# sourceMappingURL=pageEventsRecorder.js.map