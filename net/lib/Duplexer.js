"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const ConnectionToCore_1 = require("./ConnectionToCore");
class Duplexer {
    static fromCore(connectionToCore, handlers) {
        return new index_1.ConnectionToClient(connectionToCore.transport, handlers);
    }
    static fromClient(connectionToClient) {
        return new ConnectionToCore_1.default(connectionToClient.transport);
    }
}
exports.default = Duplexer;
//# sourceMappingURL=Duplexer.js.map