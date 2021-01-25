// NOTE: do not use node dependencies

import { IFrontendDomChangeEvent } from '~shared/interfaces/IDomChangeEvent';
import { IFrontendMouseEvent, IScrollRecord } from '~shared/interfaces/ISaSession';

const SHADOW_NODE_TYPE = 40;

let maxHighlightTop = -1;
let minHighlightTop = 10e3;
let replayNode: HTMLElement;
let replayShadow: ShadowRoot;
let frameNodePath: string;
let lastHighlightNodes: number[] = [];
const idMap = new Map<number, Node>();
const domChangeList = [];

const logDebugToConsole = false;
const debugLogs = [];

window.debugLogs = debugLogs;
window.idMap = idMap;

function debugLog(message: string, ...args: any[]) {
  if (logDebugToConsole) {
    console.log(...arguments);
  }
  debugLogs.push({ message, args });
}

const isMainFrame = window.isMainFrame ?? true;
if (isMainFrame) {
  frameNodePath = 'main';

  if (document && document.addEventListener) {
    document.addEventListener('DOMContentLoaded', () => {
      debugLog('DOMContentLoaded');
    });
  }
}

window.replayEvents = function replayEvents(changeEvents, resultNodeIds, mouseEvent, scrollEvent) {
  createReplayItems();
  debugLog(
    'Events: changes=%s, highlighted=%s, hasMouse=%s, hasScroll=%s',
    changeEvents?.length ?? 0,
    resultNodeIds?.length ?? 0,
    !!mouseEvent,
    !!scrollEvent,
  );
  if (changeEvents) applyDomChanges(changeEvents);
  if (resultNodeIds !== undefined) highlightNodes(resultNodeIds);
  if (mouseEvent) updateMouse(mouseEvent);
  if (scrollEvent) updateScroll(scrollEvent);
  if (mouseEvent || scrollEvent || resultNodeIds) {
    document.body.appendChild(replayNode);
  }
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
  const { action, textContent, frameIdPath, nodeId } = event;
  if (frameIdPath && frameIdPath !== frameNodePath) {
    delegateToSubframe(event);
    return;
  }

  if (action === 'newDocument') {
    onNewDocument(event);
    return;
  }

  if (action === 'location') {
    debugLog('Location: href=%s', event.textContent);
    window.history.replaceState({}, 'Replay', textContent);
    return;
  }

  if (isPreservedElement(event)) return;
  const { parentNodeId, tagName } = event;

  if (tagName && tagName.toLowerCase() === 'noscript') {
    if (!event.attributes) event.attributes = {};
    if (event.attributes.style) event.attributes.style += ';display:none';
    else event.attributes.style = 'display:none';
  }

  let node: Node;
  let parentNode: Node;
  try {
    parentNode = getNode(parentNodeId);
    node = deserializeNode(event, parentNode as Element);

    if (!parentNode && (action === 'added' || action === 'removed')) {
      debugLog('WARN: parent node id not found', event);
      return;
    }

    switch (action) {
      case 'added':
        if (!event.previousSiblingId) {
          (parentNode as Element).prepend(node);
        } else if (getNode(event.previousSiblingId)) {
          const next = getNode(event.previousSiblingId).nextSibling;

          if (next) parentNode.insertBefore(node, next);
          else parentNode.appendChild(node);
        }

        break;
      case 'removed':
        if (parentNode.contains(node)) parentNode.removeChild(node);
        break;
      case 'attribute':
        setNodeAttributes(node as Element, event);
        break;
      case 'property':
        setNodeProperties(node as Element, event);
        break;
      case 'text':
        node.textContent = textContent;
        break;
    }
  } catch (error) {
    console.error('ERROR: applying action', error.stack, parentNode, node, event);
  }
}

/////// PRESERVE HTML, BODY, HEAD ELEMS ////////////////////////////////////////////////////////////////////////////////

const preserveElements = new Set<string>(['HTML', 'HEAD', 'BODY']);
function isPreservedElement(event: IFrontendDomChangeEvent) {
  const { action, nodeId, nodeType, tagName } = event;

  if (nodeType === document.DOCUMENT_NODE) {
    idMap.set(nodeId, document);
    return true;
  }

  if (nodeType === document.DOCUMENT_TYPE_NODE) {
    idMap.set(nodeId, document.doctype);
    return true;
  }

  if (!preserveElements.has(event.tagName)) return false;

  const elem = document.querySelector(tagName);
  if (!elem) {
    debugLog('Preserved element doesnt exist!', tagName);
    return true;
  }

  idMap.set(nodeId, elem);
  if (action === 'removed') {
    elem.innerHTML = '';
    for (const attr of elem.attributes) {
      elem.removeAttributeNS(attr.name, attr.namespaceURI);
      elem.removeAttribute(attr.name);
    }
    debugLog('WARN: script trying to remove preserved node', event, elem);
    return true;
  }

  if (action === 'added') {
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

  const node = idMap.get(childId);
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
    (event.action === 'location' || event.action === 'newDocument') &&
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

  if (!isMainFrame) {
    window.location.href = href;
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
  return idMap.get(id);
}

function setNodeAttributes(node: Element, data: IFrontendDomChangeEvent) {
  if (!data.attributes) return;
  for (const [name, value] of Object.entries(data.attributes)) {
    const ns = data.attributeNamespaces ? data.attributeNamespaces[name] : null;
    try {
      if (name === 'xmlns' || name.startsWith('xmlns') || node.tagName === 'HTML') {
        if (value === null) node.removeAttribute(name);
        else node.setAttribute(name, value);
      } else if (value === null) {
        node.removeAttributeNS(ns || null, name);
      } else {
        node.setAttributeNS(ns || null, name, value);
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
  if (!data.properties) return;
  for (const [name, value] of Object.entries(data.properties)) {
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
  if (node) return node;

  if (parent && typeof parent.attachShadow === 'function' && data.nodeType === SHADOW_NODE_TYPE) {
    // NOTE: we just make all shadows open in replay
    node = parent.attachShadow({ mode: 'open' });
    idMap.set(data.nodeId, node);
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
      (node as any).nodeId = data.nodeId;
      setNodeAttributes(node as Element, data);
      setNodeProperties(node as Element, data);
      if (data.textContent) {
        node.textContent = data.textContent;
      }

      break;
  }

  if (!node) throw new Error(`Unable to translate node! nodeType = ${data.nodeType}`);

  idMap.set(data.nodeId, node);

  return node;
}

/////// DOM HIGHLIGHTER  ///////////////////////////////////////////////////////////////////////////////////////////////

const highlightElements: HTMLElement[] = [];

let showMoreUp: HTMLElement;
let showMoreDown: HTMLElement;
function checkOverflows() {
  createReplayItems();
  if (maxHighlightTop > window.innerHeight + window.scrollY) {
    replayShadow.appendChild(showMoreDown);
  } else {
    showMoreDown.remove();
  }

  if (minHighlightTop < window.scrollY) {
    replayShadow.appendChild(showMoreUp);
  } else {
    showMoreUp.remove();
  }
}

function highlightNodes(nodeIds: number[]) {
  lastHighlightNodes = nodeIds;
  const length = nodeIds ? nodeIds.length : 0;
  try {
    minHighlightTop = 10e3;
    maxHighlightTop = -1;
    for (let i = 0; i < length; i += 1) {
      const node = idMap.get(nodeIds[i]);
      let hoverNode = highlightElements[i];
      if (!hoverNode) {
        hoverNode = document.createElement('sa-highlight');
        highlightElements.push(hoverNode);
      }
      if (!node) {
        highlightElements[i].remove();
        continue;
      }
      const element = node.nodeType === node.TEXT_NODE ? node.parentElement : (node as Element);
      const bounds = element.getBoundingClientRect();
      bounds.x += window.scrollX;
      bounds.y += window.scrollY;
      hoverNode.style.width = `${bounds.width}px`;
      hoverNode.style.height = `${bounds.height}px`;
      hoverNode.style.top = `${bounds.top - 5}px`;
      hoverNode.style.left = `${bounds.left - 5}px`;

      if (bounds.y > maxHighlightTop) maxHighlightTop = bounds.y;
      if (bounds.y + bounds.height < minHighlightTop) minHighlightTop = bounds.y + bounds.height;
      replayShadow.appendChild(hoverNode);
    }

    checkOverflows();
    for (let i = length; i < highlightElements.length; i += 1) {
      highlightElements[i].remove();
    }
  } catch (err) {
    console.error(err);
  }
}

/////// MOUSE EVENTS ///////////////////////////////////////////////////////////////////////////////////////////////////

let lastMouseEvent: IFrontendMouseEvent;
let mouse: HTMLElement;

const elementAbsolutes = new Map<HTMLElement, { top: number; left: number }>();
const elementDisplayCache = new Map<HTMLElement, string>();
const offsetsAtPageY = new Map<number, { pageOffset: number; elementOffset: number }>();
const offsetBlock = 100;

function updateMouse(mouseEvent: IFrontendMouseEvent) {
  lastMouseEvent = mouseEvent;
  if (mouseEvent.pageX !== undefined) {
    const targetNode = getNode(mouseEvent.targetNodeId) as HTMLElement;

    let pageY = mouseEvent.pageY;

    if (mouseEvent.targetNodeId && targetNode) {
      const pageOffsetsYKey = pageY - (pageY % offsetBlock);
      // try last two offset zones
      const pageOffsetsAtHeight =
        offsetsAtPageY.get(pageOffsetsYKey) ?? offsetsAtPageY.get(pageOffsetsYKey - offsetBlock);
      // if there's a page translation we've found that's closer than this one, use it
      if (
        pageOffsetsAtHeight &&
        Math.abs(pageOffsetsAtHeight.elementOffset) < Math.abs(mouseEvent.offsetY)
      ) {
        pageY = mouseEvent.pageY + pageOffsetsAtHeight.pageOffset;
      } else {
        const { top } = getElementAbsolutePosition(targetNode);
        pageY = Math.round(mouseEvent.offsetY + top);
        const offsetAtYHeightEntry = offsetsAtPageY.get(pageOffsetsYKey);
        if (
          !offsetAtYHeightEntry ||
          Math.abs(offsetAtYHeightEntry.elementOffset) > Math.abs(mouseEvent.offsetY)
        ) {
          offsetsAtPageY.set(pageOffsetsYKey, {
            elementOffset: mouseEvent.offsetY,
            pageOffset: pageY - mouseEvent.pageY,
          });
        }
      }
    }

    mouse.style.left = `${mouseEvent.pageX}px`;
    mouse.style.top = `${pageY}px`;
    mouse.style.display = 'block';
  }
  if (mouseEvent.buttons !== undefined) {
    for (let i = 0; i < 5; i += 1) {
      mouse.classList.toggle(`button-${i}`, (mouseEvent.buttons & (1 << i)) !== 0);
    }
  }
}

function getElementAbsolutePosition(element: HTMLElement) {
  const offsetElement = getOffsetElement(element);
  if (!elementAbsolutes.has(offsetElement)) {
    const rect = offsetElement.getBoundingClientRect();
    const absoluteX = Math.round(rect.left + window.scrollX);
    const absoluteY = Math.round(rect.top + window.scrollY);
    elementAbsolutes.set(offsetElement, { top: absoluteY, left: absoluteX });
  }
  return elementAbsolutes.get(offsetElement);
}

function getOffsetElement(element: HTMLElement) {
  while (element.tagName !== 'BODY') {
    if (!elementDisplayCache.has(element)) {
      elementDisplayCache.set(element, getComputedStyle(element).display);
    }
    const display = elementDisplayCache.get(element);
    if (display === 'inline') {
      const offsetParent = element.parentElement as HTMLElement;
      if (!offsetParent) break;
      element = offsetParent;
    } else {
      break;
    }
  }
  return element;
}

function updateScroll(scrollEvent: IScrollRecord) {
  window.scroll({
    behavior: 'auto',
    top: scrollEvent.scrollY,
    left: scrollEvent.scrollX,
  });
}

/////// BUILD UI ELEMENTS //////////////////////////////////////////////////////////////////////////////////////////////

let isInitialized = false;
function createReplayItems() {
  if (!isMainFrame || isInitialized) return;
  isInitialized = true;

  replayNode = document.createElement('sa-replay');
  replayNode.style.zIndex = '10000000';

  replayShadow = replayNode.attachShadow({ mode: 'closed' });

  showMoreUp = document.createElement('sa-overflow');
  showMoreUp.style.top = '0';
  showMoreUp.innerHTML = `<sa-overflow-bar>&nbsp;</sa-overflow-bar>`;

  showMoreDown = document.createElement('sa-overflow');
  showMoreDown.style.bottom = '0';
  showMoreDown.innerHTML = `<sa-overflow-bar>&nbsp;</sa-overflow-bar>`;

  const styleElement = document.createElement('style');
  styleElement.textContent = `
  sa-overflow-bar {
    width: 500px;
    background-color:#3498db;
    margin:0 auto;
    height: 100%;
    box-shadow: 3px 0 0 0 #3498db;
    display:block;
  }

  sa-overflow {
    z-index:10000;
    display:block;
    width:100%;
    height:8px;
    position:fixed;
    pointer-events: none;
  }

  sa-highlight {
    z-index:10000;
    position:absolute;
    box-shadow: 1px 1px 3px 0 #3498db;
    border-radius:3px;
    border:1px solid #3498db;
    padding:5px;
    pointer-events: none;
  }

  sa-mouse-pointer {
    pointer-events: none;
    position: absolute;
    top: 0;
    z-index: 10000;
    left: 0;
    width: 20px;
    height: 20px;
    background: rgba(0,0,0,.4);
    border: 1px solid white;
    border-radius: 10px;
    margin: -10px 0 0 -10px;
    padding: 0;
    transition: background .2s, border-radius .2s, border-color .2s;
  }
  sa-mouse-pointer.button-1 {
    transition: none;
    background: rgba(0,0,0,0.9);
  }
  sa-mouse-pointer.button-2 {
    transition: none;
    border-color: rgba(0,0,255,0.9);
  }
  sa-mouse-pointer.button-3 {
    transition: none;
    border-radius: 4px;
  }
  sa-mouse-pointer.button-4 {
    transition: none;
    border-color: rgba(255,0,0,0.9);
  }
  sa-mouse-pointer.button-5 {
    transition: none;
    border-color: rgba(0,255,0,0.9);
  }
`;
  replayShadow.appendChild(styleElement);

  mouse = document.createElement('sa-mouse-pointer');
  mouse.style.display = 'none';
  replayShadow.appendChild(mouse);

  function cancelEvent(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  document.addEventListener('click', cancelEvent, true);
  document.addEventListener('submit', cancelEvent, true);
  document.addEventListener('scroll', () => checkOverflows());
  window.addEventListener('resize', () => {
    if (lastHighlightNodes) highlightNodes(lastHighlightNodes);
    if (lastMouseEvent) updateMouse(lastMouseEvent);
  });
}

if (isMainFrame) {
  createReplayItems();
}
