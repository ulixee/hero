"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = require("@ulixee/commons/lib/Logger");
const HttpTransportToClient_1 = require("./HttpTransportToClient");
const ConnectionToClient_1 = require("./ConnectionToClient");
const { log } = (0, Logger_1.default)(module);
class ApiRegistry {
    constructor(endpoints = []) {
        this.handlersByCommand = {};
        this.register(...endpoints);
    }
    hasHandlerForPath(path) {
        return !!this.handlersByCommand[path.substring(1)];
    }
    register(...endpoints) {
        for (const endpoint of endpoints) {
            this.handlersByCommand[endpoint.command] = endpoint.handler.bind(endpoint);
        }
    }
    createConnection(transport, handlerMetadata) {
        const connection = new ConnectionToClient_1.default(transport, this.handlersByCommand);
        connection.handlerMetadata = handlerMetadata;
        return connection;
    }
    async handleHttpRoute(req, res) {
        const startTime = Date.now();
        const transport = new HttpTransportToClient_1.default(req, res);
        const apiRequest = await transport.readRequest();
        const { command, messageId } = apiRequest;
        const handler = this.handlersByCommand[command];
        if (!handler)
            return false;
        const logger = log.createChild(module, {
            remote: transport.remoteId,
            messageId,
            command,
        });
        let data;
        try {
            logger.info(`api/${apiRequest.command}`, {
                path: req.url,
                apiRequest,
            });
            let args = apiRequest.args;
            if (!Array.isArray(args))
                args = [apiRequest.args];
            const handlerMetadata = this.apiHandlerMetadataFn
                ? this.apiHandlerMetadataFn(apiRequest, logger, transport.remoteId)
                : { logger };
            data = await handler(...args, handlerMetadata);
        }
        catch (error) {
            logger.error(`api/${apiRequest.command}:ERROR`, {
                error,
            });
            data = error;
        }
        await transport.send({
            responseId: messageId,
            data,
        });
        logger.stats(`api/${apiRequest.command}:END`, { data, millis: Date.now() - startTime });
        return true;
    }
}
exports.default = ApiRegistry;
//# sourceMappingURL=ApiRegistry.js.map