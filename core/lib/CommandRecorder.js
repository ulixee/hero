"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = require("@ulixee/commons/lib/Logger");
const Tab_1 = require("./Tab");
const { log } = (0, Logger_1.default)(module);
class CommandRecorder {
    constructor(owner, session, tabId, frameId, fns) {
        this.owner = owner;
        this.session = session;
        this.tabId = tabId;
        this.frameId = frameId;
        this.fnNames = new Set();
        this.fnMap = new Map();
        this.isClosed = false;
        for (const fn of fns) {
            // used for bypassing recording
            owner[`___${fn.name}`] = fn.bind(owner);
            this.fnMap.set(fn.name, fn.bind(owner));
            owner[fn.name] = this.runCommandFn.bind(this, fn.name);
            this.fnNames.add(fn.name);
        }
        this.logger = log.createChild(module, {
            tabId,
            sessionId: session.id,
            frameId,
        });
    }
    cleanup() {
        this.isClosed = true;
        this.session = null;
        this.owner = null;
        this.fnMap.clear();
    }
    async runCommandFn(functionName, ...args) {
        if (this.isClosed)
            return;
        const commandFn = this.fnMap.get(functionName);
        if (!this.fnNames.has(functionName) || !commandFn)
            throw new Error(`Unsupported function requested ${functionName}`);
        const { session, owner } = this;
        if (session === null)
            return;
        const commands = session.commands;
        // retrieve before any async loop deferrals
        const meta = commands.presetMeta;
        session.commands.presetMeta = null;
        const shouldWait = !owner.shouldWaitForCommandLock || owner.shouldWaitForCommandLock(functionName);
        if (shouldWait)
            await commands.waitForCommandLock();
        let tabId = this.tabId;
        const frameId = this.frameId;
        if (!tabId && args.length && args[0] instanceof Tab_1.default) {
            tabId = args[0].id;
        }
        const tab = session.getTab(tabId);
        const frame = tab?.getFrameEnvironment(frameId) ?? this.session.getLastActiveTab()?.mainFrameEnvironment;
        const commandMeta = commands.create(tabId, frameId, frame?.navigations?.top?.id, functionName, args, meta);
        commands.willRunCommand(commandMeta);
        tab?.willRunCommand(commandMeta);
        const id = this.logger.info('Command.run', commandMeta);
        let result;
        try {
            commands.onStart(commandMeta, Date.now());
            result = await commandFn.call(owner, ...args);
            return result;
        }
        catch (err) {
            result = err;
            throw err;
        }
        finally {
            const mainFrame = frame ?? (tab ?? session.getLastActiveTab())?.mainFrameEnvironment;
            commands.onFinished(commandMeta, result, mainFrame?.navigations?.top?.id);
            this.logger.stats('Command.done', { id: commandMeta.id, result, parentLogId: id });
        }
    }
}
exports.default = CommandRecorder;
//# sourceMappingURL=CommandRecorder.js.map