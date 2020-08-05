// NOTE: do not use node dependencies

import { INodeData, IDomChangeEvent } from '../interfaces/IDomChangeEvent';

const idMap = new Map<number, Node>();

// @ts-ignore
// tslint:disable-next-line:only-arrow-functions
window.setDocumentId = function(documentId: number) {
  idMap.set(documentId, document);
};

const preserveElements = ['HTML', 'HEAD', 'BODY'];
// @ts-ignore
// tslint:disable-next-line:only-arrow-functions
window.applyDomChanges = function(changeEvents: IDomChangeEvent[]) {
  for (const changeEvent of changeEvents) {
    const [commandId, action, data] = changeEvent;
    if (action === 'newDocument') {
      if (location.href !== data.textContent) {
        console.log(
          'Document changed. (Command %s. %s ==> %s)',
          commandId === -1 ? 'load' : commandId,
          window.location.href,
          data.textContent,
        );
        const newUrl = new URL(data.textContent);

        if (location.origin === newUrl.origin) {
          window.history.replaceState({}, 'Replay', data.textContent);
          idMap.clear();
          window.scrollTo({ top: 0 });
          document.documentElement.innerHTML = '';
        } else {
          // if it's an origin change, we have to change page
          location.href = newUrl.href;
        }
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
      if (!elem) {
        console.log('Preserved element doesnt exist!', data.tagName);
      }
      idMap.set(data.id, elem);
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

    let node: Node;
    let parentNode: Node;
    try {
      node = deserializeNode(data);
      parentNode = getNode(data.parentNodeId);
      if (!parentNode && (action === 'added' || action === 'removed')) {
        // tslint:disable-next-line:no-console
        console.log('WARN: parent node id not found', data);
        continue;
      }
      if (node && preserveElements.includes((node as Element).tagName)) {
        if (action === 'removed') {
          console.log('WARN: script trying to remove preserved node', data);
          continue;
        }
      }

      switch (action) {
        case 'added':
          let next: Node;
          if (getNode(data.previousSiblingId)) {
            next = getNode(data.previousSiblingId).nextSibling;
          }
          if (next) parentNode.insertBefore(node, next);
          else parentNode.appendChild(node);
          break;
        case 'removed':
          parentNode.removeChild(node);
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
    } catch (error) {
      console.log('ERROR applying action', error, parentNode, node, data);
    }
  }
};

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
