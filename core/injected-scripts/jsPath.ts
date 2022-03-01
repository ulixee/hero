import IExecJsPathResult from '@ulixee/hero-interfaces/IExecJsPathResult';
import type INodePointer from 'awaited-dom/base/INodePointer';
import IElementRect from '@ulixee/hero-interfaces/IElementRect';
import IPoint from '@ulixee/hero-interfaces/IPoint';
import { IJsPathError } from '@ulixee/hero-interfaces/IJsPathError';
import { INodeVisibility } from '@ulixee/hero-interfaces/INodeVisibility';
import { IJsPath, IPathStep } from 'awaited-dom/base/AwaitedPath';

const pointerFnName = '__getNodePointer__';

class JsPath {
  public static async waitForScrollStop(timeoutMillis: number) {
    const endTime = new Date().getTime() + (timeoutMillis ?? 50);
    const scrollElement = document.scrollingElement ?? document.documentElement;
    let left = 0;
    let top = 0;
    let consecutiveMatches = 0;
    do {
      await new Promise(requestAnimationFrame);
      const prevLeft = left;
      const prevTop = top;
      left = scrollElement.scrollLeft;
      top = scrollElement.scrollTop;
      if (left === prevLeft && top === prevTop) {
        consecutiveMatches += 1;
      } else {
        consecutiveMatches = 0;
      }
      if (consecutiveMatches >= 2) return [left, top];
    } while (new Date().getTime() < endTime);

    return [left, top];
  }

  public static getWindowOffset() {
    const scrollElement = document.scrollingElement ?? document.documentElement;
    return {
      innerHeight,
      innerWidth,
      scrollY: scrollElement?.scrollTop ?? 0,
      scrollX: scrollElement?.scrollLeft ?? 0,
      scrollHeight: scrollElement?.scrollHeight ?? 0,
      scrollWidth: scrollElement?.scrollWidth ?? 0,
    };
  }

  public static simulateOptionClick(jsPath: IJsPath): IExecJsPathResult<boolean> {
    const objectAtPath = new ObjectAtPath(jsPath);
    try {
      const currentObject = objectAtPath.lookup().objectAtPath;

      if (!currentObject || !(currentObject instanceof HTMLOptionElement)) {
        return objectAtPath.toReturnError(new Error('Option element not found'));
      }

      const element = currentObject as HTMLOptionElement;

      let didClick = false;
      const values = [element.value];
      if (element.parentNode instanceof HTMLSelectElement) {
        const select = element.parentNode as HTMLSelectElement;
        select.value = undefined;
        const options = Array.from(select.options);
        for (const option of options) {
          option.selected = values.includes(option.value);
          if (option.selected && !select.multiple) break;
        }

        select.dispatchEvent(new InputEvent('input', { bubbles: true }));
        select.dispatchEvent(new Event('change', { bubbles: true }));
        didClick = true;
      }

      return { value: didClick };
    } catch (error) {
      return objectAtPath.toReturnError(error);
    }
  }

  public static async exec(
    jsPath: IJsPath,
    containerOffset: IPoint,
  ): Promise<IExecJsPathResult<any>> {
    const objectAtPath = new ObjectAtPath(jsPath, containerOffset);
    try {
      const result = <IExecJsPathResult<any>>{
        value: await objectAtPath.lookup().objectAtPath,
      };

      if (objectAtPath.hasNodePointerLoad && !isPrimitive(result.value)) {
        result.nodePointer = objectAtPath.extractNodePointer();
      }

      if (!result.nodePointer && objectAtPath.nodePath?.length) {
        const nodePath = [...objectAtPath.nodePath].reverse();
        for (const node of nodePath) {
          if (node instanceof HTMLElement) {
            ObjectAtPath.createNodePointer(node);
            break;
          }
        }
      }

      if (
        !objectAtPath.hasCustomMethodLookup &&
        (result.nodePointer?.iterableIsState || result.value instanceof Node)
      ) {
        result.value = undefined;
      }
      // serialize special types
      else if (result.value && !isPrimitive(result.value) && !isPojo(result.value)) {
        result.isValueSerialized = true;
        result.value = TypeSerializer.replace(result.value);
      }
      return result;
    } catch (error) {
      return objectAtPath.toReturnError(error);
    }
  }

  public static async execJsPaths(
    jsPaths: { jsPath: IJsPath; sourceIndex: number }[],
    containerOffset: IPoint,
  ): Promise<{ jsPath: IJsPath; result: IExecJsPathResult<any> }[]> {
    const resultMapByPathIndex: { [index: number]: IExecJsPathResult<any>[] } = {};
    const results: { jsPath: IJsPath; result: IExecJsPathResult<any> }[] = [];

    async function runFn(queryIndex: number, jsPath: IJsPath): Promise<void> {
      // copy into new array so original stays clean
      const result = await JsPath.exec([...jsPath], containerOffset);
      results.push({ jsPath, result });

      (resultMapByPathIndex[queryIndex] ??= []).push(result);
    }

    for (let i = 0; i < jsPaths.length; i += 1) {
      const { jsPath, sourceIndex } = jsPaths[i];
      if (sourceIndex !== undefined) {
        const parentResults = resultMapByPathIndex[sourceIndex];
        // if we couldn't get parent results, don't try to recurse
        if (!parentResults) continue;
        for (const parentResult of parentResults) {
          if (parentResult.pathError || !parentResult.nodePointer) continue;
          if (jsPath[0] === '.') {
            const nestedJsPath = [parentResult.nodePointer.id, ...jsPath.slice(1)];
            await runFn(i, nestedJsPath);
          }
          if (jsPath[0] === '*.') {
            if (parentResult.nodePointer.iterableIsState) {
              for (const iterable of parentResult.nodePointer.iterableItems as INodePointer[]) {
                const nestedJsPath = [iterable.id, ...jsPath.slice(1)];
                await runFn(i, nestedJsPath);
              }
            }
          }
        }
      } else {
        await runFn(i, jsPath);
      }
    }
    return results;
  }
}

// / Object At Path Class //////

let lastContainerOffset: { x: number; y: number };

class ObjectAtPath {
  public objectAtPath: Node | any;
  public nodePath: (Node | any)[];
  public hasNodePointerLoad: boolean;
  public hasCustomMethodLookup = false;

  private _obstructedByElement: Element;
  private lookupStep: IPathStep;
  private lookupStepIndex = 0;
  private nodePointer: INodePointer;

  public get closestElement(): Element {
    if (!this.objectAtPath) return;
    if (this.isTextNode) {
      return this.objectAtPath.parentElement;
    }
    return this.objectAtPath as Element;
  }

  public get boundingClientRect() {
    return this.getElementRect(this.closestElement);
  }

  public get obstructedByElement() {
    if (this._obstructedByElement) return this._obstructedByElement;
    const element = this.closestElement;
    if (!element) return null;
    const { x, y, width, height } = element.getBoundingClientRect();
    const centerX = round(x + width / 2);
    const centerY = round(y + height / 2);

    this._obstructedByElement = document.elementFromPoint(centerX, centerY);
    return this._obstructedByElement;
  }

  public get obstructedByElementId() {
    const element = this.obstructedByElement;
    if (!element) return null;
    return NodeTracker.watchNode(element);
  }

  public get isObstructedByAnotherElement() {
    const overlapping = this.obstructedByElement;
    if (!overlapping) return false;

    // adjust coordinates to get more accurate results
    const isContained = this.closestElement.contains(overlapping);
    if (isContained) return false;

    // make sure overlapping element is visible
    const style = getComputedStyle(overlapping);
    if (style?.visibility === 'hidden' || style?.display === 'none' || style?.opacity === '0') {
      return false;
    }

    // if this is another element, needs to be taking up >= 50% of element
    const overlappingBounds = overlapping.getBoundingClientRect();
    const thisRect = this.boundingClientRect;
    const isOverHalfWidth = overlappingBounds.width >= thisRect.width / 2;
    const isOverHalfHeight = overlappingBounds.height >= thisRect.height / 2;
    return isOverHalfWidth && isOverHalfHeight;
  }

  private get isTextNode() {
    return this.objectAtPath?.nodeType === this.objectAtPath?.TEXT_NODE;
  }

  constructor(readonly jsPath: IJsPath, readonly containerOffset: IPoint = lastContainerOffset) {
    if (!jsPath?.length) return;
    this.containerOffset = containerOffset;
    lastContainerOffset = containerOffset;

    // @ts-ignore - start listening for events since we've just looked up something on this frame
    if ('listenToInteractionEvents' in window) window.listenToInteractionEvents();

    if (
      Array.isArray(jsPath[jsPath.length - 1]) &&
      jsPath[jsPath.length - 1][0] === pointerFnName
    ) {
      this.hasNodePointerLoad = true;
      jsPath.pop();
    }
  }

  public getComputedVisibility(): INodeVisibility {
    this.hasNodePointerLoad = true;
    this.nodePointer = ObjectAtPath.createNodePointer(this.objectAtPath);

    const visibility: INodeVisibility = {
      // put here first for display
      isVisible: true,
      isClickable: false,
      nodeExists: !!this.objectAtPath,
    };
    if (!visibility.nodeExists) {
      visibility.isVisible = false;
      visibility.isClickable = false;
      return visibility;
    }

    visibility.isConnected = this.objectAtPath?.isConnected === true;
    const element = this.closestElement;
    visibility.hasContainingElement = !!element;

    if (!visibility.hasContainingElement) {
      visibility.isVisible = false;
      visibility.isClickable = false;
      return visibility;
    }

    const style = getComputedStyle(element);

    visibility.hasCssVisibility = style?.visibility !== 'hidden';
    visibility.hasCssDisplay = style?.display !== 'none';
    visibility.hasCssOpacity = style?.opacity !== '0';
    visibility.isUnobstructedByOtherElements = !this.isObstructedByAnotherElement;
    if (visibility.isUnobstructedByOtherElements === false) {
      visibility.obstructedByElementId = this.obstructedByElementId;
      visibility.obstructedByElementRect = this.getElementRect(this.obstructedByElement);
    }

    const rect = this.boundingClientRect;
    visibility.boundingClientRect = rect;
    visibility.hasDimensions = !(rect.width === 0 && rect.height === 0);
    visibility.isOnscreenVertical =
      rect.y + rect.height > 0 && rect.y < window.innerHeight + this.containerOffset.y;
    visibility.isOnscreenHorizontal =
      rect.x + rect.width > 0 && rect.x < window.innerWidth + this.containerOffset.x;

    visibility.isVisible =
      visibility.hasCssVisibility &&
      visibility.hasCssDisplay &&
      visibility.hasCssOpacity &&
      visibility.isConnected &&
      visibility.hasDimensions;

    visibility.isClickable =
      visibility.isVisible &&
      visibility.isOnscreenVertical &&
      visibility.isOnscreenHorizontal &&
      visibility.isUnobstructedByOtherElements;
    return visibility;
  }

  public lookup() {
    try {
      // track object as we navigate so we can extract properties along the way
      this.objectAtPath = window;
      this.nodePath = [window];
      this.lookupStepIndex = 0;
      if (this.jsPath[0] === 'window') {
        this.jsPath.shift();
        this.lookupStepIndex = 1;
      }
      for (const step of this.jsPath) {
        this.lookupStep = step;
        if (Array.isArray(step)) {
          const [methodName, ...args] = step;
          // extract node ids as args
          const finalArgs = args.map(x => {
            if (typeof x !== 'string') return x;
            if (!x.startsWith('$$jsPath=')) return x;
            const innerPath = JSON.parse(x.split('$$jsPath=').pop());
            const sub = new ObjectAtPath(innerPath, this.containerOffset).lookup();
            return sub.objectAtPath;
          });
          // handlers for getComputedStyle/Visibility/getNodeId/getBoundingRect
          if (methodName.startsWith('__') && methodName.endsWith('__')) {
            this.hasCustomMethodLookup = true;
            this.objectAtPath = this[`${methodName.replace(/__/g, '')}`](...finalArgs);
          } else {
            const methodProperty = propertyName(methodName);
            this.objectAtPath = this.objectAtPath[methodProperty](...finalArgs);
          }
        } else if (typeof step === 'number') {
          this.objectAtPath = NodeTracker.getWatchedNodeWithId(step);
        } else if (typeof step === 'string') {
          const prop = propertyName(step);
          this.objectAtPath = this.objectAtPath[prop];
        } else {
          throw new Error('unknown JsPathStep');
        }
        this.nodePath.push(this.objectAtPath);
        this.lookupStepIndex += 1;
      }
    } catch (err) {
      // don't store the invalid path if we failed at a step
      this.objectAtPath = null;
      throw err;
    }

    return this;
  }

  public isFocused(): boolean {
    return this.closestElement === document.activeElement;
  }

  public toReturnError(error: Error): IExecJsPathResult {
    const pathError = <IJsPathError>{
      error: String(error),
      pathState: {
        step: this.lookupStep,
        index: this.lookupStepIndex,
      },
    };
    return {
      value: null,
      pathError,
    };
  }

  public getElementRect(element: Element): IElementRect {
    if (!element) {
      return { x: 0, y: 0, width: 0, height: 0, tag: 'node', scrollX: 0, scrollY: 0 };
    }

    const tag = element.tagName?.toLowerCase();

    // if this is an option, get the rect of the select since option has no position
    if (element instanceof HTMLOptionElement) {
      let parent: HTMLElement = element;
      while (parent && !(parent instanceof HTMLSelectElement)) {
        parent = parent.parentElement;
      }
      element = parent;
    }

    const rect = element.getBoundingClientRect();
    return {
      y: rect.y + this.containerOffset.y,
      x: rect.x + this.containerOffset.x,
      height: rect.height,
      width: rect.width,
      scrollX: window.scrollX ?? document.documentElement?.scrollLeft,
      scrollY: window.scrollY ?? document.documentElement?.scrollTop,
      tag,
    } as IElementRect;
  }

  public extractNodePointer(): INodePointer {
    return (this.nodePointer ??= ObjectAtPath.createNodePointer(this.objectAtPath));
  }

  private getClientRect(includeVisibilityStatus = false): IElementRect {
    this.hasNodePointerLoad = true;
    this.nodePointer = ObjectAtPath.createNodePointer(this.objectAtPath);
    const box = this.boundingClientRect;
    box.nodeVisibility = includeVisibilityStatus ? this.getComputedVisibility() : undefined;

    return box;
  }

  private getNodeId(): number {
    return NodeTracker.watchNode(this.objectAtPath);
  }

  private getComputedStyle(pseudoElement?: string): CSSStyleDeclaration {
    return window.getComputedStyle(this.objectAtPath, pseudoElement);
  }

  public static createNodePointer(objectAtPath: any, isNested = false): INodePointer {
    if (!objectAtPath) return null;

    const nodeId = NodeTracker.watchNode(objectAtPath);
    const state = {
      id: nodeId,
      type: objectAtPath.constructor?.name,
      preview: generateNodePreview(objectAtPath),
    } as INodePointer;

    const ids = objectAtPath instanceof HTMLElement ? [nodeId] : [];

    if (isIterableOrArray(objectAtPath)) {
      state.iterableItems = Array.from(objectAtPath);

      if (state.iterableItems.length && isCustomType(state.iterableItems[0])) {
        state.iterableIsState = true;
        const items = state.iterableItems;
        state.iterableItems = [];
        for (const item of items) {
          const nodePointer = this.createNodePointer(item, true);
          state.iterableItems.push(nodePointer);
          if (item instanceof HTMLElement) {
            ids.push(nodePointer.id);
          }
        }
      }
    }

    if (!isNested && 'replayInteractions' in window) {
      window.replayInteractions({ frameIdPath: '', nodeIds: ids });
    }

    return state;
  }
}

function generateNodePreview(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return `#text=${node.nodeValue || ''}`;

  if (node.nodeType !== Node.ELEMENT_NODE) {
    let name = `${node.constructor.name || typeof node}`;
    if ('length' in node) {
      name += `(${(node as any).length})`;
    }
    return name;
  }
  const tag = node.nodeName.toLowerCase();
  const element = node as Element;

  let attrText = '';
  for (const attr of element.attributes) {
    const { name, value } = attr;
    if (name === 'style') continue;
    attrText += ` ${name}`;
    if (value) {
      let valueText = value;
      if (valueText.length > 50) {
        valueText = `${value.substr(0, 49)}\u2026`;
      }
      attrText += `="${valueText}"`;
    }
  }
  if (emptyElementTags.has(tag)) return `<${tag}${attrText}/>`;

  const children = element.childNodes;
  let elementHasTextChildren = false;
  if (children.length <= 5) {
    elementHasTextChildren = true;
    for (const child of children) {
      if (child.nodeType !== Node.TEXT_NODE) {
        elementHasTextChildren = false;
        break;
      }
    }
  }
  let textContent = '';
  if (elementHasTextChildren) {
    textContent = element.textContent ?? '';
    if (textContent.length > 50) {
      textContent = `${textContent.substring(0, 49)}\u2026`;
    }
  } else if (children.length) {
    textContent = '\u2026';
  }
  return `<${tag}${attrText}>${textContent}</${tag}>`;
}

const emptyElementTags = new Set([
  'area',
  'base',
  'br',
  'col',
  'command',
  'embed',
  'hr',
  'img',
  'input',
  'keygen',
  'link',
  'menuitem',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

// / JS Path Helpers //////
function isPrimitive(arg) {
  const type = typeof arg;
  return arg == null || (type !== 'object' && type !== 'function');
}

function isCustomType(object) {
  return !(
    object instanceof Date ||
    object instanceof ArrayBuffer ||
    object instanceof RegExp ||
    object instanceof Error ||
    object instanceof BigInt ||
    object instanceof String ||
    object instanceof Number ||
    object instanceof Boolean ||
    isPrimitive(object)
  );
}

function isPojo(obj) {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }
  return Object.getPrototypeOf(obj) === Object.prototype;
}

function propertyName(name: string): string | symbol {
  if (name.startsWith('Symbol.for')) {
    const symbolName = name.match(/Symbol\(([\w.]+)\)/)[1];
    return Symbol.for(symbolName);
  }
  return name;
}

function isIterableOrArray(object) {
  // don't iterate on strings
  if (!object || typeof object === 'string' || object instanceof String) return false;
  return !!object[Symbol.iterator] || Array.isArray(object);
}

function round(num: number): number {
  return Math.floor(100 * num) / 100;
}
