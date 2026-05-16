"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _Connection_isClosed;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Connection = void 0;
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
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const DevtoolsSession_1 = require("./DevtoolsSession");
const { log } = (0, Logger_1.default)(module);
class Connection extends eventUtils_1.TypedEventEmitter {
    get isClosed() {
        return __classPrivateFieldGet(this, _Connection_isClosed, "f") || this.transport.isClosed;
    }
    get nextId() {
        this.lastId += 1;
        return this.lastId;
    }
    constructor(transport) {
        super();
        this.transport = transport;
        _Connection_isClosed.set(this, false);
        this.lastId = 0;
        this.sessionsById = new Map();
        transport.onMessageFn = this.onMessage.bind(this);
        transport.onCloseFns.push(this.onClosed.bind(this));
        this.rootSession = new DevtoolsSession_1.default(this, 'browser', '');
        this.sessionsById.set('', this.rootSession);
    }
    sendMessage(message) {
        return this.transport.send(JSON.stringify(message));
    }
    getSession(sessionId) {
        return this.sessionsById.get(sessionId);
    }
    dispose() {
        this.onClosed();
        this.transport.close();
    }
    onMessage(message) {
        const timestamp = new Date();
        const object = JSON.parse(message);
        object.timestamp = timestamp;
        const devtoolsSessionId = object.params?.sessionId;
        if (object.method === 'Target.attachedToTarget') {
            const session = new DevtoolsSession_1.default(this, object.params.targetInfo.type, devtoolsSessionId);
            this.sessionsById.set(devtoolsSessionId, session);
            this.emit('on-attach', { session });
        }
        if (object.method === 'Target.detachedFromTarget') {
            const session = this.sessionsById.get(devtoolsSessionId);
            if (session) {
                session.onClosed();
                this.sessionsById.delete(devtoolsSessionId);
            }
        }
        const devtoolsSession = this.sessionsById.get(object.sessionId || '');
        if (devtoolsSession) {
            devtoolsSession.onMessage(object);
        }
        else {
            log.warn('MessageWithUnknownSession', { sessionId: null, message: object });
        }
    }
    onClosed() {
        if (__classPrivateFieldGet(this, _Connection_isClosed, "f"))
            return;
        __classPrivateFieldSet(this, _Connection_isClosed, true, "f");
        for (const [id, session] of this.sessionsById) {
            session.onClosed();
            this.sessionsById.delete(id);
        }
        this.transport.onMessageFn = null;
        this.emit('disconnected');
    }
}
exports.Connection = Connection;
_Connection_isClosed = new WeakMap();
//# sourceMappingURL=Connection.js.map