"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Fetcher {
    static createRequest(input, init) {
        let requestOrUrl = input;
        if (typeof input === 'number') {
            requestOrUrl = NodeTracker.getWatchedNodeWithId(input);
        }
        const request = new Request(requestOrUrl, init);
        const nodeId = NodeTracker.watchNode(request);
        return {
            id: nodeId,
            type: 'Request',
        };
    }
    static async fetch(input, init) {
        let requestOrUrl = input;
        if (typeof input === 'number') {
            requestOrUrl = NodeTracker.getWatchedNodeWithId(input);
        }
        const response = await fetch(requestOrUrl, init);
        const nodeId = NodeTracker.watchNode(response);
        return {
            id: nodeId,
            type: response.constructor.name,
        };
    }
}
//# sourceMappingURL=Fetcher.js.map