"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = require("@ulixee/commons/lib/Logger");
const Database = require("better-sqlite3");
const env_1 = require("../env");
const AwaitedEventsTable_1 = require("../models/AwaitedEventsTable");
const CommandsTable_1 = require("../models/CommandsTable");
const DetachedElementsTable_1 = require("../models/DetachedElementsTable");
const DetachedResourcesTable_1 = require("../models/DetachedResourcesTable");
const DevtoolsMessagesTable_1 = require("../models/DevtoolsMessagesTable");
const DomChangesTable_1 = require("../models/DomChangesTable");
const FlowCommandsTable_1 = require("../models/FlowCommandsTable");
const FlowHandlersTable_1 = require("../models/FlowHandlersTable");
const FocusEventsTable_1 = require("../models/FocusEventsTable");
const FrameNavigationsTable_1 = require("../models/FrameNavigationsTable");
const FramesTable_1 = require("../models/FramesTable");
const InteractionStepsTable_1 = require("../models/InteractionStepsTable");
const MouseEventsTable_1 = require("../models/MouseEventsTable");
const OutputTable_1 = require("../models/OutputTable");
const PageLogsTable_1 = require("../models/PageLogsTable");
const ResourcesTable_1 = require("../models/ResourcesTable");
const ResourceStatesTable_1 = require("../models/ResourceStatesTable");
const ScreenshotsTable_1 = require("../models/ScreenshotsTable");
const ScrollEventsTable_1 = require("../models/ScrollEventsTable");
const SessionLogsTable_1 = require("../models/SessionLogsTable");
const SessionTable_1 = require("../models/SessionTable");
const SnippetsTable_1 = require("../models/SnippetsTable");
const SocketsTable_1 = require("../models/SocketsTable");
const StorageChangesTable_1 = require("../models/StorageChangesTable");
const TabsTable_1 = require("../models/TabsTable");
const WebsocketMessagesTable_1 = require("../models/WebsocketMessagesTable");
const { log } = (0, Logger_1.default)(module);
class SessionDb {
    get readonly() {
        return this.db?.readonly;
    }
    get isOpen() {
        return this.db?.open ?? false;
    }
    constructor(sessionId, path, dbOptions = {}) {
        this.tables = [];
        const { readonly = false, fileMustExist = false } = dbOptions;
        this.sessionId = sessionId;
        this.path = path;
        this.db = new Database(this.path, { readonly, fileMustExist });
        if (env_1.default.enableSqliteWal && !dbOptions.readonly) {
            this.db.unsafeMode(false);
            this.db.pragma('journal_mode = WAL');
            this.db.pragma('synchronous = NORMAL');
        }
        if (!readonly) {
            this.saveInterval = setInterval(this.flush.bind(this), 5e3).unref();
        }
        this.attach();
        if (!readonly) {
            this.batchInsert = this.db.transaction(() => {
                for (const table of this.tables) {
                    try {
                        table.runPendingInserts();
                    }
                    catch (error) {
                        if (String(error).match('attempt to write a readonly database')) {
                            clearInterval(this.saveInterval);
                            this.db = null;
                        }
                        log.error('SessionDb.flushError', {
                            sessionId: this.sessionId,
                            error: String(error),
                            table: table.tableName,
                        });
                    }
                }
            });
        }
    }
    getCollectedAssetNames() {
        const snippets = new Set();
        for (const snippet of this.snippets.all()) {
            snippets.add(snippet.name);
        }
        const resources = new Set();
        for (const resource of this.detachedResources.all()) {
            resources.add(resource.name);
        }
        const elementNames = this.detachedElements.allNames();
        return {
            snippets: [...snippets],
            resources: [...resources],
            elements: [...elementNames],
        };
    }
    close() {
        clearInterval(this.saveInterval);
        if (!this.db)
            return;
        if (this.db.open) {
            this.flush();
        }
        if (env_1.default.enableSqliteWal) {
            // use delete to clean up wal files since we might move this around
            this.db.pragma('journal_mode = DELETE');
        }
        this.db.close();
        this.db = null;
    }
    recycle() {
        this.close();
        this.db = new Database(this.path, { readonly: true });
        this.attach();
    }
    flush() {
        if (this.batchInsert) {
            try {
                this.batchInsert.immediate();
            }
            catch (error) {
                if (String(error).match(/attempt to write a readonly database/) ||
                    String(error).match(/database is locked/)) {
                    clearInterval(this.saveInterval);
                }
                throw error;
            }
        }
    }
    attach() {
        this.commands = new CommandsTable_1.default(this.db);
        this.tabs = new TabsTable_1.default(this.db);
        this.frames = new FramesTable_1.default(this.db);
        this.frameNavigations = new FrameNavigationsTable_1.default(this.db);
        this.sockets = new SocketsTable_1.default(this.db);
        this.resources = new ResourcesTable_1.default(this.db);
        this.resourceStates = new ResourceStatesTable_1.default(this.db);
        this.websocketMessages = new WebsocketMessagesTable_1.default(this.db);
        this.domChanges = new DomChangesTable_1.default(this.db);
        this.detachedElements = new DetachedElementsTable_1.default(this.db);
        this.detachedResources = new DetachedResourcesTable_1.default(this.db);
        this.snippets = new SnippetsTable_1.default(this.db);
        this.flowHandlers = new FlowHandlersTable_1.default(this.db);
        this.flowCommands = new FlowCommandsTable_1.default(this.db);
        this.pageLogs = new PageLogsTable_1.default(this.db);
        this.session = new SessionTable_1.default(this.db);
        this.interactions = new InteractionStepsTable_1.default(this.db);
        this.mouseEvents = new MouseEventsTable_1.default(this.db);
        this.focusEvents = new FocusEventsTable_1.default(this.db);
        this.scrollEvents = new ScrollEventsTable_1.default(this.db);
        this.sessionLogs = new SessionLogsTable_1.default(this.db);
        this.screenshots = new ScreenshotsTable_1.default(this.db);
        this.storageChanges = new StorageChangesTable_1.default(this.db);
        this.devtoolsMessages = new DevtoolsMessagesTable_1.default(this.db);
        this.awaitedEvents = new AwaitedEventsTable_1.default(this.db);
        this.output = new OutputTable_1.default(this.db);
        this.tables.push(this.commands, this.tabs, this.frames, this.frameNavigations, this.sockets, this.resources, this.resourceStates, this.websocketMessages, this.domChanges, this.detachedElements, this.detachedResources, this.snippets, this.flowHandlers, this.flowCommands, this.pageLogs, this.session, this.interactions, this.mouseEvents, this.focusEvents, this.scrollEvents, this.sessionLogs, this.devtoolsMessages, this.screenshots, this.storageChanges, this.awaitedEvents, this.output);
    }
}
exports.default = SessionDb;
//# sourceMappingURL=SessionDb.js.map