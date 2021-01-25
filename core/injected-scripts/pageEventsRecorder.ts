// NOTE: do not use node dependencies

// eslint-disable-next-line max-classes-per-file
import { IDomChangeEvent, INodeData } from '@secret-agent/core-interfaces/IDomChangeEvent';
import { IMouseEvent } from '@secret-agent/core-interfaces/IMouseEvent';
import { IFocusEvent } from '@secret-agent/core-interfaces/IFocusEvent';
import { IScrollEvent } from '@secret-agent/core-interfaces/IScrollEvent';
import { ILoadEvent } from '@secret-agent/core-interfaces/ILoadEvent';

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

class NodeTracker implements INodeTracker {
  private nextId = 1;
  private nodeIds = new Map<Node, number>();

  public has(node: Node) {
    return this.nodeIds.has(node);
  }

  public getId(node: Node) {
    if (!node) return undefined;
    return this.nodeIds.get(node) || undefined;
  }

  public track(node: Node) {
    if (!node) return;
    if (this.nodeIds.has(node)) {
      return this.nodeIds.get(node);
    }
    const id = this.nextId;
    // @ts-ignore
    node.saTrackerNodeId = id;
    this.nextId += 1;
    this.nodeIds.set(node, id);
    return id;
  }

  public getNode(id: number) {
    for (const [node, nodeId] of this.nodeIds) {
      if (id === nodeId) {
        return node;
      }
    }
    throw new Error(`Node with id not found -> ${id}`);
  }
}

const nodeTracker = new NodeTracker();

let eventCounter = 0;

function idx() {
  return (eventCounter += 1);
}

// @ts-ignore
window.nodeTracker = nodeTracker;

class PageEventsRecorder {
  private domChanges: IDomChangeEvent[] = [
    // preload with a document
    [
      -1,
      'newDocument',
      { id: -1, textContent: window.self.location.href },
      new Date().toISOString(),
      idx(),
    ],
  ];

  private mouseEvents: IMouseEvent[] = [];
  private focusEvents: IFocusEvent[] = [];
  private scrollEvents: IScrollEvent[] = [];
  private loadEvents: ILoadEvent[] = [];
  private location = window.self.location.href;

  private commandId = -1;
  private propertyTrackingElements = new Map<Node, Map<string, string | boolean>>();
  private stylesheets = new Map<HTMLStyleElement | HTMLLinkElement, string[]>();

  private readonly observer: MutationObserver;

  constructor() {
    this.observer = new MutationObserver(this.onMutation.bind(this));
    if (window.location?.href === 'about:blank') return;
    if (document && document.childNodes.length) {
      const mutations: MutationRecord[] = [
        {
          type: 'childList' as any,
          addedNodes: document.childNodes,
          removedNodes: [] as any,
          nextSibling: null,
          previousSibling: null,
          oldValue: null,
          attributeNamespace: null,
          attributeName: null,
          target: document,
        },
      ];

      this.onMutation(mutations);
    }
    this.observer.observe(document, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  public hasCommandId() {
    return this.commandId !== -1;
  }

  public setCommandId(id: number) {
    const isUnset = this.commandId === -1;
    this.commandId = id;

    if (isUnset) {
      for (const change of this.domChanges) {
        if (change[0] === -1) change[0] = this.commandId;
      }
    }
    this.uploadChanges();
  }

  public extractChanges(): PageRecorderResultSet {
    const changes = this.convertMutationsToChanges(this.observer.takeRecords());
    this.domChanges.push(...changes);
    return this.pageResultset;
  }

  public trackFocus(eventType: 'in' | 'out', focusEvent: FocusEvent) {
    const nodeId = focusEvent.target ? nodeTracker.getId(focusEvent.target as Node) : undefined;
    const relatedNodeId = focusEvent.relatedTarget
      ? nodeTracker.getId(focusEvent.relatedTarget as Node)
      : undefined;
    const time = new Date().toISOString();
    const event = [this.commandId, eventType, nodeId, relatedNodeId, time] as IFocusEvent;
    this.focusEvents.push(event);
    this.checkForPropertyChanges(time);
  }

  public trackMouse(eventType: MouseEventType, mouseEvent: MouseEvent) {
    const nodeId = mouseEvent.target ? nodeTracker.getId(mouseEvent.target as Node) : undefined;
    const relatedNodeId = mouseEvent.relatedTarget
      ? nodeTracker.getId(mouseEvent.relatedTarget as Node)
      : undefined;
    const event = [
      this.commandId,
      eventType,
      mouseEvent.pageX,
      mouseEvent.pageY,
      // might not want to do this - causes reflow
      mouseEvent.offsetX,
      mouseEvent.offsetY,
      mouseEvent.buttons,
      nodeId,
      relatedNodeId,
      new Date().toISOString(),
    ] as IMouseEvent;
    this.mouseEvents.push(event);
  }

  public trackScroll(scrollX: number, scrollY: number) {
    this.scrollEvents.push([this.commandId, scrollX, scrollY, new Date().toISOString()]);
  }

  public onLoadEvent(name: string) {
    this.loadEvents.push([
      this.commandId,
      name,
      window.self.location.href,
      new Date().toISOString(),
    ]);
    this.uploadChanges();
  }

  public checkForLocationChange(changeTime?: string) {
    const timestamp = changeTime || new Date().toISOString();
    const currentLocation = window.self.location.href;
    if (this.location !== currentLocation) {
      this.location = currentLocation;
      this.domChanges.push([
        this.commandId,
        'location',
        { id: -1, textContent: currentLocation },
        timestamp,
        idx(),
      ]);
    }
  }

  public checkForStylesheetChanges(changeTime?: string) {
    const timestamp = changeTime || new Date().toISOString();
    for (const [style, current] of this.stylesheets) {
      if (!style.sheet || !style.isConnected) continue;
      const sheet = style.sheet as CSSStyleSheet;
      const newPropValue = [...sheet.cssRules].map(x => x.cssText);
      if (newPropValue.toString() !== current.toString()) {
        const nodeId = nodeTracker.getId(style);
        this.domChanges.push([
          this.commandId,
          'property',
          { id: nodeId, properties: { 'sheet.cssRules': newPropValue } },
          timestamp,
          idx(),
        ]);
        this.stylesheets.set(style, newPropValue);
      }
    }
  }

  public checkForPropertyChanges(changeTime?: string) {
    const timestamp = changeTime || new Date().toISOString();
    for (const [input, propertyMap] of this.propertyTrackingElements) {
      for (const [propertyName, value] of propertyMap) {
        const newPropValue = input[propertyName];
        if (newPropValue !== value) {
          const nodeId = nodeTracker.getId(input);
          this.domChanges.push([
            this.commandId,
            'property',
            { id: nodeId, properties: { [propertyName]: newPropValue } },
            timestamp,
            idx(),
          ]);
          propertyMap.set(propertyName, newPropValue);
        }
      }
    }
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

  private trackStylesheet(element: HTMLLinkElement | HTMLStyleElement) {
    if (!element || this.stylesheets.has(element)) return;
    if (!element.sheet) return;

    const shouldRecordInitialStyle = element.textContent || element instanceof HTMLStyleElement;
    if (element.sheet instanceof CSSStyleSheet) {
      try {
        // if there's style text, record the current state
        const startingStyle = shouldRecordInitialStyle
          ? [...element.sheet.cssRules].map(x => x.cssText)
          : [];
        this.stylesheets.set(element, startingStyle);
      } catch (err) {
        // can't track cors stylesheet rules
      }
    }
  }

  private onMutation(mutations: MutationRecord[]) {
    const changes = this.convertMutationsToChanges(mutations);
    this.domChanges.push(...changes);
  }

  private convertMutationsToChanges(mutations: MutationRecord[]) {
    const changes: IDomChangeEvent[] = [];
    const currentCommandId = this.commandId;
    const stamp = new Date().toISOString();

    this.checkForLocationChange(stamp);
    this.checkForPropertyChanges(stamp);

    const addedNodeMap = new Map<Node, INodeData>();
    const removedNodes = new Set<Node>();

    for (const mutation of mutations) {
      const { type, target } = mutation;
      if (!nodeTracker.has(target)) {
        this.serializeHierarchy(target, changes, currentCommandId, stamp, addedNodeMap);
      }

      if (type === 'childList') {
        let isFirstRemoved = true;
        for (let i = 0, length = mutation.removedNodes.length; i < length; i += 1) {
          const node = mutation.removedNodes[i];
          removedNodes.add(node);
          if (!nodeTracker.has(node)) continue;
          const serial = this.serializeNode(node);
          serial.parentNodeId = nodeTracker.getId(target);
          serial.previousSiblingId = nodeTracker.getId(
            isFirstRemoved ? mutation.previousSibling : node.previousSibling,
          );
          changes.push([currentCommandId, 'removed', serial, stamp, idx()]);
          isFirstRemoved = false;
        }

        // A batch of changes includes changes in a set of nodes.
        // Since we're flattening, only the first one should be added after the mutation sibling.
        let isFirstAdded = true;
        for (let i = 0, length = mutation.addedNodes.length; i < length; i += 1) {
          const node = mutation.addedNodes[i];
          const serial = this.serializeNode(node);
          serial.parentNodeId = nodeTracker.getId(target);
          serial.previousSiblingId = nodeTracker.getId(
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
          changes.push([currentCommandId, 'added', serial, stamp, idx()]);
        }
      }

      if (type === 'attributes') {
        // don't store
        if (!nodeTracker.has(target)) {
          this.serializeHierarchy(target, changes, currentCommandId, stamp, addedNodeMap);
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

        const changeType = 'attribute';
        // flatten changes
        if (!addedNodeMap.has(target)) {
          changes.push([currentCommandId, changeType as any, serial, stamp, idx()]);
        }
      }

      if (type === 'characterData') {
        const textChange = this.serializeNode(target);
        textChange.textContent = target.textContent;
        changes.push([currentCommandId, 'text', textChange, stamp, idx()]);
      }
    }

    for (const [node] of addedNodeMap) {
      // A batch of changes (setting innerHTML) will send nodes in a hierarchy instead of
      // individually so we need to extract child nodes into flat hierarchy
      const children = this.serializeChildren(node, addedNodeMap);
      for (const childData of children) {
        changes.push([currentCommandId, 'added', childData, stamp, idx()]);
      }
    }

    this.checkForStylesheetChanges(stamp);

    return changes;
  }

  private serializeHierarchy(
    node: Node,
    changes: IDomChangeEvent[],
    currentCommandId: number,
    stamp: string,
    addedNodeMap: Map<Node, INodeData>,
  ) {
    if (nodeTracker.has(node)) return this.serializeNode(node);

    const serial = this.serializeNode(node);
    serial.parentNodeId = nodeTracker.getId(node.parentNode);
    if (!serial.parentNodeId && node.parentNode) {
      const parentSerial = this.serializeHierarchy(
        node.parentNode,
        changes,
        currentCommandId,
        stamp,
        addedNodeMap,
      );

      serial.parentNodeId = parentSerial.id;
    }
    serial.previousSiblingId = nodeTracker.getId(node.previousSibling);
    if (!serial.previousSiblingId && node.previousSibling) {
      const previous = this.serializeHierarchy(
        node.previousSibling,
        changes,
        currentCommandId,
        stamp,
        addedNodeMap,
      );
      serial.previousSiblingId = previous.id;
    }
    changes.push([currentCommandId, 'added', serial, stamp, idx()]);
    addedNodeMap.set(node, serial);
    const childRecords = this.serializeChildren(node, addedNodeMap);
    for (const childData of childRecords) {
      changes.push([currentCommandId, 'added', childData, stamp, idx()]);
    }
    return serial;
  }

  private serializeChildren(node: Node, addedNodes: Map<Node, INodeData>) {
    const serialized: INodeData[] = [];

    for (const child of node.childNodes) {
      if (!nodeTracker.has(child)) {
        const serial = this.serializeNode(child);
        serial.parentNodeId = nodeTracker.getId(child.parentElement ?? child.getRootNode());
        serial.previousSiblingId = nodeTracker.getId(child.previousSibling);
        addedNodes.set(child, serial);
        serialized.push(serial, ...this.serializeChildren(child, addedNodes));
      }
    }

    for (const element of [node, ...node.childNodes] as Element[]) {
      if (element.tagName === 'STYLE') {
        this.trackStylesheet(element as HTMLStyleElement);
      }
      const shadowRoot = element.shadowRoot;
      if (shadowRoot && !nodeTracker.has(shadowRoot)) {
        const serial = this.serializeNode(shadowRoot);
        serial.parentNodeId = nodeTracker.getId(element);
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

    const id = nodeTracker.getId(node);
    if (id !== undefined) {
      return { id };
    }

    const data: INodeData = {
      nodeType: node.nodeType,
      id: nodeTracker.track(node),
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
if (window.commandId) {
  // @ts-ignore
  recorder.setCommandId(window.commandId);
  // @ts-ignore
  delete window.commandId;
}

Object.defineProperty(window, 'commandId', {
  set(value: number) {
    return recorder.setCommandId(value);
  },
});

function flushPageRecorder() {
  const changes = recorder.extractChanges();

  recorder.resetLists();
  return changes;
}
// @ts-ignore
window.flushPageRecorder = flushPageRecorder;

const interval = setInterval(() => {
  if (!lastUploadDate || new Date().getTime() - lastUploadDate.getTime() > 1e3) {
    // if we haven't uploaded in 1 second, make sure nothing is pending
    recorder.uploadChanges();
  }
}, 500);

window.addEventListener('beforeunload', () => {
  clearInterval(interval);
  recorder.disconnect();
});

window.addEventListener('DOMContentLoaded', () => recorder.onLoadEvent('DOMContentLoaded'));
window.addEventListener('load', () => recorder.onLoadEvent('load'));

const perfObserver = new PerformanceObserver(() => {
  recorder.onLoadEvent('LargestContentfulPaint');
});
perfObserver.observe({ type: 'largest-contentful-paint', buffered: true });

document.addEventListener('input', () => recorder.checkForPropertyChanges(), {
  capture: true,
  passive: true,
});

document.addEventListener('keydown', () => recorder.checkForPropertyChanges(), {
  capture: true,
  passive: true,
});

document.addEventListener('change', () => recorder.checkForPropertyChanges(), {
  capture: true,
  passive: true,
});

document.addEventListener('mousemove', e => recorder.trackMouse(MouseEventType.MOVE, e), {
  capture: true,
  passive: true,
});

document.addEventListener('mousedown', e => recorder.trackMouse(MouseEventType.DOWN, e), {
  capture: true,
  passive: true,
});

document.addEventListener('mouseup', e => recorder.trackMouse(MouseEventType.UP, e), {
  capture: true,
  passive: true,
});

document.addEventListener('mouseover', e => recorder.trackMouse(MouseEventType.OVER, e), {
  capture: true,
  passive: true,
});

document.addEventListener('mouseleave', e => recorder.trackMouse(MouseEventType.OUT, e), {
  capture: true,
  passive: true,
});

document.addEventListener('focusin', e => recorder.trackFocus('in', e), {
  capture: true,
  passive: true,
});

document.addEventListener('focusout', e => recorder.trackFocus('out', e), {
  capture: true,
  passive: true,
});

document.addEventListener('scroll', () => recorder.trackScroll(window.scrollX, window.scrollY), {
  capture: true,
  passive: true,
});

// need duplicate since this is a variable - not just a type
enum MouseEventType {
  MOVE = 0,
  DOWN = 1,
  UP = 2,
  OVER = 3,
  OUT = 4,
}
