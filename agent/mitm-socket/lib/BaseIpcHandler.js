"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const os = require("os");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const net = require("net");
const fs_1 = require("fs");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const utils_1 = require("@ulixee/commons/lib/utils");
const IpcUtils_1 = require("@ulixee/commons/lib/IpcUtils");
const nanoid_1 = require("nanoid");
const Fs = require("fs");
const Path = require("path");
const ext = os.platform() === 'win32' ? '.exe' : '';
const libPath = Path.join(__dirname, `/../dist/${os.platform()}-${os.arch()}`, `connect${ext}`).replace('app.asar', 'app.asar.unpacked');
const distExists = Fs.existsSync(libPath);
const { log } = (0, Logger_1.default)(module);
let hasInitializedStore = false;
class BaseIpcHandler {
    get waitForConnected() {
        this.hasWaitListeners = true;
        return this.waitForConnect.promise;
    }
    get pid() {
        return this.child?.pid;
    }
    constructor(options) {
        this.hasWaitListeners = false;
        this.waitForConnect = new Resolvable_1.default();
        this.ipcServer = new net.Server();
        this.isExited = false;
        this.pendingMessage = '';
        this.options = this.getDefaultOptions(options);
        if (!distExists) {
            throw new Error(`Required files missing! The MitmSocket library was not found at ${libPath}`);
        }
        if (!hasInitializedStore && options.storageDir && !Fs.existsSync(options.storageDir)) {
            hasInitializedStore = true;
            Fs.mkdirSync(options.storageDir, { recursive: true });
        }
        const mode = this.options.mode;
        this.handlerName = `${mode[0].toUpperCase() + mode.slice(1)}IpcHandler`;
        (0, utils_1.bindFunctions)(this);
        (0, fs_1.unlink)(this.options.ipcSocketPath, () => {
            this.ipcServer.listen(this.options.ipcSocketPath);
            this.spawnChild();
        });
        this.ipcServer.once('connection', this.onIpcConnection.bind(this));
    }
    close() {
        if (this.isClosing)
            return;
        const parentLogId = this.logger.info(`${this.handlerName}.Closing`);
        this.isClosing = true;
        if (this.child) {
            try {
                // fix for node 13 throwing errors on closed sockets
                this.child.stdin.on('error', () => {
                    // catch
                });
                // NOTE: windows writes to stdin
                // MUST SEND SIGNALS BEFORE DISABLING PIPE!!
                this.child.send('disconnect');
            }
            catch (err) {
                // don't log epipes
            }
            try {
                this.child.stdio.forEach(io => io?.destroy());
            }
            catch { }
            this.child.kill('SIGINT');
            this.child.unref();
        }
        try {
            this.onExit();
        }
        catch (err) {
            // don't log cleanup issue
        }
        if (!this.waitForConnect.isResolved && this.hasWaitListeners) {
            this.waitForConnect.reject(new IPendingWaitEvent_1.CanceledPromiseError('Canceling ipc connect'), true);
        }
        this.logger.stats(`${this.handlerName}.Closed`, {
            parentLogId,
        });
    }
    async sendIpcMessage(message) {
        await this.waitForConnect.promise;
        await new Promise((resolve, reject) => {
            this.ipcSocket.write(`${JSON.stringify(message)}\n`, err => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    onIpcConnection(socket) {
        this.ipcSocket = socket;
        this.ipcSocket.on('data', this.onIpcData.bind(this));
        this.ipcSocket.on('error', err => {
            // wait a sec to see if we're shutting down
            setImmediate(error => {
                if (!this.isClosing && !this.isExited)
                    this.logger.error(`${this.handlerName}.error`, { error });
            }, err);
        });
        this.waitForConnect.resolve();
    }
    onExit() {
        if (this.isExited)
            return;
        this.isExited = true;
        this.beforeExit();
        this.ipcServer.unref().close(() => {
            (0, fs_1.unlink)(this.options.ipcSocketPath, () => null);
        });
        if (this.ipcSocket) {
            this.ipcSocket.unref().end();
        }
    }
    onError(error) {
        if (this.isClosing)
            return;
        this.logger.error(`${this.handlerName}.onError`, {
            error,
        });
    }
    onIpcData(buffer) {
        if (this.isClosing)
            return;
        let end = buffer.indexOf('\n');
        if (end === -1) {
            this.pendingMessage += buffer.toString();
            return;
        }
        const message = this.pendingMessage + buffer.toString(undefined, 0, end);
        this.onMessage(message);
        let start = end + 1;
        end = buffer.indexOf('\n', start);
        while (end !== -1) {
            this.onMessage(buffer.toString(undefined, start, end));
            start = end + 1;
            end = buffer.indexOf('\n', start);
        }
        this.pendingMessage = buffer.toString(undefined, start);
    }
    onChildProcessMessage(message) {
        if (this.isClosing)
            return;
        this.logger.info(`${this.handlerName}.stdout: ${message}`);
    }
    onChildProcessStderr(message) {
        if (this.isClosing)
            return;
        this.logger.error(`${this.handlerName}.stderr: ${message}`);
    }
    spawnChild() {
        if (this.isClosing)
            return;
        const options = this.options;
        this.child = (0, child_process_1.spawn)(libPath, [JSON.stringify(options)], {
            stdio: ['pipe', 'pipe', 'pipe'],
            windowsHide: true,
            cwd: options.storageDir,
        });
        const child = this.child;
        child.on('exit', this.onExit);
        child.on('error', this.onError);
        child.stdout.setEncoding('utf8');
        child.stderr.setEncoding('utf8');
        child.stdout.on('data', this.onChildProcessMessage);
        child.stderr.on('data', this.onChildProcessStderr);
    }
    getDefaultOptions(options) {
        options.debug ??= log.level === 'stats';
        const mode = options.mode || 'proxy';
        options.mode = mode;
        if (options.ipcSocketPath === undefined) {
            const id = (0, nanoid_1.nanoid)();
            options.ipcSocketPath = (0, IpcUtils_1.createIpcSocketPath)(`ipc-${mode}-${id}`);
        }
        return options;
    }
}
exports.default = BaseIpcHandler;
//# sourceMappingURL=BaseIpcHandler.js.map