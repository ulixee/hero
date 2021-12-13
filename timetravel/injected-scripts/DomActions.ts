import { IFrontendDomChangeEvent } from '@ulixee/hero-interfaces/IDomChangeEvent';

declare global {
  interface Window {
    getNodeById(id: number): Node;
    DomActions: typeof DomActions;
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
const preserveElements = new Set<string>(['HTML', 'HEAD', 'BODY']);

class DomActions {
  public static onFrameModifiedCallbacks: ((
    element: HTMLIFrameElement | HTMLFrameElement,
    change: IFrontendDomChangeEvent,
  ) => void)[] = [];

  public static replayDomEvent(event: IFrontendDomChangeEvent): void {
    const { action } = event;
    if (action === DomActionType.newDocument) return this.onNewDocument(event);
    if (action === DomActionType.location) return this.onLocation(event);

    if (this.isPreservedElement(event)) return;

    let node: Node;
    let parentNode: Node;
    try {
      parentNode = this.getNode(event.parentNodeId);
      node = this.deserializeNode(event, parentNode as Element);

      if (action === DomActionType.added) this.onNodeAdded(node, parentNode, event);
      if (action === DomActionType.removed) this.onNodeRemoved(node, parentNode, event);
      if (action === DomActionType.attribute) this.setNodeAttributes(node as Element, event);
      if (action === DomActionType.property) this.setNodeProperties(node as Element, event);
      if (action === DomActionType.text) node.textContent = event.textContent;
      if (node instanceof HTMLIFrameElement || node instanceof HTMLFrameElement) {
        this.onFrameModified(node, event);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('ERROR: applying action', error, { parentNode, node, event });
    }
  }

  public static getNode(id: number) {
    if (id === null || id === undefined) return null;
    return NodeTracker.getWatchedNodeWithId(id, false);
  }

  public static isNavigation(action: DomActionType): boolean {
    return action === DomActionType.location || action === DomActionType.newDocument;
  }

  private static onFrameModified(node, event) {
    for (const cb of this.onFrameModifiedCallbacks) {
      cb(node, event);
    }
  }

  private static isPreservedElement(event: IFrontendDomChangeEvent): boolean {
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
      const existing = this.getNode(nodeId);
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
      if (elem.tagName === 'BODY' && 'reattachUI' in window) {
        window.reattachUI();
      }
    }
    if (event.attributes) {
      this.setNodeAttributes(elem, event);
    }
    if (event.properties) {
      this.setNodeProperties(elem, event);
    }
    return true;
  }

  private static onNodeAdded(node: Node, parentNode: Node, event: IFrontendDomChangeEvent) {
    if (!parentNode) {
      debugLog('WARN: parent node id not found', event);
      return;
    }

    if (!event.previousSiblingId) {
      (parentNode as Element).prepend(node);
    } else {
      const previous = this.getNode(event.previousSiblingId);
      if (previous) {
        const next = previous.nextSibling;

        if (next) parentNode.insertBefore(node, next);
        else parentNode.appendChild(node);
      }
    }
  }

  private static onNodeRemoved(node: Node, parentNode: Node, event: IFrontendDomChangeEvent) {
    if (!parentNode) {
      debugLog('WARN: parent node id not found', event);
      return;
    }
    if (parentNode.contains(node)) parentNode.removeChild(node);
  }

  private static onNewDocument(event: IFrontendDomChangeEvent) {
    const { textContent } = event;
    const href = textContent;

    if (!window.isMainFrame) {
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

  private static onLocation(event: IFrontendDomChangeEvent) {
    debugLog('Location: href=%s', event.textContent);
    window.history.replaceState({}, 'TimeTravel', event.textContent);
  }

  private static setNodeAttributes(node: Element, data: IFrontendDomChangeEvent) {
    const attributes = data.attributes;
    if (!attributes) return;

    const namespaces = data.attributeNamespaces;

    for (const [name, value] of Object.entries(attributes)) {
      const ns = namespaces ? namespaces[name] : null;
      try {
        if (name === 'xmlns' || name.startsWith('xmlns') || node.tagName === 'HTML' || !ns) {
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

  private static setNodeProperties(node: Element, data: IFrontendDomChangeEvent) {
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

  private static deserializeNode(data: IFrontendDomChangeEvent, parent: Element): Node {
    if (data === null) return null;

    let node = this.getNode(data.nodeId);
    if (node) {
      this.setNodeProperties(node as Element, data);
      this.setNodeAttributes(node as Element, data);
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

    if (data.nodeType === Node.COMMENT_NODE) {
      node = document.createComment(data.textContent);
    } else if (data.nodeType === Node.TEXT_NODE) {
      node = document.createTextNode(data.textContent);
    } else if (data.nodeType === Node.ELEMENT_NODE) {
      if (data.namespaceUri) {
        node = document.createElementNS(data.namespaceUri, data.tagName);
      } else {
        node = document.createElement(data.tagName);
      }

      if (
        data.tagName === 'NOSCRIPT' &&
        'CSSStyleSheet' in window &&
        'adoptedStyleSheets' in document
      ) {
        const sheet = new CSSStyleSheet();
        // @ts-ignore
        sheet.replaceSync(
          `noscript { display:none !important; }
     noscript * { display:none !important; }`,
        );

        // @ts-ignore
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
      }

      this.setNodeAttributes(node as Element, data);
      this.setNodeProperties(node as Element, data);
      if (data.textContent) {
        node.textContent = data.textContent;
      }
    }

    if (!node) throw new Error(`Unable to translate node! {nodeType: ${data.nodeType}}`);

    NodeTracker.restore(data.nodeId, node);

    return node;
  }
}
window.DomActions = DomActions;
window.getNodeById = DomActions.getNode;
