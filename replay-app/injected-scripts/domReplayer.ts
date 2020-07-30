// NOTE: do not use node dependencies

import { ipcRenderer } from 'electron';
import { IDomChangeEvent, INodeData } from './interfaces/IDomChangeEvent';
import { IMouseEvent, IScrollRecord } from '~shared/interfaces/ISaSession';

const idMap = new Map<number, Node>();
const preserveElements = ['HTML', 'HEAD', 'BODY'];

ipcRenderer.on('dom:apply', (event, changeEvents, resultNodeIds, mouseEvent, scrollEvent) => {
  if (changeEvents) applyDomChanges(changeEvents);
  if (resultNodeIds !== undefined) highlightNodes(resultNodeIds);
  if (mouseEvent) updateMouse(mouseEvent);
  if (scrollEvent) updateScroll(scrollEvent);
});

let areClicksActive = false;
function handleOnClick(e: any) {
  if (areClicksActive) return true;
  e.preventDefault();
  e.stopPropagation();
  return false;
}
document.addEventListener('click', handleOnClick, true);

ipcRenderer.on('clicks:enable', (e, shouldEnable) => {
  areClicksActive = shouldEnable;
});

function applyDomChanges(changeEvents: IDomChangeEvent[]) {
  for (const changeEvent of changeEvents) {
    const [commandId, action, data] = changeEvent;
    if (action === 'newDocument') {
      if (location.href !== data.textContent) {
        console.log(
          'Document changed at command %s. New %s. Old %s',
          commandId,
          data.textContent,
          window.location.href,
        );
        idMap.clear();
        window.location.href = data.textContent;
      }
      continue;
    }

    if (action === 'location') {
      console.log('Location changed', commandId, data);
      window.history.replaceState({}, 'Replay', data.textContent);
      return;
    }

    if (preserveElements.includes(data.tagName)) {
      const elem = document.querySelector(data.tagName);
      idMap.set(data.id, elem);
      if (data.tagName === 'HEAD') document.head.appendChild(styleElement);
      continue;
    }
    if (data.nodeType === document.DOCUMENT_NODE) {
      idMap.set(data.id, document);
      continue;
    }
    if (data.nodeType === document.DOCUMENT_TYPE_NODE) {
      idMap.set(data.id, document.doctype);
      continue;
    }

    const node = deserializeNode(data);
    const parent = getNode(data.parentNodeId);
    if (!parent && (action === 'added' || action === 'removed')) {
      // tslint:disable-next-line:no-console
      console.log('WARN: parent node id not found', data);
      continue;
    }

    switch (action) {
      case 'added':
        let next: Node;
        if (getNode(data.previousSiblingId)) {
          next = getNode(data.previousSiblingId).nextSibling;
        }
        if (next) parent.insertBefore(node, next);
        else parent.appendChild(node);
        break;
      case 'removed':
        parent.removeChild(node);
        break;
      case 'attribute':
        setNodeAttributes(node as Element, data);
        break;
      case 'property':
        setNodeProperties(node as Element, data);
        break;
      case 'text':
        deserializeNode(data).textContent = data.textContent;
        break;
    }
  }
}

// HELPER FUNCTIONS ////////////////////

function getNode(id: number) {
  return idMap.get(id);
}

function setNodeAttributes(node: Element, data: INodeData) {
  if (!data.attributes) return;
  for (const [name, value] of Object.entries(data.attributes)) {
    node.setAttribute(name, value);
  }
}

function setNodeProperties(node: Element, data: INodeData) {
  if (!data.properties) return;
  for (const [name, value] of Object.entries(data.properties)) {
    node[name] = value;
  }
}

function deserializeNode(data: INodeData, parent?: Element): Node {
  if (data === null) return null;

  let node = getNode(data.id);
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
        node = document.createElement(data.tagName);
      }
      setNodeAttributes(node as Element, data);
      if (data.textContent) {
        node.textContent = data.textContent;
      }

      break;
  }

  if (!node) throw new Error(`Unable to translate node! nodeType = ${data.nodeType}`);

  idMap.set(data.id, node);

  if (parent) parent.appendChild(node);

  return node;
}

//////// DOM HIGHLIGHTER ///////////////////////////////////////////////////////////////////////////

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
  document.body.appendChild(hoverNode);
  return hoverNode;
}

function highlightNodes(nodeIds: number[]) {
  lastHighlightNodes = nodeIds;
  const length = nodeIds ? nodeIds.length : 0;
  try {
    minHighlightTop = 10e3;
    maxHighlightTop = -1;
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
const box = document.createElement('sa-mouse-pointer');

let isMouseInstalled = false;
function updateMouse(mouseEvent: IMouseEvent) {
  if (isMouseInstalled === false) {
    isMouseInstalled = true;
    document.body.appendChild(box);
  }
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

//// other events /////

function updateScroll(scrollEvent: IScrollRecord) {
  window.scroll({
    behavior: 'auto',
    top: scrollEvent.scrollY,
    left: scrollEvent.scrollX,
  });
}
