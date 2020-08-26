// NOTE: do not use node dependencies

import { IDomChangeEvent } from '~shared/interfaces/IDomChangeEvent';
import { IMouseEvent, IScrollRecord } from '~shared/interfaces/ISaSession';

const idMap = new Map<number, Node>();
const preserveElements = ['HTML', 'HEAD', 'BODY'];

// @ts-ignore
window.replayEvents = async function replayEvents(
  changeEvents,
  resultNodeIds,
  mouseEvent,
  scrollEvent,
) {
  if (changeEvents) await applyDomChanges(changeEvents);
  if (resultNodeIds !== undefined) highlightNodes(resultNodeIds);
  if (mouseEvent) updateMouse(mouseEvent);
  if (scrollEvent) updateScroll(scrollEvent);
};

function cancelEvent(e: Event) {
  e.preventDefault();
  e.stopPropagation();
  return false;
}

document.addEventListener('click', cancelEvent, true);
document.addEventListener('submit', cancelEvent, true);

window.addEventListener('resize', () => {
  if (lastHighlightNodes) highlightNodes(lastHighlightNodes);
  if (lastMouseEvent) updateMouse(lastMouseEvent);
});

let onLoad: () => void;
window.addEventListener('DOMContentLoaded', () => {
  if (onLoad) onLoad();
});

async function applyDomChanges(changeEvents: IDomChangeEvent[]) {
  for (const changeEvent of changeEvents) {
    // @ts-ignore
    const { nodeId, commandId, action, textContent } = changeEvent;
    if (action === 'newDocument') {
      if (window.location.href !== textContent || commandId === -1) {
        await resetLocation(textContent, commandId);
      }
      continue;
    }

    if (action === 'location') {
      console.log('Location changed', commandId, changeEvent);
      window.history.replaceState({}, 'Replay', textContent);
      continue;
    }

    const { nodeType, parentNodeId, tagName } = changeEvent;
    if (preserveElements.includes(tagName)) {
      const elem = window.document.querySelector(tagName);
      if (!elem) {
        console.log('Preserved element doesnt exist!', tagName);
        continue;
      }
      idMap.set(nodeId, elem);
    }
    if (nodeType === document.DOCUMENT_NODE) {
      idMap.set(nodeId, document);
    }
    if (nodeType === document.DOCUMENT_TYPE_NODE) {
      idMap.set(nodeId, document.doctype);
      continue;
    }

    let node: Node;
    let parentNode: Node;
    try {
      node = deserializeNode(changeEvent);
      parentNode = getNode(parentNodeId);
      if (!parentNode && !parentNodeId && action === 'added') {
        parentNode = document;
      }
      if (!parentNode && (action === 'added' || action === 'removed')) {
        // tslint:disable-next-line:no-console
        console.log('WARN: parent node id not found', changeEvent);
        continue;
      }
      if (node && preserveElements.includes((node as Element).tagName)) {
        if (action === 'removed') {
          console.log('WARN: script trying to remove preserved node', changeEvent);
          continue;
        }
        if (action === 'added') {
          if (changeEvent.attributes) {
            setNodeAttributes(node as any, changeEvent);
          }
          if (changeEvent.properties) {
            setNodeProperties(node as any, changeEvent);
          }
          (node as Element).innerHTML = '';
          continue;
        }
      }

      switch (action) {
        case 'added':
          let next: Node;
          if (!changeEvent.previousSiblingId) {
            (parentNode as Element).prepend(node);
          } else if (getNode(changeEvent.previousSiblingId)) {
            next = getNode(changeEvent.previousSiblingId).nextSibling;
            if (next) parentNode.insertBefore(node, next);
            else parentNode.appendChild(node);
          }

          break;
        case 'removed':
          parentNode.removeChild(node);
          break;
        case 'attribute':
          setNodeAttributes(node as Element, changeEvent);
          break;
        case 'property':
          setNodeProperties(node as Element, changeEvent);
          break;
        case 'text':
          deserializeNode(changeEvent).textContent = textContent;
          break;
      }
    } catch (error) {
      console.log('ERROR applying action', error.stack, parentNode, node, changeEvent);
    }
  }
}

// HELPER FUNCTIONS ////////////////////

async function resetLocation(href: string, commandId: number) {
  const newUrl = new URL(href);
  console.log(
    'Document changed. (Command %s. %s ==> %s). Keep origin? %s',
    commandId === -1 ? 'load' : commandId,
    window.location.href,
    href,
    window.location.origin === newUrl.origin,
  );

  if (window.location.origin === newUrl.origin) {
    window.history.replaceState({}, 'Replay', href);
    window.scrollTo({ top: 0 });
    document.documentElement.innerHTML = '';
    idMap.clear();
    while (document.documentElement.previousSibling) {
      const prev = document.documentElement.previousSibling;
      if (prev === document.doctype) break;
      prev.remove();
    }
    return;
  }

  const loadPromise = new Promise(resolve => () => {
    onLoad = resolve;
  });
  // if it's an origin change, we have to change page
  window.location.href = newUrl.href;
  await loadPromise;
}
function getNode(id: number) {
  if (id === null || id === undefined) return null;
  return idMap.get(id);
}

function setNodeAttributes(node: Element, data: IDomChangeEvent) {
  if (!data.attributes) return;
  for (const [name, value] of Object.entries(data.attributes)) {
    const ns = data.attributeNamespaces ? data.attributeNamespaces[name] : null;
    node.setAttributeNS(ns, name, value);
  }
}

function setNodeProperties(node: Element, data: IDomChangeEvent) {
  if (!data.properties) return;
  for (const [name, value] of Object.entries(data.properties)) {
    node[name] = value;
  }
}

function deserializeNode(data: IDomChangeEvent, parent?: Element): Node {
  if (data === null) return null;

  let node = getNode(data.nodeId);
  if (node) return node;

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
      setNodeAttributes(node as Element, data);
      if (data.textContent) {
        node.textContent = data.textContent;
      }

      break;
  }

  if (!node) throw new Error(`Unable to translate node! nodeType = ${data.nodeType}`);

  idMap.set(data.nodeId, node);

  if (parent) parent.appendChild(node);

  return node;
}

/////// / DOM HIGHLIGHTER ///////////////////////////////////////////////////////////////////////////

const styleElement = document.createElement('style');
styleElement.innerHTML = `
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
  
  sa-overflow-bar {
    width: 500px;
    background-color:#3498db;
    margin:0 auto; 
    height: 100%;
    box-shadow: 3px 0 0 0 #3498db;
    display:block;
  }
  
  sa-overflow {
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
`;

const highlightElements: any[] = [];

const overflowBar = `<sa-overflow-bar>&nbsp;</sa-overflow-bar>`;

const showMoreUp = document.createElement('sa-overflow');
showMoreUp.setAttribute('style', 'top:0;');
showMoreUp.innerHTML = overflowBar;

const showMoreDown = document.createElement('sa-overflow');
showMoreDown.setAttribute('style', 'bottom:0;');
showMoreDown.innerHTML = overflowBar;

let maxHighlightTop = -1;
let minHighlightTop = 10e3;
let lastHighlightNodes: number[] = [];

function buildHover() {
  const hoverNode = document.createElement('sa-highlight');
  highlightElements.push(hoverNode);
  document.head.appendChild(styleElement);
  document.body.appendChild(hoverNode);
  return hoverNode;
}

function highlightNodes(nodeIds: number[]) {
  lastHighlightNodes = nodeIds;
  const length = nodeIds ? nodeIds.length : 0;
  try {
    minHighlightTop = 10e3;
    maxHighlightTop = -1;
    document.head.appendChild(styleElement);
    for (let i = 0; i < length; i += 1) {
      const node = idMap.get(nodeIds[i]);
      const hoverNode = i >= highlightElements.length ? buildHover() : highlightElements[i];
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

      document.body.appendChild(hoverNode);
    }

    checkOverflows();
    for (let i = length; i < highlightElements.length; i += 1) {
      highlightElements[i].remove();
    }
  } catch (err) {
    console.log(err);
  }
}

function checkOverflows() {
  if (maxHighlightTop > window.innerHeight + window.scrollY) {
    document.body.appendChild(showMoreDown);
  } else {
    showMoreDown.remove();
  }

  if (minHighlightTop < window.scrollY) {
    document.body.appendChild(showMoreUp);
  } else {
    showMoreUp.remove();
  }
}

document.addEventListener('scroll', () => checkOverflows());

/////// mouse ///////
let lastMouseEvent: IMouseEvent;
const box = document.createElement('sa-mouse-pointer');

function updateMouse(mouseEvent: IMouseEvent) {
  lastMouseEvent = mouseEvent;
  document.body.appendChild(box);
  if (mouseEvent.pageX !== undefined) {
    box.style.left = `${mouseEvent.pageX}px`;
    box.style.top = `${mouseEvent.pageY}px`;
  }
  if (mouseEvent.buttons !== undefined) {
    for (let i = 0; i < 5; i += 1) {
      box.classList.toggle(`button-${i}`, (mouseEvent.buttons & (1 << i)) !== 0);
    }
  }
}

// // other events /////

function updateScroll(scrollEvent: IScrollRecord) {
  window.scroll({
    behavior: 'auto',
    top: scrollEvent.scrollY,
    left: scrollEvent.scrollX,
  });
}
