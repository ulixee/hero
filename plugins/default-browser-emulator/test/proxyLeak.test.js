"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("@ulixee/unblocked-agent-testing/index");
const Pool_1 = require("@ulixee/unblocked-agent/lib/Pool");
const Location_1 = require("@ulixee/unblocked-specification/agent/browser/Location");
const index_2 = require("../index");
const IBrowserEmulatorConfig_1 = require("../interfaces/IBrowserEmulatorConfig");
const logger = index_1.TestLogger.forTest(module);
let koaServer;
let pool;
let referencePool;
beforeEach(index_1.Helpers.beforeEach);
afterAll(index_1.Helpers.afterAll);
afterEach(index_1.Helpers.afterEach);
beforeAll(async () => {
    pool = new Pool_1.default({ plugins: [index_2.default] });
    referencePool = new Pool_1.default({ plugins: [] });
    await Promise.all([pool.start(), referencePool.start()]);
    index_1.Helpers.onClose(() => Promise.all([pool.close(), referencePool.close()]), true);
    koaServer = await index_1.Helpers.runKoaServer();
});
afterAll(index_1.Helpers.afterAll, 30e3);
afterEach(index_1.Helpers.afterEach, 30e3);
// Modify these values for easy testing
const config = {
    removeInjectedLines: true,
    applyStackTraceLimit: true,
    // should only be enable when console plugin is used
    fixConsoleStack: false,
};
const debug = false; // True will increase timeouts and open chrome with debugger attached
// !!!!!!! Be carefull function script() cannot call any other function defined in
// !!!!!!! this file as this won't work with function.toString()
test('should not detect Proxy when accessing caller of toString', async () => {
    function script() {
        return navigator.plugins.toString.caller;
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('Should handle undefined in toString call', async () => {
    function script() {
        // @ts-ignore
        return Function.prototype.toString.call();
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('should handle a null prototype', async () => {
    function script() {
        const frame = document.createElement('iframe');
        frame.width = 0;
        frame.height = 0;
        frame.style = 'position: absolute; top: 0px; left: 0px; border: none; visibility: hidden;';
        document.body.appendChild(frame);
        const descriptor = Object.getOwnPropertyDescriptor(frame.contentWindow.console, 'debug');
        Object.setPrototypeOf.apply(Object, [descriptor.value, frame.contentWindow.console.debug]);
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('should not have too much recursion in prototype', async () => {
    function script() {
        const apiFunction = Object.getOwnPropertyDescriptor(Navigator.prototype, 'deviceMemory').get;
        Object.setPrototypeOf(apiFunction, apiFunction);
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('should not have too much recursion in prototype test 2', async () => {
    function script() {
        const apiFunction = WebGL2RenderingContext.prototype.getParameter;
        Object.setPrototypeOf(apiFunction, apiFunction);
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('cannot detect a proxy of args passed into a proxied function', async () => {
    function script() {
        let path = '';
        const proxyOfArgs = new Proxy([37445], {
            get(target, prop, receiver) {
                path = new Error().stack.slice(8);
                return Reflect.get(target, prop, receiver);
            },
        });
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        gl.getExtension('WEBGL_debug_renderer_info');
        const _result = gl.getParameter.apply(gl, proxyOfArgs);
        return { path };
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('should not see any proxy details in an iframe', async () => {
    function script() {
        const frame = document.createElement('iframe');
        document.body.appendChild(frame);
        return {
            runMap: !!(window.runMap || frame.runMap),
            originalContentWindow: !!frame.originalContentWindow,
        };
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('should handle proxied setPrototype', async () => {
    function script() {
        const p = new Proxy(console, {
            apply() {
                // @ts-expect-error
                return Reflect.apply(...arguments);
            },
            get() {
                // @ts-expect-error
                return Reflect.get(...arguments);
            },
            set() {
                // @ts-expect-error
                return Reflect.set(...arguments);
            },
        });
        // @ts-expect-error
        Object.setPrototypeOf.apply(p.debug, console.debug);
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('should correctly bubble up thisArg used in setPrototypeOf with apply', async () => {
    function script() {
        return Object.setPrototypeOf.apply({}, [console.debug, console.debug]);
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('should handle setPrototype.apply with cyclic proto', async () => {
    function script() {
        //
        Object.setPrototypeOf(console.debug, console.debug);
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('should handle setPrototype.call with undefined on proxied obj', async () => {
    function script() {
        // await new Promise(r => undefined);
        // @ts-expect-error
        Object.setPrototypeOf.call(console.info, [console.info]);
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('should handle an undefined setPrototype for fn', async () => {
    function script() {
        Object.setPrototypeOf(undefined, []);
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('should handle an undefined setPrototype', async () => {
    function script() {
        // @ts-expect-error
        Object.setPrototypeOf.call(undefined, () => { });
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('should not fail at setting proto of Reflect.setPrototypeOf', async () => {
    function script() {
        const apiFunction = Permissions.prototype.query;
        if (Reflect.setPrototypeOf(apiFunction, Object.create(apiFunction))) {
            return 'setPrototypeOf should have failed';
        }
        const _check = '123' in apiFunction;
        return 'ok';
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('Errors should not leak proxy objects, first simple edition: looking at error.stack', async () => {
    function script() {
        function leak() {
            try {
                // @ts-expect-error
                document.boddfsqy.innerHTML = 'dfjksqlm';
            }
            catch (e) {
                return e.stack;
            }
        }
        // @ts-expect-error
        console.info.leak = leak;
        // @ts-expect-error
        return console.info.leak();
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('Errors should not leak proxy objects, second simple edition: looking at Error.captureStackTrace', async () => {
    function script() {
        function leak() {
            const objWithStack = { stack: 'stack' };
            Error.captureStackTrace(objWithStack);
            return objWithStack.stack;
        }
        // @ts-expect-error
        console.info.leak = leak;
        // @ts-expect-error
        return console.info.leak();
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('Errors should not leak proxy objects, advanced edition: looking at Error.prepareStackTrace', async () => {
    function script() {
        let errorSeen;
        let stackTracesSeen;
        function leak() {
            try {
                // @ts-expect-error
                document.boddfsqy.innerHTML = 'dfjksqlm';
            }
            catch (e) {
                return e.stack;
            }
        }
        Error.prepareStackTrace = (error, stackTraces) => {
            // This should already be ok if simply tests succeed but also check
            // everything here is as expected in case we missed something.
            errorSeen = {
                name: error.name,
                message: error.message,
                stack: error.stack,
            };
            // Fixing error.stack is one thing, but holly hell this leaks even more, good thing we can hide this
            stackTracesSeen = stackTraces.map(callsite => {
                const callsiteInfo = {};
                for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(callsite))) {
                    // This doesn't work with JSON.toString, but also doesn't contain anything interesting so just drop it.
                    if (key === 'getThis')
                        continue;
                    try {
                        callsiteInfo[key] = callsite[key]();
                    }
                    catch {
                        // dont care
                    }
                }
                return callsiteInfo;
            });
            return error.stack;
        };
        // @ts-expect-error
        console.info.leak = leak;
        try {
            // @ts-expect-error
            console.info.leak();
        }
        catch (e) {
            // trigger stack
            const _stack = e.stack;
        }
        return { errorSeen, stackTracesSeen };
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('Error should also not leak when using call with a proxy', async () => {
    function script() {
        function leak() {
            try {
                // @ts-expect-error
                document.boddfsqy.innerHTML = 'dfjksqlm';
            }
            catch (e) {
                return e.stack;
            }
        }
        return leak.call(console.info);
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('Error should leak when using call with a proxy that was defined by external user', async () => {
    function script() {
        function leak() {
            try {
                // @ts-expect-error
                document.boddfsqy.innerHTML = 'dfjksqlm';
            }
            catch (e) {
                return e.stack;
            }
        }
        const externalProxy = new Proxy({}, {});
        return leak.call(externalProxy);
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('Error should also not leak when using apply with a proxy', async () => {
    function script() {
        function leak() {
            try {
                // @ts-expect-error
                document.boddfsqy.innerHTML = 'dfjksqlm';
            }
            catch (e) {
                return e.stack;
            }
        }
        return leak.apply(console.info);
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('Error should also not leak when using bind with a proxy', async () => {
    function script() {
        function leak() {
            try {
                // @ts-expect-error
                document.boddfsqy.innerHTML = 'dfjksqlm';
            }
            catch (e) {
                return e.stack;
            }
        }
        const bound = leak.bind(console.info);
        return bound();
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('Bind should work as expected', async () => {
    function script() {
        function bla() {
            return this.data;
        }
        const t = { data: 'test' };
        return bla.bind(t).bind(undefined)();
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('should not leak modified get wrapper for functions on proxy instance', async () => {
    function script() {
        const constructor = console.info.constructor;
        return {
            name: constructor.name,
            toString: constructor.toString(),
        };
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('should not leak proxy when using it as ThisArg and crashing', async () => {
    function script() {
        function thrower() {
            throw new Error('test');
        }
        thrower.call(console.info);
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('toString should print Function when using it with a proxied function prototype', async () => {
    function script() {
        const obj = {};
        Object.setPrototypeOf(obj, Function.prototype.toString);
        obj.toString();
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('throwing function stacks should be the same', async () => {
    function fnStack() {
        return Object.create(AudioBuffer.prototype.copyFromChannel).toString();
    }
    function toStringStack() {
        return Object.create(Function.prototype.toString).toString();
    }
    function arrowFnStack() {
        return Object.create(() => { }).toString();
    }
    function proxiedFnStack() {
        return Object.create(new Proxy(AudioBuffer.prototype.copyFromChannel, {})).toString();
    }
    function getterStack() {
        return Object.create(Object.getOwnPropertyDescriptor(Navigator.prototype, 'deviceMemory').get).toString();
    }
    function proxiedGetterStack() {
        return Object.create(new Proxy(Object.getOwnPropertyDescriptor(Navigator.prototype, 'deviceMemory').get, {})).toString();
    }
    for (const script of [
        fnStack,
        toStringStack,
        arrowFnStack,
        proxiedFnStack,
        getterStack,
        proxiedGetterStack,
    ]) {
        const { output, referenceOutput } = await runScriptWithReference(script);
        expect(output).toEqual(referenceOutput);
    }
});
test('stacktrace length should be the same', async () => {
    function script() {
        function recursive(i) {
            if (i === 30)
                throw new Error('bla');
            return recursive(i + 1);
        }
        recursive(0);
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('string expansion should trigger', async () => {
    function script() {
        let toStringTriggered = false;
        const t = {
            toString() {
                toStringTriggered = true;
                return 'test';
            },
        };
        console.info('%s', t);
        return { toStringTriggered };
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('string expansion trigger should not reveal different .toString location', async () => {
    function script() {
        const error = new Error();
        let wrongStack = false;
        let seenStackInName = '';
        let nameStack = '';
        Object.defineProperty(error, 'stack', {
            get() {
                return 'proxied stack';
            },
        });
        const expectedStack = Object.getOwnPropertyDescriptor(error, 'stack');
        Object.defineProperty(error, 'name', {
            get() {
                if (Object.getOwnPropertyDescriptor(this, 'stack').get !== expectedStack.get) {
                    wrongStack = true;
                }
                seenStackInName = this.stack;
                nameStack = new Error().stack;
                return 'name';
            },
        });
        return { wrongStack, seenStackInName, nameStack };
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('Should not leak we are modifying functions because this changes for primitives', async () => {
    function script() {
        const proxy = new Proxy(Function.prototype.toString, {
            apply(target, thisArg, argArray) {
                return typeof thisArg;
            },
        });
        return proxy.call('stringThisArg');
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('should not leak we modified error constructor', async () => {
    function script() {
        const descriptor = Object.getOwnPropertyDescriptor(window, 'Error');
        const propertyDescriptors = Object.getOwnPropertyDescriptors(Error);
        const fnStack = Error('stack 1').stack;
        const classStack = new Error('stack 2').stack;
        class Test extends Error {
        }
        const testStack = new Test('test').stack;
        return { descriptor, propertyDescriptors, fnStack, classStack, testStack };
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
test('should trigger user unhandledrejection', async () => {
    async function script() {
        const result = {
            triggered: false,
            defaultPrevented: null,
            defaultPreventedAfterCall: null,
        };
        window.addEventListener('unhandledrejection', event => {
            result.triggered = true;
            result.defaultPrevented = event.defaultPrevented;
            event.preventDefault();
            result.defaultPreventedAfterCall = event.defaultPrevented;
        });
        async function thrower() {
            throw new Error('async error');
        }
        void thrower();
        await new Promise(resolve => {
            setTimeout(resolve, 200);
        });
        return result;
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
// ** TEMPLATE for test **/
test('template test', async () => {
    function script() {
        return true;
    }
    const { output, referenceOutput } = await runScriptWithReference(script);
    expect(output).toEqual(referenceOutput);
});
async function runScriptWithReference(fn) {
    const [output, referenceOutput] = await Promise.all([
        runScript(pool, fn),
        runScript(referencePool, fn),
    ]);
    return { output, referenceOutput };
}
async function runScript(poolToUse, fn) {
    const agent = poolToUse.createAgent({
        logger,
        options: { showChrome: debug && poolToUse === pool, showDevtools: debug },
        pluginConfigs: {
            [index_2.default.id]: {
                ...index_2.defaultConfig,
                [IBrowserEmulatorConfig_1.InjectedScript.ERROR]: config,
            },
        },
    });
    index_1.Helpers.needsClosing.push(agent);
    const page = await agent.newPage();
    page.on('console', console.log);
    await page.goto(`${koaServer.baseUrl}`);
    await page.waitForLoad(Location_1.LocationStatus.AllContentLoaded);
    const customtimeout = debug ? 600e3 : undefined;
    const output = await page.evaluate(`(
    async function safeScript(){
      if(${debug}) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        debugger;
      }
      try {
        return await (${fn.toString()})();
      } catch (error) {
        return {
          name: error.constructor.name,
          message: error.message,
          stack: error.stack,
        };
      }
    })()
  `, { timeoutMs: customtimeout });
    return output;
}
// Play with this test
// eslint-disable-next-line jest/no-disabled-tests, jest/expect-expect
test.skip('headful chrome for debugging', async () => {
    const agent = pool.createAgent({
        logger,
        options: {
            // useRemoteDebuggingPort: true,
            showChrome: true,
            // disableMitm: true,
            // useRemoteDebuggingPort: true
        },
        pluginConfigs: {
            [index_2.default.id]: {
                ...allDisabled,
                'Document.prototype.cookie': true,
                'JSON.stringify': false,
                'MediaDevices.prototype.enumerateDevices': true,
                'navigator.deviceMemory': true,
                'navigator.hardwareConcurrency': true,
                'polyfill.add': false,
                'polyfill.modify': false,
                'polyfill.remove': false,
                'polyfill.reorder': false,
                'RTCRtpSender.getCapabilities': true,
                'SharedWorker.prototype': false,
                'speechSynthesis.getVoices': true,
                'WebGLRenderingContext.prototype.getParameter': false,
                'window.screen': true,
                console: false,
                error: true,
                navigator: true,
                performance: true,
                UnhandledErrorsAndRejections: true,
                webrtc: true,
                // ...defaultConfig,
                // [InjectedScript.ERROR]: config,
            },
        },
    });
    index_1.Helpers.needsClosing.push(agent);
    const page = await agent.newPage();
    page.on('console', console.log);
    const url = 'about:blank';
    await page.goto(url).catch(() => undefined);
    // eslint-disable-next-line promise/param-names
    await new Promise(r => undefined);
}, 999999999);
const allDisabled = Object.values(IBrowserEmulatorConfig_1.InjectedScript).reduce((acc, value) => {
    return { ...acc, [value]: false };
}, {});
//# sourceMappingURL=proxyLeak.test.js.map