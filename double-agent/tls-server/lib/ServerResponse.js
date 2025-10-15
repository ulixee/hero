"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ServerResponse {
    constructor(child, { connectionId }) {
        this.child = child;
        this.connectionId = connectionId;
    }
    writeHead(status, headers) {
        console.log('TlS Server Issues!', status, headers);
    }
    end(body) {
        this.child.send({
            response: {
                connectionId: this.connectionId,
                body,
            },
        });
    }
}
exports.default = ServerResponse;
//# sourceMappingURL=ServerResponse.js.map