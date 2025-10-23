"use strict";
// NOTE: do not use node dependencies
Object.defineProperty(exports, "__esModule", { value: true });
let maxHighlightTop = -1;
let minHighlightTop = 10e3;
let replayNode;
window.showMouseInteractions = false;
let replayShadow;
let lastHighlightNodes = [];
window.setInteractionDisplay = function setInteractionDisplay(trackMouse, hideMouse, hideOverlays) {
    window.showMouseInteractions = trackMouse;
    if (hideMouse)
        clearMouse();
    if (hideOverlays === true) {
        highlightElements.forEach(x => x.remove());
        highlightElements.length = 0;
        lastHighlightNodes = [];
    }
};
window.replayInteractions = function replayInteractions(resultNodeIds, mouseEvent, scrollEvent) {
    highlightNodes(resultNodeIds);
    updateMouse(mouseEvent);
    updateScroll(scrollEvent);
};
const events = {
    scroll: updateScroll,
    mouse: updateMouse,
    highlight: highlightNodes,
    'clear-mouse': clearMouse,
    'clear-highlights': clearHighlights,
};
window.addEventListener('message', ev => {
    if (!ev.data.action)
        return;
    const { action, event } = ev.data;
    const handler = events[action];
    if (handler) {
        handler(event);
        if (action.startsWith('clear-')) {
            for (const other of document.querySelectorAll('iframe,frame')) {
                postToFrame(other, { action });
            }
        }
    }
});
function postToFrame(node, data) {
    const contentWindow = node.contentWindow;
    if (contentWindow)
        contentWindow.postMessage(data, '*');
}
function debugLog(message, ...args) {
    if (window.debugToConsole) {
        // eslint-disable-next-line prefer-rest-params,no-console
        console.log(...arguments);
    }
    else if (window.debugLogs)
        window.debugLogs.push({ message, args });
}
function delegateInteractToSubframe(event, action) {
    if (!event?.frameIdPath) {
        debugLog('Delegate requested on event without frameIdPath', event, action);
        return;
    }
    const childPath = event.frameIdPath
        .replace(window.selfFrameIdPath, '')
        .split('_')
        .filter(Boolean)
        .map(Number);
    const childId = childPath.shift();
    const frame = window.getNodeById(childId);
    const allFrames = document.querySelectorAll('iframe,frame');
    for (const other of allFrames) {
        if (other !== frame)
            postToFrame(other, { action: `clear-${action}` });
    }
    if (!frame?.contentWindow) {
        debugLog('Interaction frame?.contentWindow not found', frame, event);
        return;
    }
    frame.contentWindow.postMessage({ event, action }, '*');
}
const highlightElements = [];
let showMoreUp;
let showMoreDown;
function checkOverflows() {
    createReplayItems();
    if (maxHighlightTop > window.innerHeight + window.scrollY) {
        replayShadow.appendChild(showMoreDown);
    }
    else {
        showMoreDown.remove();
    }
    if (minHighlightTop < window.scrollY) {
        replayShadow.appendChild(showMoreUp);
    }
    else {
        showMoreUp.remove();
    }
}
function clearHighlights() {
    lastHighlightNodes = [];
    highlightElements.forEach(x => x.remove());
}
function highlightNodes(nodes) {
    if (nodes === undefined)
        return;
    if (nodes && nodes.frameIdPath && nodes.frameIdPath !== window.selfFrameIdPath) {
        clearHighlights();
        // delegate to subframe
        delegateInteractToSubframe(nodes, 'highlight');
        return;
    }
    createReplayItems();
    const nodeIds = nodes?.nodeIds;
    lastHighlightNodes = nodeIds;
    const length = nodeIds ? nodeIds.length : 0;
    try {
        minHighlightTop = 10e3;
        maxHighlightTop = -1;
        for (let i = 0; i < length; i += 1) {
            const node = window.getNodeById(nodeIds[i]);
            let hoverNode = highlightElements[i];
            if (!hoverNode) {
                hoverNode = document.createElement('hero-highlight');
                highlightElements.push(hoverNode);
            }
            if (!node) {
                hoverNode.remove();
                continue;
            }
            const element = node.nodeType === node.TEXT_NODE ? node.parentElement : node;
            const bounds = element.getBoundingClientRect();
            bounds.x += window.scrollX;
            bounds.y += window.scrollY;
            hoverNode.style.width = `${bounds.width}px`;
            hoverNode.style.height = `${bounds.height}px`;
            hoverNode.style.top = `${bounds.top - 5}px`;
            hoverNode.style.left = `${bounds.left - 5}px`;
            if (bounds.y > maxHighlightTop)
                maxHighlightTop = bounds.y;
            if (bounds.y + bounds.height < minHighlightTop)
                minHighlightTop = bounds.y + bounds.height;
            replayShadow.appendChild(hoverNode);
        }
        checkOverflows();
        for (let i = length; i < highlightElements.length; i += 1) {
            highlightElements[i].remove();
        }
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
    }
}
/////// MOUSE EVENTS ///////////////////////////////////////////////////////////////////////////////////////////////////
let lastMouseEvent;
let mouse;
const elementAbsolutes = new Map();
const elementDisplayCache = new Map();
const offsetsAtPageY = new Map();
const offsetBlock = 100;
function clearMouse() {
    lastMouseEvent = null;
    if (mouse)
        mouse.style.display = 'none';
}
function updateMouse(mouseEvent) {
    if (!mouseEvent || !window.showMouseInteractions)
        return;
    if (mouseEvent.frameIdPath !== window.selfFrameIdPath) {
        clearMouse();
        delegateInteractToSubframe(mouseEvent, 'mouse');
        return;
    }
    createReplayItems();
    lastMouseEvent = mouseEvent;
    if (mouseEvent.pageX !== undefined) {
        const targetNode = window.getNodeById(mouseEvent.targetNodeId);
        let pageY = mouseEvent.pageY;
        if (mouseEvent.targetNodeId && targetNode && targetNode.isConnected) {
            const pageOffsetsYKey = pageY - (pageY % offsetBlock);
            // try last two offset zones
            const pageOffsetsAtHeight = offsetsAtPageY.get(pageOffsetsYKey) ?? offsetsAtPageY.get(pageOffsetsYKey - offsetBlock);
            // if there's a page translation we've found that's closer than this one, use it
            if (pageOffsetsAtHeight &&
                Math.abs(pageOffsetsAtHeight.elementOffset) < Math.abs(mouseEvent.offsetY)) {
                pageY = mouseEvent.pageY + pageOffsetsAtHeight.pageOffset;
            }
            else {
                const { top } = getElementAbsolutePosition(targetNode);
                pageY = Math.round(mouseEvent.offsetY + top);
                const offsetAtYHeightEntry = offsetsAtPageY.get(pageOffsetsYKey);
                if (!offsetAtYHeightEntry ||
                    Math.abs(offsetAtYHeightEntry.elementOffset) > Math.abs(mouseEvent.offsetY)) {
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
function getElementAbsolutePosition(element) {
    if (!(element instanceof Element))
        return { top: 0, left: 0 };
    const offsetElement = getOffsetElement(element);
    if (!elementAbsolutes.has(offsetElement)) {
        const rect = offsetElement.getBoundingClientRect();
        const absoluteX = Math.round(rect.left + window.scrollX);
        const absoluteY = Math.round(rect.top + window.scrollY);
        elementAbsolutes.set(offsetElement, { top: absoluteY, left: absoluteX });
    }
    return elementAbsolutes.get(offsetElement);
}
function getOffsetElement(element) {
    while (element.tagName !== 'BODY' && element instanceof Element) {
        if (!elementDisplayCache.has(element)) {
            elementDisplayCache.set(element, getComputedStyle(element).display);
        }
        const display = elementDisplayCache.get(element);
        if (display === 'inline') {
            const offsetParent = element.parentElement;
            if (!offsetParent)
                break;
            element = offsetParent;
        }
        else {
            break;
        }
    }
    return element;
}
function updateScroll(scrollEvent) {
    if (!scrollEvent)
        return;
    if (scrollEvent.frameIdPath !== window.selfFrameIdPath) {
        return delegateInteractToSubframe(scrollEvent, 'scroll');
    }
    window.scroll({
        behavior: 'auto',
        top: scrollEvent.scrollY,
        left: scrollEvent.scrollX,
    });
}
function repositionInteractElements() {
    createReplayItems();
    if (lastHighlightNodes)
        highlightNodes({ frameIdPath: window.selfFrameIdPath, nodeIds: lastHighlightNodes });
    if (lastMouseEvent)
        updateMouse(lastMouseEvent);
}
window.repositionInteractElements = repositionInteractElements;
/////// BUILD UI ELEMENTS //////////////////////////////////////////////////////////////////////////////////////////////
let isInitialized = false;
function createReplayItems() {
    if (replayNode) {
        if (!replayNode.isConnected && document.body)
            document.body.appendChild(replayNode);
        return;
    }
    if (isInitialized)
        return;
    isInitialized = true;
    replayNode = document.createElement('hero-replay');
    if ('doNotTrackElement' in window) {
        window.doNotTrackElement(replayNode);
    }
    replayNode.style.zIndex = '2147483647';
    replayShadow = replayNode.attachShadow({ mode: 'closed' });
    showMoreUp = document.createElement('hero-overflow');
    showMoreUp.style.top = '0';
    const bar = document.createElement('hero-overflow-bar');
    bar.textContent = '&nbsp;';
    showMoreUp.appendChild(bar);
    showMoreDown = document.createElement('hero-overflow');
    showMoreDown.style.bottom = '0';
    const showMoreDownBar = document.createElement('hero-overflow-bar');
    showMoreDownBar.textContent = '&nbsp;';
    showMoreDown.appendChild(showMoreDownBar);
    const styleElement = document.createElement('style');
    styleElement.textContent = `
  hero-overflow-bar {
    width: 500px;
    background-color:#3498db;
    margin:0 auto;
    height: 100%;
    box-shadow: 3px 0 0 0 #3498db;
    display:block;
  }

  hero-overflow {
    z-index: 2147483647;
    display:block;
    width:100%;
    height:8px;
    position:fixed;
    pointer-events: none;
  }

  hero-highlight {
    z-index: 2147483647;
    position:absolute;
    box-shadow: 1px 1px 3px 0 #3498db;
    border-radius:3px;
    border:1px solid #3498db;
    padding:5px;
    pointer-events: none;
  }

  hero-mouse-pointer {
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
  hero-mouse-pointer.button-1 {
    transition: none;
    background: rgba(0,0,0,0.9);
  }
  hero-mouse-pointer.button-2 {
    transition: none;
    border-color: rgba(0,0,255,0.9);
  }
  hero-mouse-pointer.button-3 {
    transition: none;
    border-radius: 4px;
  }
  hero-mouse-pointer.button-4 {
    transition: none;
    border-color: rgba(255,0,0,0.9);
  }
  hero-mouse-pointer.button-5 {
    transition: none;
    border-color: rgba(0,255,0,0.9);
  }
`;
    replayShadow.appendChild(styleElement);
    mouse = document.createElement('hero-mouse-pointer');
    mouse.style.display = 'none';
    replayShadow.appendChild(mouse);
    function cancelEvent(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
    if (window.blockClickAndSubmit) {
        document.addEventListener('click', cancelEvent, true);
        document.addEventListener('submit', cancelEvent, true);
    }
    document.addEventListener('scroll', () => checkOverflows());
    window.addEventListener('resize', repositionInteractElements);
    if (document.body)
        document.body.appendChild(replayNode);
}
//# sourceMappingURL=interactReplayer.js.map