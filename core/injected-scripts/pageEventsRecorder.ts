// NOTE: do not use node dependencies

import { IDomChangeEvent, INodeData } from '@ulixee/hero-interfaces/IDomChangeEvent';
import { IMouseEvent } from '@ulixee/hero-interfaces/IMouseEvent';
import { IFocusEvent } from '@ulixee/hero-interfaces/IFocusEvent';
import { IScrollEvent } from '@ulixee/hero-interfaces/IScrollEvent';
import { ILoadEvent } from '@ulixee/hero-interfaces/ILoadEvent';

declare global {
  interface Window {
    extractDomChanges(): PageRecorderResultSet;
    flushPageRecorder(): PageRecorderResultSet;
    listenForInteractionEvents(): void;
    doNotTrackElement(element: Element): void;
  }
}
declare const runtimeFunction: string;

enum DomActionType {
  newDocument = 0,
  location = 1,
  added = 2,
  removed = 3,
  text = 4,
  attribute = 5,
  property = 6,
}

const MutationRecordType = {
  attributes: 'attributes',
  childList: 'childList',
  characterData: 'characterData',
};

// exporting a type is ok. Don't export variables or will blow up the page
export type PageRecorderResultSet = [
  IDomChangeEvent[],
  IMouseEvent[],
  IFocusEvent[],
  IScrollEvent[],
  ILoadEvent[],
];
const SHADOW_NODE_TYPE = 40;

// callback binding
const eventsCallback = window[runtimeFunction] as unknown as (data: string) => void;

let lastUploadDate: Date;

function upload(records: PageRecorderResultSet) {
  try {
    const total = records.reduce((tot, ent) => tot + ent.length, 0);
    if (total > 0) {
      eventsCallback(JSON.stringify(records));
    }
    lastUploadDate = new Date();
    return true;
  } catch (err) {
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
  private readonly domChanges: IDomChangeEvent[] = [];

  private readonly mouseEvents: IMouseEvent[] = [];
  private readonly focusEvents: IFocusEvent[] = [];
  private readonly scrollEvents: IScrollEvent[] = [];
  private readonly loadEvents: ILoadEvent[] = [];
  private readonly doNotTrackElementsById = new Map<number, Element>();
  private location = window.self.location.href;
  private uploadOnDelay: number;

  private isListeningForInteractionEvents = false;

  private readonly propertyTrackingElements = new Map<Node, Map<string, string | boolean>>();
  private readonly stylesheets = new Map<HTMLStyleElement | HTMLLinkElement, string[]>();

  private readonly observer: MutationObserver;

  constructor() {
    this.observer = new MutationObserver(this.onMutation.bind(this));
  }

  public start() {
    if (isStarted || this.location === 'about:blank') {
      return;
    }
    isStarted = true;

    // preload with a document
    const newDocument = {
      id: -1,
      textContent: this.location,
    };
    const stamp = Date.now();
    this.pushChange(DomActionType.newDocument, newDocument, stamp);

    if (document) {
      this.pushChange(DomActionType.added, this.serializeNode(document), stamp);
    }

    if (document && document.doctype) {
      this.pushChange(DomActionType.added, this.serializeNode(document.doctype), stamp);
    }

    this.serializeChildren(document, stamp, new Map<Node, INodeData>());
    this.observer.observe(document, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true,
    });
    this.uploadChanges();
  }

  public doNotTrackElement(element: Element): void {
    const nodeId = NodeTracker.track(element);
    this.doNotTrackElementsById.set(nodeId, element);
  }

  public extractChanges(): PageRecorderResultSet {
    this.convertMutationsToChanges(this.observer.takeRecords());
    return this.pageResultset;
  }

  public flushAndReturnLists(): PageRecorderResultSet {
    const changes = recorder.extractChanges();

    recorder.resetLists();
    return changes;
  }

  public trackFocus(eventType: FocusType, focusEvent: FocusEvent) {
    const nodeId = NodeTracker.getNodeId(focusEvent.target as Node);
    const relatedNodeId = NodeTracker.getNodeId(focusEvent.relatedTarget as Node);
    const time = Date.now();
    const event = [eventType as any, nodeId, relatedNodeId, time] as IFocusEvent;
    this.focusEvents.push(event);
    this.getPropertyChanges(time);
  }

  public trackMouse(eventType: MouseEventType, mouseEvent: MouseEvent) {
    const nodeId = NodeTracker.getNodeId(mouseEvent.target as Node);
    const relatedNodeId = NodeTracker.getNodeId(mouseEvent.relatedTarget as Node);
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
    ] as IMouseEvent;

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
    this.mouseEvents.push(event);
  }

  public trackScroll(scrollX: number, scrollY: number) {
    this.scrollEvents.push([scrollX, scrollY, Date.now()]);
  }

  public onLoadEvent(name: string) {
    this.start();
    this.loadEvents.push([name, window.self.location.href, Date.now()]);
    this.uploadChanges();
  }

  public checkForAllPropertyChanges() {
    this.getPropertyChanges(Date.now());
  }

  public get pageResultset(): PageRecorderResultSet {
    return [
      [...this.domChanges],
      [...this.mouseEvents],
      [...this.focusEvents],
      [...this.scrollEvents],
      [...this.loadEvents],
    ];
  }

  public resetLists() {
    this.domChanges.length = 0;
    this.mouseEvents.length = 0;
    this.focusEvents.length = 0;
    this.scrollEvents.length = 0;
    this.loadEvents.length = 0;
  }

  public disconnect() {
    this.extractChanges();
    this.observer.disconnect();
    this.uploadChanges();
  }

  public uploadChanges() {
    if (upload(this.pageResultset)) {
      this.resetLists();
    }
  }

  public listenToInteractionEvents() {
    if (this.isListeningForInteractionEvents) return;
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

  private getLocationChange(changeUnixTime: number) {
    const currentLocation = window.self.location.href;
    if (this.location !== currentLocation) {
      this.location = currentLocation;
      const timestamp = changeUnixTime || Date.now();
      this.pushChange(DomActionType.location, { id: -1, textContent: currentLocation }, timestamp);
    }
  }

  private getPropertyChanges(changeUnixTime: number) {
    for (const [input, propertyMap] of this.propertyTrackingElements) {
      for (const [propertyName, value] of propertyMap) {
        const newPropValue = input[propertyName];
        if (newPropValue !== value) {
          const nodeId = NodeTracker.getNodeId(input);
          this.pushChange(
            DomActionType.property,
            { id: nodeId, properties: { [propertyName]: newPropValue } },
            changeUnixTime,
          );
          propertyMap.set(propertyName, newPropValue);
        }
      }
    }
  }

  private trackStylesheet(element: HTMLStyleElement) {
    if (!element || this.stylesheets.has(element)) return;
    if (!element.sheet) return;

    const shouldStoreCurrentStyleState = !!element.textContent;
    if (element.sheet instanceof CSSStyleSheet) {
      try {
        // if there's style text, record the current state
        const startingStyle = shouldStoreCurrentStyleState
          ? [...element.sheet.cssRules].map(x => x.cssText)
          : [];
        this.stylesheets.set(element, startingStyle);
      } catch (err) {
        // can't track cors stylesheet rules
      }
    }
  }

  private checkForStylesheetChanges(changeUnixTime: number) {
    const timestamp = changeUnixTime || Date.now();
    for (const [style, current] of this.stylesheets) {
      if (!style.sheet || !style.isConnected) continue;
      const sheet = style.sheet as CSSStyleSheet;
      const newPropValue = [...sheet.cssRules].map(x => x.cssText);
      if (newPropValue.toString() !== current.toString()) {
        const nodeId = NodeTracker.getNodeId(style);
        this.pushChange(
          DomActionType.property,
          { id: nodeId, properties: { 'sheet.cssRules': newPropValue } },
          timestamp,
        );
        this.stylesheets.set(style, newPropValue);
      }
    }
  }

  private onMutation(mutations: MutationRecord[]) {
    this.convertMutationsToChanges(mutations);
    // debounce uploads
    if (document.readyState === 'complete') {
      clearTimeout(this.uploadOnDelay);
      this.uploadOnDelay = setTimeout(this.uploadChanges.bind(this), 50) as any;
    }
  }

  private convertMutationsToChanges(mutations: MutationRecord[]): void {
    const stamp = Date.now();

    this.getLocationChange(stamp);
    this.getPropertyChanges(stamp);

    const addedNodeMap = new Map<Node, INodeData>();
    const removedNodes = new Set<Node>();

    for (const mutation of mutations) {
      const { type, target } = mutation;
      if (!NodeTracker.has(target)) {
        this.serializeNodeToRoot(target, stamp, addedNodeMap);
      }

      if (type === MutationRecordType.childList) {
        let isFirstRemoved = true;
        for (let i = 0, length = mutation.removedNodes.length; i < length; i += 1) {
          const node = mutation.removedNodes[i];
          removedNodes.add(node);
          if (!NodeTracker.has(node)) continue;
          const serial = this.serializeNode(node);
          if (!serial) continue;
          serial.parentNodeId = NodeTracker.getNodeId(target);
          serial.previousSiblingId = NodeTracker.getNodeId(
            isFirstRemoved ? mutation.previousSibling : node.previousSibling,
          );
          this.pushChange(DomActionType.removed, serial, stamp);
          isFirstRemoved = false;
        }

        // A batch of changes includes changes in a set of nodes.
        // Since we're flattening, only the first one should be added after the mutation sibling.
        let isFirstAdded = true;
        for (let i = 0, length = mutation.addedNodes.length; i < length; i += 1) {
          const node = mutation.addedNodes[i];
          const serial = this.serializeNode(node);
          if (!serial) continue;
          serial.parentNodeId = NodeTracker.getNodeId(target);
          serial.previousSiblingId = NodeTracker.getNodeId(
            isFirstAdded ? mutation.previousSibling : node.previousSibling,
          );
          isFirstAdded = false;
          // if we get a re-order of nodes, sometimes we'll remove nodes, and add them again
          if (addedNodeMap.has(node) && !removedNodes.has(node)) {
            const existing = addedNodeMap.get(node);
            if (
              existing.previousSiblingId === serial.previousSiblingId &&
              existing.parentNodeId === serial.parentNodeId
            ) {
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
        if (!serial) continue;

        let shouldPushChange = !addedNodeMap.has(target);

        // sometimes we get 1 change per attribute - put them all in one change
        const previous = this.domChanges[this.domChanges.length - 1];
        if (previous && previous[1].id === serial.id) {
          serial = previous[1];
          shouldPushChange = false;
        }

        serial.attributes ??= {};
        serial.attributes[mutation.attributeName] = (target as Element).getAttributeNS(
          mutation.attributeNamespace,
          mutation.attributeName,
        );
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
        if (!serial) continue;
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

  private serializeNodeToRoot(node: Node, changeTime: number, addedNodeMap: Map<Node, INodeData>) {
    if (NodeTracker.has(node)) return this.serializeNode(node);

    const serial = this.serializeNode(node);
    if (!serial) return;

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

  private serializeChildren(
    node: Node,
    changeTime: number,
    addedNodes: Map<Node, INodeData>,
  ): void {
    for (const child of node.childNodes) {
      if (!NodeTracker.has(child)) {
        const serial = this.serializeNode(child);
        if (!serial) continue;
        serial.parentNodeId = NodeTracker.getNodeId(child.parentElement ?? child.getRootNode());
        serial.previousSiblingId = NodeTracker.getNodeId(child.previousSibling);
        addedNodes.set(child, serial);
        this.pushChange(DomActionType.added, serial, changeTime);
        this.serializeChildren(child, changeTime, addedNodes);
      }
    }

    for (const element of [node, ...node.childNodes] as Element[]) {
      if (element.tagName === 'STYLE') {
        this.trackStylesheet(element as HTMLStyleElement);
      }
      const shadowRoot = element.shadowRoot;
      if (shadowRoot && !NodeTracker.has(shadowRoot)) {
        const serial = this.serializeNode(shadowRoot);
        if (!serial) continue;
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
    }
  }

  private serializeNode(node: Node): INodeData {
    if (node === null) {
      return undefined;
    }

    const id = NodeTracker.getNodeId(node);
    if (id !== undefined) {
      return { id };
    }

    const data: INodeData = {
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
        const element = node as Element;
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
              if (!data.attributeNamespaces) data.attributeNamespaces = {};
              data.attributeNamespaces[attr.name] = attr.namespaceURI;
            }
          }
        }

        let propertyChecks: [string, string | boolean][];
        for (const prop of propertiesToCheck) {
          if (prop in element) {
            if (!propertyChecks) propertyChecks = [];
            propertyChecks.push([prop, element[prop]]);
          }
        }
        if (propertyChecks) {
          const propsMap = new Map<string, string | boolean>(propertyChecks);
          this.propertyTrackingElements.set(node, propsMap);
        }
        break;
    }

    return data;
  }

  private pushChange(action: DomActionType, serial: INodeData, timestamp: number): void {
    if (action === DomActionType.added) {
      // don't include this if it's hero id
      if (this.doNotTrackElementsById.has(serial.id)) {
        return;
      }
      if (this.doNotTrackElementsById.has(serial.previousSiblingId)) {
        // get previous node that's tracked
        let previousNode: ChildNode = this.doNotTrackElementsById.get(serial.previousSiblingId);
        let nodeId = serial.previousSiblingId;
        do {
          previousNode = previousNode.previousSibling;
          nodeId = NodeTracker.getNodeId(previousNode);
        } while (previousNode && this.doNotTrackElementsById.has(nodeId));
        serial.previousSiblingId = nodeId;
      }
    }
    this.domChanges.push([action, serial, timestamp, idx()]);
  }
}

const defaultNamespaceUri = 'http://www.w3.org/1999/xhtml';
const propertiesToCheck = ['value', 'selected', 'checked'];

const recorder = new PageEventsRecorder();
window.extractDomChanges = () => recorder.extractChanges();
window.flushPageRecorder = () => recorder.flushAndReturnLists();
window.listenForInteractionEvents = () => recorder.listenToInteractionEvents();
window.doNotTrackElement = element => recorder.doNotTrackElement(element);

const interval = setInterval(() => {
  if (!lastUploadDate || Date.now() - lastUploadDate.getTime() > 1e3) {
    // if we haven't uploaded in 1 second, make sure nothing is pending
    requestAnimationFrame(() => recorder.uploadChanges());
  }
}, 500);

window.addEventListener('DOMContentLoaded', () => {
  // force domContentLoaded to come first
  recorder.onLoadEvent('DOMContentLoaded');
});

window.addEventListener('load', () => recorder.onLoadEvent('load'));

if (window.self.location?.href !== 'about:blank') {
  window.addEventListener('beforeunload', () => {
    clearInterval(interval);
    recorder.disconnect();
  });

  const paintObserver = new PerformanceObserver(entryList => {
    if (entryList.getEntriesByName('first-contentful-paint').length) {
      recorder.start();
      paintObserver.disconnect();
    }
  });
  paintObserver.observe({ type: 'paint', buffered: true });

  const contentStableObserver = new PerformanceObserver(() => {
    recorder.onLoadEvent('LargestContentfulPaint');
    contentStableObserver.disconnect();
  });
  contentStableObserver.observe({ type: 'largest-contentful-paint', buffered: true });
}

// need duplicate since this is a variable - not just a type
enum MouseEventType {
  MOVE = 0,
  DOWN = 1,
  UP = 2,
  OVER = 3,
  OUT = 4,
}

enum FocusType {
  IN = 0,
  OUT = 1,
}
