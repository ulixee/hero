// NOTE: do not use node dependencies
// eslint-disable-next-line max-classes-per-file
import { IDomChangeEvent, INodeData } from '@secret-agent/interfaces/IDomChangeEvent';
import { IMouseEvent } from '@secret-agent/interfaces/IMouseEvent';
import { IFocusEvent } from '@secret-agent/interfaces/IFocusEvent';
import { IScrollEvent } from '@secret-agent/interfaces/IScrollEvent';
import { ILoadEvent } from '@secret-agent/interfaces/ILoadEvent';

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

// @ts-ignore
const eventsCallback = (window[runtimeFunction] as unknown) as (data: string) => void;
// @ts-ignore
delete window[runtimeFunction];

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
  private domChanges: IDomChangeEvent[] = [];

  private mouseEvents: IMouseEvent[] = [];
  private focusEvents: IFocusEvent[] = [];
  private scrollEvents: IScrollEvent[] = [];
  private loadEvents: ILoadEvent[] = [];
  private location = window.self.location.href;

  private isListeningForInteractionEvents = false;

  private propertyTrackingElements = new Map<Node, Map<string, string | boolean>>();
  private stylesheets = new Map<HTMLStyleElement | HTMLLinkElement, string[]>();

  private readonly observer: MutationObserver;

  constructor() {
    this.observer = new MutationObserver(this.onMutation.bind(this));
  }

  public start() {
    if (isStarted || window.self.location.href === 'about:blank') {
      return;
    }
    isStarted = true;

    const stamp = new Date().getTime();
    // preload with a document
    this.domChanges.push([
      DomActionType.newDocument,
      {
        id: -1,
        textContent: window.self.location.href,
      },
      stamp,
      idx(),
    ]);

    if (document && document.doctype) {
      this.domChanges.push([
        DomActionType.added,
        this.serializeNode(document.doctype),
        stamp,
        idx(),
      ]);
    }
    const children = this.serializeChildren(document, new Map<Node, INodeData>());
    this.observer.observe(document, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true,
    });
    for (const childData of children) {
      this.domChanges.push([DomActionType.added, childData, stamp, idx()]);
    }
    this.uploadChanges();
  }

  public extractChanges(): PageRecorderResultSet {
    const changes = this.convertMutationsToChanges(this.observer.takeRecords());
    this.domChanges.push(...changes);
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
    const time = new Date().getTime();
    const event = [eventType as any, nodeId, relatedNodeId, time] as IFocusEvent;
    this.focusEvents.push(event);
    this.getPropertyChanges(time, this.domChanges);
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
      new Date().getTime(),
    ] as IMouseEvent;
    this.mouseEvents.push(event);
  }

  public trackScroll(scrollX: number, scrollY: number) {
    this.scrollEvents.push([scrollX, scrollY, new Date().getTime()]);
  }

  public onLoadEvent(name: string) {
    this.start();
    this.loadEvents.push([name, window.self.location.href, new Date().getTime()]);
    this.uploadChanges();
  }

  public checkForAllPropertyChanges() {
    this.getPropertyChanges(new Date().getTime(), this.domChanges);
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

  private getLocationChange(changeUnixTime: number, changes: IDomChangeEvent[]) {
    const timestamp = changeUnixTime || new Date().getTime();
    const currentLocation = window.self.location.href;
    if (this.location !== currentLocation) {
      this.location = currentLocation;
      changes.push([
        DomActionType.location,
        { id: -1, textContent: currentLocation },
        timestamp,
        idx(),
      ]);
    }
  }

  private getPropertyChanges(changeUnixTime: number, changes: IDomChangeEvent[]) {
    for (const [input, propertyMap] of this.propertyTrackingElements) {
      for (const [propertyName, value] of propertyMap) {
        const newPropValue = input[propertyName];
        if (newPropValue !== value) {
          const nodeId = NodeTracker.getNodeId(input);
          changes.push([
            DomActionType.property,
            { id: nodeId, properties: { [propertyName]: newPropValue } },
            changeUnixTime,
            idx(),
          ]);
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

  private checkForStylesheetChanges(changeUnixTime: number, changes: IDomChangeEvent[]) {
    const timestamp = changeUnixTime || new Date().getTime();
    for (const [style, current] of this.stylesheets) {
      if (!style.sheet || !style.isConnected) continue;
      const sheet = style.sheet as CSSStyleSheet;
      const newPropValue = [...sheet.cssRules].map(x => x.cssText);
      if (newPropValue.toString() !== current.toString()) {
        const nodeId = NodeTracker.getNodeId(style);
        changes.push([
          DomActionType.property,
          { id: nodeId, properties: { 'sheet.cssRules': newPropValue } },
          timestamp,
          idx(),
        ]);
        this.stylesheets.set(style, newPropValue);
      }
    }
  }

  private onMutation(mutations: MutationRecord[]) {
    const changes = this.convertMutationsToChanges(mutations);
    this.domChanges.push(...changes);
  }

  private convertMutationsToChanges(mutations: MutationRecord[]) {
    const changes: IDomChangeEvent[] = [];
    const stamp = new Date().getTime();

    this.getLocationChange(stamp, changes);
    this.getPropertyChanges(stamp, changes);

    const addedNodeMap = new Map<Node, INodeData>();
    const removedNodes = new Set<Node>();

    for (const mutation of mutations) {
      const { type, target } = mutation;
      if (!NodeTracker.has(target)) {
        this.serializeHierarchy(target, changes, stamp, addedNodeMap);
      }

      if (type === MutationRecordType.childList) {
        let isFirstRemoved = true;
        for (let i = 0, length = mutation.removedNodes.length; i < length; i += 1) {
          const node = mutation.removedNodes[i];
          removedNodes.add(node);
          if (!NodeTracker.has(node)) continue;
          const serial = this.serializeNode(node);
          serial.parentNodeId = NodeTracker.getNodeId(target);
          serial.previousSiblingId = NodeTracker.getNodeId(
            isFirstRemoved ? mutation.previousSibling : node.previousSibling,
          );
          changes.push([DomActionType.removed, serial, stamp, idx()]);
          isFirstRemoved = false;
        }

        // A batch of changes includes changes in a set of nodes.
        // Since we're flattening, only the first one should be added after the mutation sibling.
        let isFirstAdded = true;
        for (let i = 0, length = mutation.addedNodes.length; i < length; i += 1) {
          const node = mutation.addedNodes[i];
          const serial = this.serializeNode(node);
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
          changes.push([DomActionType.added, serial, stamp, idx()]);
        }
      }

      if (type === MutationRecordType.attributes) {
        // don't store
        if (!NodeTracker.has(target)) {
          this.serializeHierarchy(target, changes, stamp, addedNodeMap);
        }
        const serial = addedNodeMap.get(target) || this.serializeNode(target);
        if (!serial.attributes) serial.attributes = {};
        serial.attributes[mutation.attributeName] = (target as Element).getAttributeNS(
          mutation.attributeNamespace,
          mutation.attributeName,
        );
        if (mutation.attributeNamespace && mutation.attributeNamespace !== '') {
          if (!serial.attributeNamespaces) serial.attributeNamespaces = {};
          serial.attributeNamespaces[mutation.attributeName] = mutation.attributeNamespace;
        }

        // flatten changes
        if (!addedNodeMap.has(target)) {
          changes.push([DomActionType.attribute, serial, stamp, idx()]);
        }
      }

      if (type === MutationRecordType.characterData) {
        const textChange = this.serializeNode(target);
        textChange.textContent = target.textContent;
        changes.push([DomActionType.text, textChange, stamp, idx()]);
      }
    }

    for (const [node] of addedNodeMap) {
      // A batch of changes (setting innerHTML) will send nodes in a hierarchy instead of
      // individually so we need to extract child nodes into flat hierarchy
      const children = this.serializeChildren(node, addedNodeMap);
      for (const childData of children) {
        changes.push([DomActionType.added, childData, stamp, idx()]);
      }
    }

    this.checkForStylesheetChanges(stamp, changes);

    return changes;
  }

  private serializeHierarchy(
    node: Node,
    changes: IDomChangeEvent[],
    changeTime: number,
    addedNodeMap: Map<Node, INodeData>,
  ) {
    if (NodeTracker.has(node)) return this.serializeNode(node);

    const serial = this.serializeNode(node);
    serial.parentNodeId = NodeTracker.getNodeId(node.parentNode);
    if (!serial.parentNodeId && node.parentNode) {
      const parentSerial = this.serializeHierarchy(
        node.parentNode,
        changes,
        changeTime,
        addedNodeMap,
      );

      serial.parentNodeId = parentSerial.id;
    }
    serial.previousSiblingId = NodeTracker.getNodeId(node.previousSibling);
    if (!serial.previousSiblingId && node.previousSibling) {
      const previous = this.serializeHierarchy(
        node.previousSibling,
        changes,
        changeTime,
        addedNodeMap,
      );
      serial.previousSiblingId = previous.id;
    }
    changes.push([DomActionType.added, serial, changeTime, idx()]);
    addedNodeMap.set(node, serial);
    return serial;
  }

  private serializeChildren(node: Node, addedNodes: Map<Node, INodeData>) {
    const serialized: INodeData[] = [];

    for (const child of node.childNodes) {
      if (!NodeTracker.has(child)) {
        const serial = this.serializeNode(child);
        serial.parentNodeId = NodeTracker.getNodeId(child.parentElement ?? child.getRootNode());
        serial.previousSiblingId = NodeTracker.getNodeId(child.previousSibling);
        addedNodes.set(child, serial);
        serialized.push(serial, ...this.serializeChildren(child, addedNodes));
      }
    }

    for (const element of [node, ...node.childNodes] as Element[]) {
      if (element.tagName === 'STYLE') {
        this.trackStylesheet(element as HTMLStyleElement);
      }
      const shadowRoot = element.shadowRoot;
      if (shadowRoot && !NodeTracker.has(shadowRoot)) {
        const serial = this.serializeNode(shadowRoot);
        serial.parentNodeId = NodeTracker.getNodeId(element);
        serialized.push(serial, ...this.serializeChildren(shadowRoot, addedNodes));
        this.observer.observe(shadowRoot, {
          attributes: true,
          childList: true,
          subtree: true,
          characterData: true,
        });
      }
    }

    return serialized;
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
}

const defaultNamespaceUri = 'http://www.w3.org/1999/xhtml';
const propertiesToCheck = ['value', 'selected', 'checked'];

const recorder = new PageEventsRecorder();

// @ts-ignore
window.extractDomChanges = () => recorder.extractChanges();
// @ts-ignore
window.flushPageRecorder = () => recorder.flushAndReturnLists();
// @ts-ignore
window.listenForInteractionEvents = () => recorder.listenToInteractionEvents();

const interval = setInterval(() => {
  if (!lastUploadDate || new Date().getTime() - lastUploadDate.getTime() > 1e3) {
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
