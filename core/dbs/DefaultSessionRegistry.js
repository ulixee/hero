"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fileUtils_1 = require("@ulixee/commons/lib/fileUtils");
const utils_1 = require("@ulixee/commons/lib/utils");
const Fs = require("fs");
const Path = require("path");
const SessionDb_1 = require("./SessionDb");
class DefaultSessionRegistry {
    constructor(defaultDir) {
        this.defaultDir = defaultDir;
        this.byId = {};
        if (!Fs.existsSync(this.defaultDir))
            Fs.mkdirSync(this.defaultDir, { recursive: true });
        (0, utils_1.bindFunctions)(this);
    }
    create(sessionId, customPath) {
        const dbPath = this.resolvePath(sessionId, customPath);
        const db = new SessionDb_1.default(sessionId, dbPath);
        this.byId[sessionId] = { db, connections: 1 };
        return db;
    }
    async ids() {
        if (!(await (0, fileUtils_1.existsAsync)(this.defaultDir)))
            return [];
        const sessionIds = [];
        for (const dbName of await Fs.promises.readdir(this.defaultDir)) {
            if (!dbName.endsWith('.db'))
                continue;
            const sessionId = dbName.slice(0, -3);
            sessionIds.push(sessionId);
        }
        return sessionIds;
    }
    // eslint-disable-next-line @typescript-eslint/require-await
    async get(sessionId, customPath) {
        if (sessionId.endsWith('.db'))
            sessionId = sessionId.slice(0, -3);
        const entry = this.byId[sessionId];
        if (!entry?.db?.isOpen || entry?.connections === 0) {
            const dbPath = this.resolvePath(sessionId, customPath);
            this.byId[sessionId] = {
                db: new SessionDb_1.default(sessionId, dbPath, {
                    readonly: true,
                    fileMustExist: true,
                }),
                connections: 1,
            };
        }
        return this.byId[sessionId]?.db;
    }
    async retain(sessionId, customPath) {
        if (sessionId.endsWith('.db'))
            sessionId = sessionId.slice(0, -3);
        const entry = this.byId[sessionId];
        if (!entry?.db?.isOpen) {
            return this.get(sessionId, customPath);
        }
        if (entry) {
            entry.connections += 1;
            return entry.db;
        }
    }
    async close(sessionId, isDeleteRequested) {
        const entry = this.byId[sessionId];
        if (!entry)
            return;
        entry.connections -= 1;
        entry.deleteRequested ||= isDeleteRequested;
        if (entry.connections < 1) {
            delete this.byId[sessionId];
            entry.db.close();
            if (entry.deleteRequested) {
                try {
                    await Fs.promises.rm(entry.db.path);
                }
                catch { }
            }
        }
        else if (!entry.db?.readonly) {
            entry.db.recycle();
        }
    }
    async shutdown() {
        for (const [key, value] of Object.entries(this.byId)) {
            value.db.close();
            if (value.deleteRequested) {
                try {
                    await Fs.promises.rm(value.db.path);
                }
                catch { }
            }
            delete this.byId[key];
        }
        return Promise.resolve();
    }
    async store(sessionId, db) {
        await Fs.promises.writeFile(this.resolvePath(sessionId), db);
        return this.get(sessionId);
    }
    resolvePath(sessionId, customPath) {
        return customPath ?? Path.join(this.defaultDir, `${sessionId}.db`);
    }
}
exports.default = DefaultSessionRegistry;
//# sourceMappingURL=DefaultSessionRegistry.js.map