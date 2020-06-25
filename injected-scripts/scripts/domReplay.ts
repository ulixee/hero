// NOTE: do not use node dependencies

import { INodeData, IDomChangeEvent } from '../interfaces/IDomChangeEvent';

const idMap = new Map<number, Node>();

function getNode(id: number) {
  return idMap.get(id);
}

// @ts-ignore
// tslint:disable-next-line:only-arrow-functions
window.setDocumentId = function(documentId: number) {
  idMap.set(documentId, document);
};

const preserveElements = ['HTML', 'HEAD', 'BODY'];
// @ts-ignore
// tslint:disable-next-line:only-arrow-functions
window.applyDomChanges = function(changes: IDomChangeEvent[]) {
  for (const change of changes) {
    const data = change[2];

    if (preserveElements.includes(data.tagName)) {
      const elem = document.querySelector(data.tagName);
      idMap.set(data.id, elem);
      continue;
    }

    const node = deserializeNode(data);
    const parent = getNode(data.parentNodeId);
    if (!parent && (change[1] === 'added' || change[1] === 'removed')) {
      // tslint:disable-next-line:no-console
      console.log('WARN: parent node id not found', data);
      continue;
    }

    switch (change[1]) {
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
};

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
