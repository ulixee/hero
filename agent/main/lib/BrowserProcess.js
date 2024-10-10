"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const childProcess = require("child_process");
const readline = require("readline");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const Fs = require("fs");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const utils_1 = require("@ulixee/commons/lib/utils");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const os_1 = require("os");
const ShutdownHandler_1 = require("@ulixee/commons/lib/ShutdownHandler");
const PipeTransport_1 = require("./PipeTransport");
const env_1 = require("../env");
const WebsocketTransport_1 = require("./WebsocketTransport");
const { log } = (0, Logger_1.default)(module);
class BrowserProcess extends eventUtils_1.TypedEventEmitter {
    constructor(browserEngine, processEnv) {
        super();
        this.browserEngine = browserEngine;
        this.processEnv = processEnv;
        this.isProcessFunctionalPromise = new Resolvable_1.default();
        this.launchStderr = [];
        this.processKilled = false;
        (0, utils_1.bindFunctions)(this);
        this.launchedProcess = this.launch();
        this.bindProcessEvents();
        if (browserEngine.useRemoteDebuggingPort) {
            this.remoteDebuggingUrl = new Resolvable_1.default();
            this.transport = new WebsocketTransport_1.WebsocketTransport(this.remoteDebuggingUrl.promise);
        }
        else {
            this.transport = new PipeTransport_1.PipeTransport(this.launchedProcess);
        }
        this.transport.connectedPromise
            .then(() => this.isProcessFunctionalPromise.resolve(true))
            .catch(err => setTimeout(() => this.isProcessFunctionalPromise.reject(err), 1.1e3));
        this.bindCloseHandlers();
    }
    async close() {
        ShutdownHandler_1.default.unregister(this.close);
        this.gracefulCloseBrowser();
        await this.killChildProcess();
    }
    bindCloseHandlers() {
        ShutdownHandler_1.default.register(this.close);
        this.transport.onCloseFns.push(this.close);
    }
    launch() {
        const { name, executablePath, launchArguments } = this.browserEngine;
        log.info(`${name}.LaunchProcess`, { sessionId: null, executablePath, launchArguments });
        let spawnFile = executablePath;
        if (env_1.default.useRosettaChromeOnMac && process.platform === 'darwin' && (0, os_1.arch)() === 'arm64') {
            this.processEnv ??= process.env;
            this.processEnv.ARCHPREFERENCE = 'x86_64';
            spawnFile = 'arch'; // we need to launch through arch to force Chrome to use Rosetta
            launchArguments.unshift(executablePath);
        }
        const child = childProcess.spawn(spawnFile, launchArguments, {
            // On non-windows platforms, `detached: true` makes child process a
            // leader of a new process group, making it possible to kill child
            // process tree with `.kill(-pid)` command. @see
            // https://nodejs.org/api/child_process.html#child_process_options_detached
            detached: process.platform !== 'win32',
            env: this.processEnv,
            stdio: ['ignore', 'pipe', 'pipe', 'pipe', 'pipe'],
        });
        child.on('error', e => {
            if (!this.isProcessFunctionalPromise) {
                this.isProcessFunctionalPromise.reject(new Error(`Failed to launch browser: ${e}`));
            }
        });
        return child;
    }
    bindProcessEvents() {
        if (!this.launchedProcess.pid)
            return;
        const { stdout, stderr } = this.launchedProcess;
        const name = this.browserEngine.name;
        readline.createInterface({ input: stdout }).on('line', line => {
            if (line)
                log.stats(`${name}.stdout`, { message: line, sessionId: null });
        });
        readline.createInterface({ input: stderr }).on('line', line => {
            if (!line)
                return;
            if (this.remoteDebuggingUrl?.isResolved === false) {
                const match = line.match(/DevTools listening on (.*)/);
                if (match) {
                    this.remoteDebuggingUrl.resolve(match[1].trim());
                }
            }
            this.launchStderr.push(line);
            // don't grow in perpetuity!
            if (this.launchStderr.length > 100) {
                this.launchStderr = this.launchStderr.slice(-100);
            }
            log.warn(`${name}.stderr`, { message: line, sessionId: null });
        });
        this.launchedProcess.once('exit', this.onChildProcessExit);
    }
    gracefulCloseBrowser() {
        try {
            // attempt graceful close, but don't wait
            if (this.transport && !this.transport.isClosed) {
                this.transport.send(JSON.stringify({ method: 'Browser.close', id: -1 }));
                this.transport.close();
            }
        }
        catch (e) {
            // this might fail, we want to keep going
        }
    }
    async killChildProcess() {
        const launchedProcess = this.launchedProcess;
        try {
            if (!launchedProcess.killed && !this.processKilled) {
                const closed = new Promise(resolve => launchedProcess.once('exit', resolve));
                if (process.platform === 'win32') {
                    childProcess.execSync(`taskkill /pid ${launchedProcess.pid} /T /F 2> nul`);
                }
                else {
                    launchedProcess.kill('SIGKILL');
                }
                launchedProcess.emit('exit');
                try {
                    launchedProcess.stdio.forEach(io => io?.destroy());
                }
                catch { }
                launchedProcess.unref();
                await closed;
            }
        }
        catch (e) {
            // might have already been kill off
        }
    }
    onChildProcessExit(exitCode, signal) {
        if (this.processKilled)
            return;
        this.processKilled = true;
        ShutdownHandler_1.default.unregister(this.close);
        if (!this.isProcessFunctionalPromise.isResolved) {
            this.isProcessFunctionalPromise.reject(new Error(`Browser exited prematurely (${signal ?? 'no signal'})`));
        }
        try {
            this.transport?.close();
        }
        catch (e) {
            // drown
        }
        log.info(`${this.browserEngine.name}.ProcessExited`, { exitCode, signal, sessionId: null });
        this.emit('close');
        this.removeAllListeners();
        this.cleanDataDir();
    }
    cleanDataDir(retries = 3) {
        const datadir = this.browserEngine.userDataDir;
        if (!datadir)
            return;
        try {
            if (Fs.existsSync(datadir)) {
                Fs.rmSync(datadir, { recursive: true });
            }
        }
        catch (err) {
            if (retries >= 0) {
                this.cleanDataDir(retries - 1);
            }
        }
    }
}
exports.default = BrowserProcess;
//# sourceMappingURL=BrowserProcess.js.map