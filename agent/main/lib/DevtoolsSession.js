"use strict";
/**
 * Copyright 2018 Google Inc. All rights reserved.
 * Modifications copyright (c) Data Liberation Foundation Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const utils_1 = require("@ulixee/commons/lib/utils");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const TimeoutError_1 = require("@ulixee/commons/interfaces/TimeoutError");
const ProtocolError_1 = require("../errors/ProtocolError");
const { log } = (0, Logger_1.default)(module);
/**
 * The `DevtoolsSession` instances are used to talk raw Chrome Devtools Protocol.
 *
 * https://chromedevtools.github.io/devtools-protocol/
 */
class DevtoolsSession extends eventUtils_1.TypedEventEmitter {
    get id() {
        return this.sessionId;
    }
    constructor(connection, targetType, sessionId) {
        super();
        this.messageEvents = new eventUtils_1.TypedEventEmitter();
        this.pendingMessages = new Map();
        this.connection = connection;
        this.targetType = targetType;
        this.sessionId = sessionId;
    }
    async send(method, params = {}, sendInitiator, options) {
        if (!this.isConnected()) {
            throw new IPendingWaitEvent_1.CanceledPromiseError(`Cancel Pending Promise (${method}): Target closed.`);
        }
        const id = this.connection.nextId;
        const message = {
            sessionId: this.sessionId || undefined,
            method,
            params,
            id,
        };
        const timestamp = new Date();
        const timeout = options?.timeoutMs ?? 60e3;
        const resolvable = (0, utils_1.createPromise)(timeout, `DevtoolsApiMessage did not respond after ${timeout / 1000} seconds. (${method}, id=${id})`);
        resolvable.promise.catch(err => {
            if (err instanceof TimeoutError_1.default)
                log.info(`DevtoolsSessionError`, {
                    error: err,
                    sessionId: this.sessionId,
                });
        });
        this.pendingMessages.set(id, { resolvable, method });
        if (!this.connection.sendMessage(message)) {
            resolvable.reject(new IPendingWaitEvent_1.CanceledPromiseError('Connection failed to send message'));
            this.pendingMessages.delete(id);
        }
        this.messageEvents.emit('send', {
            id,
            timestamp,
            ...message,
        }, sendInitiator);
        return await resolvable.promise;
    }
    onMessage(object) {
        this.messageEvents.emit('receive', { ...object });
        if (!object.id) {
            this.emit(object.method, object.params);
            return;
        }
        const pending = this.pendingMessages.get(object.id);
        if (!pending)
            return;
        const { resolvable, method } = pending;
        this.pendingMessages.delete(object.id);
        if (object.error) {
            resolvable.reject(new ProtocolError_1.default(resolvable.stack, method, object.error));
        }
        else {
            resolvable.resolve(object.result);
        }
    }
    disposeRemoteObject(object) {
        if (!object.objectId)
            return;
        this.send('Runtime.releaseObject', { objectId: object.objectId }).catch(() => {
            // Exceptions might happen in case of a page been navigated or closed.
            // Swallow these since they are harmless and we don't leak anything in this case.
        });
    }
    onClosed() {
        for (const { resolvable, method } of this.pendingMessages.values()) {
            const error = new IPendingWaitEvent_1.CanceledPromiseError(`Cancel Pending Promise (${method}): Target closed.`);
            error.stack += `\n${'------DEVTOOLS'.padEnd(50, '-')}\n${`------DEVTOOLS_SESSION_ID=${this.sessionId}`.padEnd(50, '-')}\n${resolvable.stack}`;
            resolvable.reject(error, true);
        }
        this.pendingMessages.clear();
        this.connection = null;
        this.emit('disconnected');
    }
    isConnected() {
        return this.connection && !this.connection.isClosed;
    }
}
exports.default = DevtoolsSession;
//# sourceMappingURL=DevtoolsSession.js.map