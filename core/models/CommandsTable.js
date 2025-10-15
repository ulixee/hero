"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SqliteTable_1 = require("@ulixee/commons/lib/SqliteTable");
const TypeSerializer_1 = require("@ulixee/commons/lib/TypeSerializer");
class CommandsTable extends SqliteTable_1.default {
    get last() {
        if (this.history.length === 0)
            return;
        return this.history[this.history.length - 1];
    }
    get lastId() {
        return this.last?.id;
    }
    constructor(db) {
        super(db, 'Commands', [
            ['id', 'INTEGER', 'NOT NULL PRIMARY KEY'],
            ['retryNumber', 'INTEGER', 'NOT NULL PRIMARY KEY'],
            ['tabId', 'INTEGER'],
            ['frameId', 'INTEGER'],
            ['flowCommandId', 'INTEGER'],
            ['activeFlowHandlerId', 'INTEGER'],
            ['startNavigationId', 'INTEGER'],
            ['endNavigationId', 'INTEGER'],
            ['name', 'TEXT'],
            ['args', 'TEXT'],
            ['clientStartDate', 'INTEGER'],
            ['clientSendDate', 'INTEGER'],
            ['runStartDate', 'INTEGER'],
            ['endDate', 'INTEGER'],
            ['result', 'TEXT'],
            ['resultType', 'TEXT'],
            ['callsite', 'TEXT'],
        ], true);
        this.history = [];
        this.historyById = {};
        this.defaultSortOrder = 'id ASC';
    }
    loadHistory() {
        if (this.history.length)
            return this.history;
        this.history = this.all();
        for (const command of this.history) {
            this.historyById[`${command.id}_${command.retryNumber}`] = command;
            if (typeof command.callsite === 'string') {
                command.callsite = JSON.parse(command.callsite ?? '[]');
            }
            if (command.result && typeof command.result === 'string') {
                command.result = TypeSerializer_1.default.parse(command.result);
            }
            if (command.args && typeof command.args === 'string') {
                command.args = TypeSerializer_1.default.parse(command.args);
            }
        }
        this.history.sort((a, b) => {
            if (a.id === b.id)
                return a.retryNumber - b.retryNumber;
            return a.id - b.id;
        });
        return this.history;
    }
    insert(commandMeta) {
        commandMeta.retryNumber ??= 0;
        commandMeta.resultType = commandMeta.result?.constructor?.name ?? typeof commandMeta.result;
        const key = `${commandMeta.id}_${commandMeta.retryNumber}`;
        if (this.historyById[key]) {
            const idx = this.history.indexOf(this.historyById[key]);
            this.history[idx] = commandMeta;
        }
        else {
            this.history.push(commandMeta);
            this.history.sort((a, b) => {
                if (a.id === b.id)
                    return a.retryNumber - b.retryNumber;
                return a.id - b.id;
            });
        }
        this.historyById[key] = commandMeta;
        let args = commandMeta.args;
        if (typeof commandMeta.args !== 'string') {
            if (commandMeta.args.length === 0)
                args = undefined;
            else
                args = TypeSerializer_1.default.stringify(args);
        }
        this.queuePendingInsert([
            commandMeta.id,
            commandMeta.retryNumber,
            commandMeta.tabId,
            commandMeta.frameId,
            commandMeta.flowCommandId,
            commandMeta.activeFlowHandlerId,
            commandMeta.startNavigationId,
            commandMeta.endNavigationId,
            commandMeta.name,
            args,
            commandMeta.clientStartDate,
            commandMeta.clientSendDate,
            commandMeta.runStartDate,
            commandMeta.endDate,
            TypeSerializer_1.default.stringify(commandMeta.result),
            commandMeta.resultType,
            commandMeta.callsite ? JSON.stringify(commandMeta.callsite) : undefined,
        ]);
    }
}
exports.default = CommandsTable;
//# sourceMappingURL=CommandsTable.js.map