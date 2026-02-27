"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IPendingWaitEvent_1 = require("../interfaces/IPendingWaitEvent");
const errors_1 = require("./errors");
const Resolvable_1 = require("./Resolvable");
const TypedEventEmitter_1 = require("./TypedEventEmitter");
const utils_1 = require("./utils");
var getPrototypeOf = Reflect.getPrototypeOf;
class Queue extends TypedEventEmitter_1.default {
    get isActive() {
        return (this.activeCount > 0 || this.queue.length > 0) && !this.stopDequeuing;
    }
    get size() {
        return this.queue.length;
    }
    constructor(stacktraceMarker = 'QUEUE', concurrency, abortSignal) {
        super();
        this.stacktraceMarker = stacktraceMarker;
        this.concurrency = 1;
        this.idletimeMillis = 500;
        this.idlePromise = (0, utils_1.createPromise)();
        this.activeCount = 0;
        this.abortPromise = new Resolvable_1.default();
        this.stopDequeuing = false;
        this.queue = [];
        if (concurrency)
            this.concurrency = concurrency;
        if (abortSignal) {
            // clear the queue and throw if the query is aborted
            abortSignal.addEventListener('abort', () => {
                this.stop(new errors_1.CodeError('Query aborted', 'ERR_QUERY_ABORTED'));
            });
        }
        void this.idlePromise.then(() => this.emit('idle'));
    }
    run(cb, options) {
        const priority = BigInt(options?.priority ?? 0);
        const promise = (0, utils_1.createPromise)(options?.timeoutMillis);
        const entry = {
            promise,
            cb,
            priority,
            startStack: new Error('').stack.slice(8), // "Error: \n" is 8 chars
        };
        if (!this.queue.length || this.queue[this.queue.length - 1].priority >= priority) {
            this.queue.push(entry);
        }
        else {
            const index = this.getInsertionIndex(priority);
            this.queue.splice(index, 0, entry);
        }
        this.next().catch(() => null);
        return promise.promise;
    }
    reset() {
        this.stop();
        this.abortPromise = new Resolvable_1.default();
        this.stopDequeuing = false;
    }
    willStop() {
        this.stopDequeuing = true;
    }
    stop(error) {
        const canceledError = error ?? new IPendingWaitEvent_1.CanceledPromiseError('Canceling Queue Item');
        this.abortPromise.resolve(canceledError);
        while (this.queue.length) {
            const next = this.queue.shift();
            if (!next)
                continue;
            // catch unhandled rejections here
            // eslint-disable-next-line promise/no-promise-in-callback
            next.promise.promise.catch(() => null);
            this.reject(next, canceledError);
        }
        this.emit('stopped', { error });
    }
    canRunMoreConcurrently() {
        return this.activeCount < this.concurrency;
    }
    async *toGenerator(events) {
        let resolvable = new Resolvable_1.default();
        let running = true;
        const results = [];
        const cleanup = () => {
            if (!running)
                return;
            running = false;
            this.stop();
            results.length = 0;
        };
        this.on('run-completed', result => {
            results.push(result);
            resolvable.resolve();
        });
        this.on('run-error', err => {
            cleanup();
            resolvable.reject(err);
        });
        this.on('idle', () => {
            running = false;
            resolvable.resolve();
        });
        this.on('stopped', ({ error }) => {
            running = false;
            if (error)
                resolvable.reject(error);
            else
                resolvable.resolve();
        });
        // the user broke out of the loop early, ensure we resolve the resolvable result
        // promise and clear the queue of any remaining jobs
        events?.on('cleanup', () => {
            cleanup();
            resolvable.resolve();
        });
        while (running) {
            await resolvable.promise;
            resolvable = new Resolvable_1.default();
            // yield all available results
            while (results.length > 0) {
                const result = results.shift();
                if (result != null) {
                    yield result;
                }
            }
        }
        // yield any remaining results
        yield* results;
        cleanup();
    }
    async next() {
        clearTimeout(this.idleTimout);
        if (!this.canRunMoreConcurrently())
            return;
        if (this.stopDequeuing)
            return;
        const next = this.queue.shift();
        if (!next) {
            if (this.activeCount === 0) {
                this.idleTimout = setTimeout(() => this.idlePromise.resolve(), this.idletimeMillis);
                this.idleTimout.unref();
            }
            return;
        }
        if (this.activeCount === 0 && this.idlePromise.isResolved) {
            const newPromise = (0, utils_1.createPromise)();
            this.idlePromise?.resolve(newPromise.promise);
            this.idlePromise = newPromise;
            void newPromise.then(() => this.emit('idle'));
        }
        this.activeCount += 1;
        try {
            const res = await Promise.race([next.cb(), this.abortPromise.promise]);
            if (this.abortPromise.isResolved) {
                return this.reject(next, await this.abortPromise.promise);
            }
            next.promise.resolve(res);
            this.emit('run-completed', res);
        }
        catch (error) {
            this.emit('run-error', error);
            this.reject(next, error);
        }
        finally {
            this.activeCount -= 1;
        }
        process.nextTick(() => this.next().catch(() => null));
    }
    reject(entry, sourceError) {
        const error = Object.create(getPrototypeOf(sourceError));
        error.message = sourceError.message;
        Object.assign(error, sourceError);
        const marker = `------${this.stacktraceMarker}`.padEnd(50, '-');
        error.stack = `${sourceError.stack}\n${marker}\n  ${entry.startStack}`;
        entry.promise.reject(error);
    }
    getInsertionIndex(priority) {
        for (let i = this.queue.length - 1; i >= 0; i -= 1) {
            const entry = this.queue[i];
            if (entry.priority > priority)
                return i;
        }
    }
}
exports.default = Queue;
//# sourceMappingURL=Queue.js.map