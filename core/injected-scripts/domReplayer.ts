// NOTE: do not use node dependencies

import type { IFrontendDomChangeEvent } from '@ulixee/hero-core/models/DomChangesTable';

declare global {
  interface Window {
    loadPaintEvents(paintEvents: IFrontendDomChangeEvent[][]);
    setPaintIndexRange(startIndex: number, endIndex: number);
    replayInteractions(...args: any[]);
    getIsMainFrame?: () => boolean;
    debugLogs: any[];
    debugToConsole: boolean;
    selfFrameIdPath: string;
    getNodeById(id: number): Node;
  }
}

// copied since we can't import data types
enum DomActionType {
  newDocument = 0,
  location = 1,
  added = 2,
  removed = 3,
  text = 4,
  attribute = 5,
  property = 6,
}

class DomReplayer {
  private paintEvents: IFrontendDomChangeEvent[][] = [];
  private loadedIndex = -1;

  private pendingDelegatedEventsByPath: { [frameIdPath: string]: IFrontendDomChangeEvent[] } = {};
  private pendingDomChanges: IFrontendDomChangeEvent[] = [];

  public loadPaintEvents(newPaintEvents: IFrontendDomChangeEvent[][]): void {
    this.paintEvents = newPaintEvents;
    debugLog('Loaded PaintEvents', newPaintEvents);
  }

  public setPaintIndexRange(startIndex: number, endIndex: number): void {
    if (endIndex === this.loadedIndex) return;
    debugLog('Setting paint index range', startIndex, endIndex, document.readyState);

    for (let i = startIndex; i <= endIndex; i += 1) {
      this.applyDomChanges(this.paintEvents[i]);
    }

    this.loadedIndex = endIndex;
  }

  private applyDomChanges(changeEvents: IFrontendDomChangeEvent[]): void {
    this.pendingDomChanges.push(...changeEvents);
    if (document.readyState !== 'complete') {
      document.onreadystatechange = () => this.applyDomChanges([]);
      return;
    }

    document.onreadystatechange = null;
    for (const changeEvent of this.pendingDomChanges) {
      try {
        this.replayDomEvent(changeEvent);
      } catch (err) {
        debugLog('ERROR applying change', changeEvent, err);
      }
    }
    this.pendingDomChanges.length = 0;
  }

  private replayDomEvent(event: IFrontendDomChangeEvent): void {
    if (!window.selfFrameIdPath && isMainFrame()) {
      window.selfFrameIdPath = 'main';
    }

    const { action, frameIdPath } = event;
    if (frameIdPath && frameIdPath !== window.selfFrameIdPath) {
      this.delegateToSubframe(event);
      return;
    }

    if (action === DomActionType.newDocument) return onNewDocument(event);
    if (action === DomActionType.location) return onLocation(event);

    if (isPreservedElement(event)) return;

    let node: Node;
    let parentNode: Node;
    try {
      parentNode = getNode(event.parentNodeId);
      node = deserializeNode(event, parentNode as Element);

      if (action === DomActionType.added) onNodeAdded(node, parentNode, event);
      if (action === DomActionType.removed) onNodeRemoved(node, parentNode, event);
      if (action === DomActionType.attribute) setNodeAttributes(node as Element, event);
      if (action === DomActionType.property) setNodeProperties(node as Element, event);
      if (action === DomActionType.text) node.textContent = event.textContent;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('ERROR: applying action', error.stack, { parentNode, node, event });
    }
  }

  private delegateToSubframe(event: IFrontendDomChangeEvent) {
    const { node, frameIdPath } = getDelegatedFrameRecipient(event.frameIdPath);
    if (!node) {
      // queue for pending events
      this.pendingDelegatedEventsByPath[frameIdPath] ??= [];
      this.pendingDelegatedEventsByPath[frameIdPath].push(event);
      debugLog('Frame: not loaded yet, queuing pending', frameIdPath);
      return;
    }

    const frame = this.getDelegatableFrame(event.action, node);
    if (!frame) return;

    const events = this.pendingDelegatedEventsByPath[frameIdPath] ?? [];
    events.push(event);
    delete this.pendingDelegatedEventsByPath[frameIdPath];

    frame.contentWindow.postMessage({ recipientFrameIdPath: frameIdPath, events }, '*');
  }

  private getDelegatableFrame(
    action: IFrontendDomChangeEvent['action'],
    node: Node,
  ): HTMLIFrameElement {
    const isNavigation = action === DomActionType.location || action === DomActionType.newDocument;

    if (isNavigation && node instanceof HTMLObjectElement) {
      return;
    }

    const frame = node as HTMLIFrameElement;
    if (!frame.contentWindow) {
      debugLog('Frame: without window', frame);
      return;
    }
    return frame;
  }

  static load() {
    const replayer = new DomReplayer();
    window.loadPaintEvents = replayer.loadPaintEvents.bind(replayer);
    window.setPaintIndexRange = replayer.setPaintIndexRange.bind(replayer);

    window.addEventListener('message', ev => {
      if (ev.data.recipientFrameIdPath && !window.selfFrameIdPath) {
        window.selfFrameIdPath = ev.data.recipientFrameIdPath;
      }
      replayer.applyDomChanges(ev.data.events);
    });
  }
}

DomReplayer.load();

/////// DELEGATION BETWEEN FRAMES   ////////////////////////////////////////////////////////////////////////////////////

function getDelegatedFrameRecipient(eventFrameIdPath: string): { node: Node; frameIdPath: string } {
  const childPath = eventFrameIdPath
    .replace(window.selfFrameIdPath, '')
    .split('_')
    .filter(Boolean)
    .map(Number);

  const childId = childPath.shift();
  const frameIdPath = `${window.selfFrameIdPath}_${childId}`;
  const node = getNode(childId);
  return { frameIdPath, node };
}

/////// PRESERVE HTML, BODY, HEAD ELEMS ////////////////////////////////////////////////////////////////////////////////

const preserveElements = new Set<string>(['HTML', 'HEAD', 'BODY']);
function isPreservedElement(event: IFrontendDomChangeEvent) {
  const { action, nodeId, nodeType } = event;

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
    const existing = getNode(nodeId);
    if (existing) tagName = (existing as Element).tagName;
  }
  if (!preserveElements.has(tagName)) return false;

  const elem = document.querySelector(tagName);
  if (!elem) {
    debugLog('Preserved element doesnt exist!', tagName);
    return true;
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
  }
  if (event.attributes) {
    setNodeAttributes(elem, event);
  }
  if (event.properties) {
    setNodeProperties(elem, event);
  }
  return true;
}

/////// APPLY PAINT CHANGES   //////////////////////////////////////////////////////////////////////////////////////////

function onNodeAdded(node: Node, parentNode: Node, event: IFrontendDomChangeEvent) {
  if (!parentNode) {
    debugLog('WARN: parent node id not found', event);
    return;
  }

  if (!event.previousSiblingId) {
    (parentNode as Element).prepend(node);
  } else {
    const previous = getNode(event.previousSiblingId);
    if (previous) {
      const next = previous.nextSibling;

      if (next) parentNode.insertBefore(node, next);
      else parentNode.appendChild(node);
    }
  }
}

function onNodeRemoved(node: Node, parentNode: Node, event: IFrontendDomChangeEvent) {
  if (!parentNode) {
    debugLog('WARN: parent node id not found', event);
    return;
  }
  if (parentNode.contains(node)) parentNode.removeChild(node);
}

function onNewDocument(event: IFrontendDomChangeEvent) {
  if (isMainFrame()) return;

  const { textContent } = event;
  const href = textContent;
  const newUrl = new URL(href);

  debugLog(
    'Location: (new document) %s, frame: %s, idx: %s',
    href,
    event.frameIdPath,
    event.eventIndex,
  );

  if (!isMainFrame()) {
    if (window.location.href !== href) {
      window.location.href = href;
    }
    return;
  }

  window.scrollTo({ top: 0 });

  if (document.documentElement) {
    document.documentElement.innerHTML = '';
    while (document.documentElement.previousSibling) {
      const prev = document.documentElement.previousSibling;
      if (prev === document.doctype) break;
      prev.remove();
    }
  }

  if (window.location.origin === newUrl.origin) {
    window.history.replaceState({}, 'Replay', href);
  }
}

function onLocation(event: IFrontendDomChangeEvent) {
  debugLog('Location: href=%s', event.textContent);
  window.history.replaceState({}, 'Replay', event.textContent);
}

function getNode(id: number) {
  if (id === null || id === undefined) return null;
  return NodeTracker.getWatchedNodeWithId(id, false);
}
window.getNodeById = getNode;

function setNodeAttributes(node: Element, data: IFrontendDomChangeEvent) {
  const attributes = data.attributes;
  if (!attributes) return;

  const namespaces = data.attributeNamespaces;

  for (const [name, value] of Object.entries(attributes)) {
    const ns = namespaces ? namespaces[name] : null;
    try {
      if (name === 'xmlns' || name.startsWith('xmlns') || node.tagName === 'HTML') {
        if (value === null) node.removeAttribute(name);
        else node.setAttribute(name, value as any);
      } else if (value === null) {
        node.removeAttributeNS(ns || null, name);
      } else {
        node.setAttributeNS(ns || null, name, value as any);
      }
    } catch (err) {
      if (
        !err.toString().includes('not a valid attribute name') &&
        !err.toString().includes('qualified name')
      )
        throw err;
    }
  }
}

function setNodeProperties(node: Element, data: IFrontendDomChangeEvent) {
  const properties = data.properties;
  if (!properties) return;
  for (const [name, value] of Object.entries(properties)) {
    if (name === 'sheet.cssRules') {
      const sheet = (node as HTMLStyleElement).sheet as CSSStyleSheet;
      const newRules = value as string[];
      let i = 0;
      for (i = 0; i < sheet.cssRules.length; i += 1) {
        const newRule = newRules[i];
        if (newRule !== sheet.cssRules[i].cssText) {
          sheet.deleteRule(i);
          if (newRule) sheet.insertRule(newRule, i);
        }
      }
      for (; i < newRules.length; i += 1) {
        sheet.insertRule(newRules[i], i);
      }
    } else {
      node[name] = value;
    }
  }
}

function deserializeNode(data: IFrontendDomChangeEvent, parent: Element): Node {
  if (data === null) return null;

  let node = getNode(data.nodeId);
  if (node) {
    setNodeProperties(node as Element, data);
    setNodeAttributes(node as Element, data);
    if (data.textContent) node.textContent = data.textContent;
    return node;
  }

  const SHADOW_NODE_TYPE = 40;
  if (parent && typeof parent.attachShadow === 'function' && data.nodeType === SHADOW_NODE_TYPE) {
    // NOTE: we just make all shadows open in replay
    node = parent.attachShadow({ mode: 'open' });
    NodeTracker.restore(data.nodeId, node);
    return node;
  }

  switch (data.nodeType) {
    case Node.COMMENT_NODE:
      node = document.createComment(data.textContent);
      break;

    case Node.TEXT_NODE:
      node = document.createTextNode(data.textContent);
      break;

    case Node.ELEMENT_NODE:
      if (!node) {
        if (data.namespaceUri) {
          node = document.createElementNS(data.namespaceUri, data.tagName);
        } else {
          node = document.createElement(data.tagName);
        }
      }
      if (node instanceof HTMLIFrameElement) {
        debugLog('Added Child Frame: frameIdPath=%s', `${window.selfFrameIdPath}_${data.nodeId}`);
      }
      if (data.tagName === 'NOSCRIPT') {
        const sheet = new CSSStyleSheet();
        // @ts-ignore
        sheet.replaceSync(
          `noscript { display:none !important; }
     noscript * { display:none !important; }`,
        );

        // @ts-ignore
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
      }
      (node as any).nodeId = data.nodeId;
      setNodeAttributes(node as Element, data);
      setNodeProperties(node as Element, data);
      if (data.textContent) {
        node.textContent = data.textContent;
      }

      break;
  }

  if (!node) throw new Error(`Unable to translate node! nodeType = ${data.nodeType}`);

  NodeTracker.restore(data.nodeId, node);

  return node;
}

function isMainFrame() {
  if ('isMainFrame' in window) return (window as any).isMainFrame;
  if ('getIsMainFrame' in window) return window.getIsMainFrame();
  return true;
}

/////// DEBUG LOGS   ///////////////////////////////////////////////////////////////////////////////////////////////////

function debugLog(message: string, ...args: any[]) {
  if (window.debugToConsole) {
    // eslint-disable-next-line prefer-rest-params,no-console
    console.log(...arguments);
  }
  window.debugLogs ??= [];
  window.debugLogs.push({ message, args });
}
