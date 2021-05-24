// NOTE: do not use node dependencies

import type { IFrontendDomChangeEvent } from '@secret-agent/core/models/DomChangesTable';

declare global {
  interface Window {
    replayDomChanges(...args: any[]);
    replayInteractions(...args: any[]);
    getIsMainFrame?: () => boolean;
    debugLogs: any[];
    debugToConsole: boolean;
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

const SHADOW_NODE_TYPE = 40;

let frameNodePath: string;
const domChangeList = [];

if (!window.debugLogs) window.debugLogs = [];

function isMainFrame() {
  if ('isMainFrame' in window) return (window as any).isMainFrame;
  if ('getIsMainFrame' in window) return window.getIsMainFrame();
  return true;
}

function debugLog(message: string, ...args: any[]) {
  if (window.debugToConsole) {
    // eslint-disable-next-line prefer-rest-params,no-console
    console.log(...arguments);
  }
  window.debugLogs.push({ message, args });
}

window.replayDomChanges = function replayDomChanges(changeEvents: IFrontendDomChangeEvent[]) {
  if (changeEvents) applyDomChanges(changeEvents);
};

window.addEventListener('message', ev => {
  if (ev.data.frameNodePath) {
    frameNodePath = ev.data.frameNodePath;
  }
  const event = ev.data.event;
  replayDomEvent(event);
});

function applyDomChanges(changeEvents: IFrontendDomChangeEvent[]) {
  const toProcess = domChangeList.concat(changeEvents);
  domChangeList.length = 0;

  for (const changeEvent of toProcess) {
    try {
      replayDomEvent(changeEvent);
    } catch (err) {
      debugLog('ERROR applying change', changeEvent, err);
    }
  }
}

/////// DOM REPLAYER ///////////////////////////////////////////////////////////////////////////////////////////////////

function replayDomEvent(event: IFrontendDomChangeEvent) {
  if (!frameNodePath) {
    if (isMainFrame() ?? true) {
      frameNodePath = 'main';
    }
  }

  const { action, textContent, frameIdPath } = event;
  if (frameIdPath && frameIdPath !== frameNodePath) {
    delegateToSubframe(event);
    return;
  }

  if (action === DomActionType.newDocument) {
    onNewDocument(event);
    return;
  }

  if (action === DomActionType.location) {
    debugLog('Location: href=%s', event.textContent);
    window.history.replaceState({}, 'Replay', textContent);
    return;
  }

  if (isPreservedElement(event)) return;
  const { parentNodeId } = event;

  let node: Node;
  let parentNode: Node;
  try {
    parentNode = getNode(parentNodeId);
    node = deserializeNode(event, parentNode as Element);

    if (!parentNode && (action === DomActionType.added || action === DomActionType.removed)) {
      debugLog('WARN: parent node id not found', event);
      return;
    }

    switch (action) {
      case DomActionType.added:
        if (!event.previousSiblingId) {
          (parentNode as Element).prepend(node);
        } else if (getNode(event.previousSiblingId)) {
          const next = getNode(event.previousSiblingId).nextSibling;

          if (next) parentNode.insertBefore(node, next);
          else parentNode.appendChild(node);
        }

        break;
      case DomActionType.removed:
        if (parentNode.contains(node)) parentNode.removeChild(node);
        break;
      case DomActionType.attribute:
        setNodeAttributes(node as Element, event);
        break;
      case DomActionType.property:
        setNodeProperties(node as Element, event);
        break;
      case DomActionType.text:
        node.textContent = textContent;
        break;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('ERROR: applying action', error.stack, parentNode, node, event);
  }
}

/////// PRESERVE HTML, BODY, HEAD ELEMS ////////////////////////////////////////////////////////////////////////////////

const preserveElements = new Set<string>(['HTML', 'HEAD', 'BODY']);
function isPreservedElement(event: IFrontendDomChangeEvent) {
  const { action, nodeId, nodeType } = event;

  if (nodeType === document.DOCUMENT_NODE) {
    NodeTracker.restore(nodeId, document);
    return true;
  }

  if (nodeType === document.DOCUMENT_TYPE_NODE) {
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

/////// DELEGATION BETWEEN FRAMES   ////////////////////////////////////////////////////////////////////////////////////

const pendingFrameCreationEvents = new Map<
  string,
  { frameNodePath: string; event: IFrontendDomChangeEvent }[]
>();
function delegateToSubframe(event: IFrontendDomChangeEvent) {
  const childPath = event.frameIdPath
    .replace(frameNodePath, '')
    .split('_')
    .filter(Boolean)
    .map(Number);

  const childId = childPath.shift();
  const childFrameNodePath = `${frameNodePath}_${childId}`;

  const node = getNode(childId);
  if (!node) {
    if (!pendingFrameCreationEvents.has(childFrameNodePath)) {
      pendingFrameCreationEvents.set(childFrameNodePath, []);
    }
    // queue for pending events
    pendingFrameCreationEvents
      .get(childFrameNodePath)
      .push({ frameNodePath: childFrameNodePath, event });
    debugLog('Frame: not loaded yet, queuing pending', childFrameNodePath);
    return;
  }

  if (
    (event.action === DomActionType.location || event.action === DomActionType.newDocument) &&
    node instanceof HTMLObjectElement
  ) {
    return;
  }

  const frame = node as HTMLIFrameElement;
  if (!frame.contentWindow) {
    debugLog('Frame: without window', frame);
    return;
  }
  if (pendingFrameCreationEvents.has(childFrameNodePath)) {
    for (const ev of pendingFrameCreationEvents.get(childFrameNodePath)) {
      frame.contentWindow.postMessage(ev, '*');
    }
    pendingFrameCreationEvents.delete(childFrameNodePath);
  }

  frame.contentWindow.postMessage({ frameNodePath: childFrameNodePath, event }, '*');
}

function onNewDocument(event: IFrontendDomChangeEvent) {
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
        debugLog('Frame: frameNodePath=%s', `${frameNodePath}_${data.nodeId}`);
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
