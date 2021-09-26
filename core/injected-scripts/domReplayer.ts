// NOTE: do not use node dependencies

import type { IFrontendDomChangeEvent } from '@ulixee/hero-core/models/DomChangesTable';

declare global {
  interface Window {
    loadPaintEvents(paintEvents: IFrontendDomChangeEvent[][]);
    setPaintIndexRange(startIndex: number, endIndex: number);
    replayInteractions(...args: any[]);
    showReplayStatus(text: string);
    showReplayOverlay();
    hideReplayOverlay();
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
    this.loadedIndex = -1;
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
      document.addEventListener('DOMContentLoaded', () => this.applyDomChanges([]), { once: true });
      return;
    }

    for (const changeEvent of this.pendingDomChanges) {
      try {
        const frameIdPath = changeEvent.frameIdPath;
        if (frameIdPath && !isCurrentFrameIdPath(frameIdPath)) {
          this.delegateToSubframe(changeEvent);
        } else {
          this.replayDomEvent(changeEvent);
        }
      } catch (err) {
        debugLog('ERROR applying change', changeEvent, err);
      }
    }
    this.pendingDomChanges.length = 0;
  }

  private replayDomEvent(event: IFrontendDomChangeEvent): void {
    const { action } = event;
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
    if (elem.tagName === 'BODY' && overlayContainer) {
      elem.appendChild(overlayContainer);
    }
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
  const { textContent } = event;
  const href = textContent;

  if (!isMainFrame()) {
    debugLog(
      'Location: (new document) %s, frame: %s, idx: %s',
      href,
      event.frameIdPath,
      event.eventIndex,
    );
    if (window.location.href !== href) {
      window.location.href = href;
    }
    return;
  }

  window.scrollTo({ top: 0 });
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

function isCurrentFrameIdPath(frameIdPath: string): boolean {
  if (!window.selfFrameIdPath && isMainFrame()) {
    window.selfFrameIdPath = 'main';
  }
  if (!frameIdPath) return false;
  return window.selfFrameIdPath === frameIdPath;
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

/////// OVERLAYS  //////////////////////////////////////////////////////////////////////////////////////////////////////

let overlayNode: HTMLElement;
let overlayContainer: HTMLElement;
let overlayShadow: ShadowRoot;

let statusNode: HTMLElement;

window.showReplayStatus = function showReplayStatus(text: string) {
  if (document.body.children.length === 0) {
    statusNode = document.createElement('hero-status');
    const styleElement = document.createElement('style');
    styleElement.textContent = `
  hero-status {
    display:block;
    position: relative;
    top: 100px;
    margin: 0 auto;
    background: rgba(0,0,0,0.7);
    border-radius: 5px;
    text-transform: uppercase;
    width: 250px;
    text-align:center;
    color: white;
    font: 22px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont;
    padding: 10px;
    box-shadow: 3px 2px 4px rgba(0, 0, 0, 0.12), 2px 1px 3px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(0, 0, 0, 0.2);
  }`;
    document.body.appendChild(statusNode);
    document.body.appendChild(styleElement);
  }
  if (statusNode && statusNode.isConnected) {
    statusNode.innerText = text;
  }
};

window.hideReplayOverlay = function hideReplayOverlay() {
  overlayNode.classList.add('hide');
};

window.showReplayOverlay = function showReplayOverlay() {
  if (overlayNode) {
    if (!overlayContainer.isConnected) document.body.appendChild(overlayContainer);
    overlayNode.classList.remove('hide');
    return;
  }

  overlayContainer = document.createElement('hero-overlay');
  overlayContainer.style.zIndex = '2147483647';

  overlayNode = document.createElement('hero-mask');
  overlayNode.textContent = ' ';

  const spinner = document.createElement('hero-spinner');
  for (let i = 0; i < 12; i += 1) {
    const spoke = document.createElement('hero-spoke');
    spinner.appendChild(spoke);
  }
  overlayNode.appendChild(spinner);

  const styleElement = document.createElement('style');
  styleElement.textContent = `
  hero-mask {
    position: fixed;
    top: 0;
    right: 0;
    height: 100%;
    width: 100%;
    cursor: wait;
    background-color: #fff;
    opacity: 1;
  }
  hero-mask.hide {
    opacity: 0;
    transition-duration: 100ms;
    cursor: default;
    pointer-events: none;
  }

  hero-spinner {
    color: official;
    display: block;
    top: calc(50% - 40px);
    left:  calc(50% - 40px);
    position: relative;
    width: 80px;
    height: 80px;
  }
  hero-spinner hero-spoke {
    display:block;
    transform-origin: 40px 40px;
    animation: hero-spinner 0.5s linear infinite;
  }
  hero-spinner hero-spoke:after {
    content: " ";
    display: block;
    position: absolute;
    top: 3px;
    left: 37px;
    width: 6px;
    height: 18px;
    border-radius: 20%;
    background: #ddd;
  }
  hero-spinner hero-spoke:nth-child(1) {
    transform: rotate(0deg);
    animation-delay: -1.1s;
  }
  hero-spinner hero-spoke:nth-child(2) {
    transform: rotate(30deg);
    animation-delay: -1s;
  }
  hero-spinner hero-spoke:nth-child(3) {
    transform: rotate(60deg);
    animation-delay: -0.9s;
  }
  hero-spinner hero-spoke:nth-child(4) {
    transform: rotate(90deg);
    animation-delay: -0.8s;
  }
  hero-spinner hero-spoke:nth-child(5) {
    transform: rotate(120deg);
    animation-delay: -0.7s;
  }
  hero-spinner hero-spoke:nth-child(6) {
    transform: rotate(150deg);
    animation-delay: -0.6s;
  }
  hero-spinner hero-spoke:nth-child(7) {
    transform: rotate(180deg);
    animation-delay: -0.5s;
  }
  hero-spinner hero-spoke:nth-child(8) {
    transform: rotate(210deg);
    animation-delay: -0.4s;
  }
  hero-spinner hero-spoke:nth-child(9) {
    transform: rotate(240deg);
    animation-delay: -0.3s;
  }
  hero-spinner hero-spoke:nth-child(10) {
    transform: rotate(270deg);
    animation-delay: -0.2s;
  }
  hero-spinner hero-spoke:nth-child(11) {
    transform: rotate(300deg);
    animation-delay: -0.1s;
  }
  hero-spinner hero-spoke:nth-child(12) {
    transform: rotate(330deg);
    animation-delay: 0s;
  }
  @keyframes hero-spinner {
    0% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  `;

  overlayShadow = overlayContainer.attachShadow({ mode: 'closed' });
  overlayShadow.appendChild(overlayNode);
  overlayShadow.appendChild(styleElement);
  document.body.appendChild(overlayContainer);
};
