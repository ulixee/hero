"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MouseEvents {
    static init() {
        this.onMousedown = this.onMousedown.bind(this);
    }
    static getWindowOffset() {
        const scrollElement = document.scrollingElement ?? document.documentElement;
        return {
            innerHeight, // eslint-disable-line no-restricted-globals
            innerWidth, // eslint-disable-line no-restricted-globals
            scrollY: scrollElement?.scrollTop ?? 0,
            scrollX: scrollElement?.scrollLeft ?? 0,
            scrollHeight: scrollElement?.scrollHeight ?? 0,
            scrollWidth: scrollElement?.scrollWidth ?? 0,
        };
    }
    static async waitForScrollStop(timeoutMillis) {
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
            }
            else {
                consecutiveMatches = 0;
            }
            if (consecutiveMatches >= 2)
                return [left, top];
        } while (new Date().getTime() < endTime);
        return [left, top];
    }
    static listenFor(nodeId, containerOffset) {
        if (this.targetNodeId)
            this.clearEvent(this.targetNodeId);
        const node = NodeTracker.getWatchedNodeWithId(nodeId);
        if (!node)
            throw new Error('Node not found');
        const visibility = this.getNodeVisibility(node);
        this.containerOffset = containerOffset;
        this.targetNodeId = nodeId;
        this.pendingEvent = new Promise(resolve => {
            this.pendingEventResolve = resolve;
        });
        window.addEventListener('mousedown', this.onMousedown, {
            once: true,
            capture: true,
            passive: false,
        });
        return visibility;
    }
    static didTrigger(nodeId) {
        try {
            if (this.targetNodeId !== nodeId) {
                throw new Error(`"mouseup" listener not found`);
            }
            return this.pendingEvent;
        }
        finally {
            this.clearEvent(nodeId);
        }
    }
    static onMousedown(event) {
        const desiredClickTarget = NodeTracker.getWatchedNodeWithId(this.targetNodeId);
        const targetNodeId = event.target ? NodeTracker.watchNode(event.target) : undefined;
        const relatedTargetNodeId = event.relatedTarget
            ? NodeTracker.watchNode(event.relatedTarget)
            : undefined;
        let hitElement = event.target;
        let didClickLocation = desiredClickTarget.contains(hitElement) || desiredClickTarget === hitElement;
        if (!didClickLocation) {
            // try working around Chrome issues with shadow elements
            hitElement = ObjectAtPath.elementFromPoint(event.clientX, event.clientY);
            if (desiredClickTarget.contains(hitElement) || desiredClickTarget === hitElement) {
                didClickLocation = true;
            }
        }
        const result = {
            pageX: this.containerOffset.x + event.pageX - window.scrollX,
            pageY: this.containerOffset.y + event.pageY - window.scrollY,
            targetNodeId,
            relatedTargetNodeId,
            didClickLocation,
        };
        if (!result.didClickLocation) {
            event.cancelBubble = true;
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            // @ts-ignore
            result.targetNodePreview = generateNodePreview(hitElement);
            // @ts-ignore
            result.expectedNodePreview = generateNodePreview(desiredClickTarget);
            result.expectedNodeVisibility = this.getNodeVisibility(desiredClickTarget);
        }
        this.pendingEventResolve(result);
        return result.didClickLocation;
    }
    static getNodeVisibility(node) {
        const objectAtPath = new ObjectAtPath();
        objectAtPath.objectAtPath = node;
        return objectAtPath.getComputedVisibility();
    }
    static clearEvent(nodeId) {
        if (this.targetNodeId === nodeId) {
            window.removeEventListener('mousedown', this.onMousedown);
            this.pendingEvent = null;
            this.pendingEventResolve = null;
            this.targetNodeId = null;
        }
    }
}
MouseEvents.containerOffset = { x: 0, y: 0 };
MouseEvents.init();
//# sourceMappingURL=MouseEvents.js.map