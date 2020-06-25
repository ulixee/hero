// NOTE: do not use node dependencies

import { ipcRenderer } from 'electron';
import { INodeData, IDomChangeEvent } from './interfaces/IDomChangeEvent';

const idMap = new Map<number, Node>();
const preserveElements = ['HTML', 'HEAD', 'BODY'];

ipcRenderer.on('reset-dom', event => {
  resetDom();
});

ipcRenderer.on('apply-dom-changes', (event, changeEvents) => {
  applyDomChanges(changeEvents);
});

function resetDom() {
  document.documentElement.innerHTML = '';
  document.addEventListener('click', handleOnClick, true);
}

function handleOnClick(e: any) {
  e.preventDefault();
  e.stopPropagation();
  return false;
}

function applyDomChanges(changeEvents: IDomChangeEvent[]) {
  for (const changeEvent of changeEvents) {
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
        console.log('ADDING: ', node);
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
