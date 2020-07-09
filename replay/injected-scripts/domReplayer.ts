// NOTE: do not use node dependencies

import { ipcRenderer } from 'electron';
import { INodeData, IDomChangeEvent } from './interfaces/IDomChangeEvent';

const idMap = new Map<number, Node>();
const preserveElements = ['HTML', 'HEAD', 'BODY'];

ipcRenderer.on('reset-dom', event => {
  resetDom();
});

ipcRenderer.on('dom:apply', (event, changeEvents, resultNodeIds) => {
  if (changeEvents) applyDomChanges(changeEvents);
  highlightNodes(resultNodeIds);
});

function resetDom() {
  idMap.clear();
  document.documentElement.innerHTML = '';
}

function handleOnClick(e: any) {
  e.preventDefault();
  e.stopPropagation();
  return false;
}
document.addEventListener('click', handleOnClick, true);

function applyDomChanges(changeEvents: IDomChangeEvent[]) {
  for (const changeEvent of changeEvents) {
    if (changeEvent[1] === 'newDocument') {
      resetDom();
      continue;
    }

    const data = changeEvent[2];
    if (preserveElements.includes(data.tagName)) {
      const elem = document.querySelector(data.tagName);
      idMap.set(data.id, elem);
      continue;
    }

    const node = deserializeNode(data);
    const parent = getNode(data.parentNodeId);
    if (!parent && (changeEvent[1] === 'added' || changeEvent[1] === 'removed')) {
      // tslint:disable-next-line:no-console
      console.log('WARN: parent node id not found', data);
      continue;
    }

    switch (changeEvent[1]) {
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

  if (!node) throw new Error('ouch');

  idMap.set(data.id, node);

  if (parent) parent.appendChild(node);

  return node;
}

//////// DOM HIGHLIGHTER ///////////////////////////////////////////////////////////////////////////

const highlightElements: HTMLDivElement[] = [];

const overflowBar = `<div style="width: 500px;background-color:#3498db;margin:0 auto; height: 100%;box-shadow: 3px 0 0 0 #3498db;">&nbsp;</div>`;

const showMoreUp = document.createElement('div');
showMoreUp.setAttribute('id', 'sa-more-up');
showMoreUp.setAttribute(
  'style',
  'width:100%; height:8px; position:fixed; top:0;pointer-events: none;',
);
showMoreUp.innerHTML = overflowBar;

const showMoreDown = document.createElement('div');
showMoreDown.setAttribute('id', 'sa-more-down');
showMoreDown.setAttribute(
  'style',
  'width:100%; height:8px; position:fixed; bottom:0;pointer-events: none;',
);
showMoreDown.innerHTML = overflowBar;

let maxHighlightTop = -1;
let minHighlightTop = 10e3;

function buildHover() {
  const hoverNode = document.createElement('div');
  hoverNode.setAttribute('class', 'sa-highlight');
  hoverNode.setAttribute(
    'style',
    'z-index:10000;position:absolute;box-shadow: 1px 1px 3px 0 #3498db;border-radius:3px;border:1px solid #3498db;padding:5px;pointer-events: none;',
  );
  highlightElements.push(hoverNode);
  document.body.appendChild(hoverNode);
  return hoverNode;
}

function highlightNodes(nodeIds: number[]) {
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

      if (!hoverNode.parentElement) {
        document.body.appendChild(hoverNode);
      }
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
