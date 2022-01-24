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

  public static replayDomEvent(event: IFrontendDomChangeEvent, isReverse = false): void {
    let { action } = event;
    if (action === DomActionType.newDocument) return this.onNewDocument(event);
    if (action === DomActionType.location) return this.onLocation(event);

    if (isReverse) {
      if (action === DomActionType.added) action = DomActionType.removed;
      else if (action === DomActionType.removed) action = DomActionType.added;
    }

    if (this.isPreservedElement(event, isReverse)) return;

    let node: Node;
    let parentNode: Node;
    try {
      parentNode = this.getNode(isReverse ? event.previousParentNodeId : event.parentNodeId);
      node = this.deserializeNode(event, parentNode as Element, isReverse);

      if (action === DomActionType.added) this.onNodeAdded(node, parentNode, event, isReverse);
      if (action === DomActionType.removed) this.onNodeRemoved(node, parentNode, event, isReverse);
      if (action === DomActionType.attribute)
        this.setNodeAttributes(node as Element, event, isReverse);
      if (action === DomActionType.property)
        this.setNodeProperties(node as Element, event, isReverse);
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

  private static isPreservedElement(event: IFrontendDomChangeEvent, isReverse: boolean): boolean {
    const { nodeId, nodeType } = event;

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
      // if we're reversing, we can end up with the existing node as the nodeId
      if (existing) {
        if (existing === document || existing === document.doctype) return true;
        tagName = (existing as Element).tagName;
      }
    }
    if (!preserveElements.has(tagName)) return false;

    const elem = document.querySelector(tagName);
    if (!elem) {
      debugLog('Preserved element doesnt exist!', tagName);
      return true;
    }

    let action = event.action;
    if (isReverse) {
      if (action === DomActionType.removed) action = DomActionType.added;
      else if (action === DomActionType.added) action = DomActionType.removed;
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
      this.setNodeAttributes(elem, event, isReverse);
    }
    if (event.properties) {
      this.setNodeProperties(elem, event, isReverse);
    }
    return true;
  }

  private static onNodeAdded(
    node: Node,
    parentNode: Node,
    event: IFrontendDomChangeEvent,
    isReverse: boolean,
  ) {
    if (!isReverse) this.trackPreviousState(node, event);

    if (!parentNode) {
      debugLog('WARN: parent node id not found', event);
      return;
    }

    const previousSiblingId = isReverse ? event.previousPreviousSiblingId : event.previousSiblingId;

    if (!previousSiblingId) {
      (parentNode as Element).prepend(node);
    } else {
      const previous = this.getNode(previousSiblingId);
      if (previous) {
        const next = previous.nextSibling;

        parentNode.insertBefore(node, next ?? null);
      }
    }
  }

  private static trackPreviousState(node: Node, event: IFrontendDomChangeEvent) {
    if (node.isConnected) {
      event.previousParentNodeId = node.parentNode ? NodeTracker.getNodeId(node.parentNode) : null;
      event.previousPreviousSiblingId = node.previousSibling
        ? NodeTracker.getNodeId(node.previousSibling)
        : null;
    }
  }

  private static onNodeRemoved(
    node: Node,
    parentNode: Node,
    event: IFrontendDomChangeEvent,
    isReverse: boolean,
  ) {
    if (!isReverse) this.trackPreviousState(node, event);

    if (!parentNode && isReverse) {
      node.parentNode.removeChild(node);
      return;
    }
    if (!parentNode) {
      debugLog('WARN: parent node id not found', event);
      return;
    }

    if (parentNode.contains(node)) parentNode.removeChild(node);
    if (isReverse && parentNode) {
      if (!event.previousPreviousSiblingId) {
        (parentNode as Element).prepend(node);
      } else {
        const previousNode = NodeTracker.getWatchedNodeWithId(
          event.previousPreviousSiblingId,
          false,
        );
        parentNode.insertBefore(node, previousNode?.nextSibling ?? null);
      }
    }
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

  private static setNodeAttributes(
    node: Element,
    data: IFrontendDomChangeEvent,
    usePrevious = false,
  ) {
    const attributes = usePrevious ? data.previousAttributes : data.attributes;
    if (!attributes) return;

    const namespaces = data.attributeNamespaces;

    const loadPrevious = !usePrevious && !data.previousAttributes;
    if (loadPrevious) data.previousAttributes ??= {};

    for (const [name, value] of Object.entries(attributes)) {
      const ns = namespaces ? namespaces[name] : null;
      try {
        if (loadPrevious)
          data.previousAttributes[name] = ns
            ? node.getAttributeNS(ns, name)
            : node.getAttribute(name);
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

  private static setNodeProperties(
    node: Element,
    data: IFrontendDomChangeEvent,
    usePrevious = false,
  ) {
    const properties = usePrevious ? data.previousProperties : data.properties;
    if (!properties) return;
    const getPrevious = !usePrevious && !data.previousProperties;
    data.previousProperties ??= {};

    for (const [name, value] of Object.entries(properties)) {
      if (name === 'sheet.cssRules') {
        const sheet = (node as HTMLStyleElement).sheet as CSSStyleSheet;
        const newRules = value as string[];

        if (getPrevious) data.previousProperties[name] = [];
        let i = 0;
        for (i = 0; i < sheet.cssRules.length; i += 1) {
          const newRule = newRules[i];
          const currentRule = sheet.cssRules[i].cssText;
          if (getPrevious) (data.previousProperties[name] as string[]).push(currentRule);
          if (newRule !== currentRule) {
            sheet.deleteRule(i);
            if (newRule) sheet.insertRule(newRule, i);
          }
        }
        for (; i < newRules.length; i += 1) {
          sheet.insertRule(newRules[i], i);
        }
      } else {
        if (getPrevious) data.previousProperties[name] = node[name];
        node[name] = value;
      }
    }
  }

  private static deserializeNode(
    data: IFrontendDomChangeEvent,
    parent: Element,
    isReverse: boolean,
  ): Node {
    if (data === null) return null;

    let node = this.getNode(data.nodeId);
    if (node) {
      if (isReverse) return node;
      this.setNodeProperties(node as Element, data);
      this.setNodeAttributes(node as Element, data);
      if (data.textContent) node.textContent = data.textContent;
      return node;
    }

    const SHADOW_NODE_TYPE = 40;
    if (parent && typeof parent.attachShadow === 'function' && data.nodeType === SHADOW_NODE_TYPE) {
      // NOTE: we just make all shadows open in replay
      if (isReverse) {
        node = parent.shadowRoot;
      } else {
        node = parent.attachShadow({ mode: 'open' });
        NodeTracker.restore(data.nodeId, node);
      }
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
