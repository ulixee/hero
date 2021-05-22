// NOTE: do not use node dependencies

import type { IScrollRecord } from '@secret-agent/core/models/ScrollEventsTable';
import type { IMouseEventRecord } from '@secret-agent/core/models/MouseEventsTable';

interface IFrontendMouseEvent extends Omit<IMouseEventRecord, 'commandId' | 'timestamp' | 'event'> {
  viewportWidth: number;
  viewportHeight: number;
}
let maxHighlightTop = -1;
let minHighlightTop = 10e3;
let replayNode: HTMLElement;
let replayShadow: ShadowRoot;
let lastHighlightNodes: number[] = [];

window.replayInteractions = function replayInteractions(resultNodeIds, mouseEvent, scrollEvent) {
  createReplayItems();
  if (resultNodeIds !== undefined) highlightNodes(resultNodeIds);
  if (mouseEvent) updateMouse(mouseEvent);
  if (scrollEvent) updateScroll(scrollEvent);
  if (mouseEvent || scrollEvent || resultNodeIds) {
    document.body.appendChild(replayNode);
  }
};

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
      const node = window.getNodeById(nodeIds[i]);
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
    // eslint-disable-next-line no-console
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
    const targetNode = window.getNodeById(mouseEvent.targetNodeId) as HTMLElement;

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
  if (isInitialized) return;
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
    z-index: 2147483647;
    display:block;
    width:100%;
    height:8px;
    position:fixed;
    pointer-events: none;
  }

  sa-highlight {
    z-index: 2147483647;
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
    z-index: 2147483647;
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
