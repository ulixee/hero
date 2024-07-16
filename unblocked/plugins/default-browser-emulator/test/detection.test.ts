// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable jest/no-standalone-expect */
import Resolvable from '@ulixee/commons/lib/Resolvable';
import { ITestKoaServer } from '@ulixee/unblocked-agent-testing/helpers';
import { Helpers, TestLogger } from '@ulixee/unblocked-agent-testing/index';
import Pool from '@ulixee/unblocked-agent/lib/Pool';
import { LocationStatus } from '@ulixee/unblocked-specification/agent/browser/Location';
import * as fpscanner from 'fpscanner';
import * as Fs from 'fs';
import BrowserEmulator from '../index';

// Some tests are broken on github macos so we don't run them there
const testIfNotOnGithubMac =
  process.env.CI === 'true' && process.platform === 'darwin' ? test.skip : test;

const fpCollectPath = require.resolve('fpcollect/src/fpCollect.js');
const logger = TestLogger.forTest(module);
const browserVersion = BrowserEmulator.default().fullVersion.split('.').map(Number).shift();
let koaServer: ITestKoaServer;
let pool: Pool;
beforeEach(Helpers.beforeEach);
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);
beforeAll(async () => {
  pool = new Pool({ plugins: [BrowserEmulator] });
  await pool.start();
  Helpers.onClose(() => pool.close(), true);
  koaServer = await Helpers.runKoaServer();
  koaServer.get('/fpCollect.min.js', ctx => {
    ctx.set('Content-Type', 'application/javascript');
    ctx.body = Fs.readFileSync(fpCollectPath, 'utf-8')
      .replace('module.exports = fpCollect;', '')
      .replace('const fpCollect = ', 'var fpCollect = ');
  });
  koaServer.get('/collect', ctx => {
    ctx.body = `
<body>
<h1>Collect test</h1>
<script src="/fpCollect.min.js"></script>
<script type="text/javascript">
(async () => {
  fpCollect.addCustomFunction('detailChrome', false, () => {
      const res = {};

      ["webstore", "runtime", "app", "csi", "loadTimes"].forEach((property) => {
          try {
              res[property] = window.chrome[property].constructor.toString();
          } catch(e){
              res.properties = e.toString();
          }
      });

      try {
          window.chrome.runtime.connect('');
      } catch (e) {
          res.connect = e.toString();
      }
      try {
          window.chrome.runtime.sendMessage();
      } catch (e) {
          res.sendMessage = e.toString();
      }

      return res;
  });

  const fp = await fpCollect.generateFingerprint();
  await fetch('/analyze', {
    method:'POST',
    body: JSON.stringify(fp),
  });
})();
</script>
</body>
    `;
  });
});
afterAll(Helpers.afterAll, 30e3);
afterEach(Helpers.afterEach, 30e3);

test('should pass FpScanner', async () => {
  const analyzePromise = new Promise(resolve => {
    koaServer.post('/analyze', async ctx => {
      let body = '';
      for await (const chunk of ctx.req) {
        body += chunk.toString();
      }

      resolve(JSON.parse(body));
      ctx.body = 'Ok';
    });
  });

  const agent = pool.createAgent({
    logger,
  });
  Helpers.needsClosing.push(agent);
  const page = await agent.newPage();
  await page.goto(koaServer.baseUrl);
  await page.goto(`${koaServer.baseUrl}/collect`);

  const data = await analyzePromise;
  const results = fpscanner.analyseFingerprint(data);
  for (const key of Object.keys(results)) {
    const result = results[key];
    const isConsistent = result.consistent === fpscanner.CONSISTENT;
    // webdriver is no longer removed from the dom as of Chrome 89, but fpscanner isn't updated
    if (!isConsistent && result.name === 'WEBDRIVER') continue;
    // eslint-disable-next-line no-console
    if (!isConsistent) console.log('Not consistent', result);
    expect(isConsistent).toBe(true);
  }
  expect(data).toBeTruthy();
}, 30e3);

test('should not be denied for notifications but prompt for permissions', async () => {
  const agent = pool.createAgent({
    logger,
  });
  Helpers.needsClosing.push(agent);
  const page = await agent.newPage();
  await page.goto(`${koaServer.baseUrl}`);
  const permissions = await page.evaluate<any>(`(async () => {
    const permissionStatus = await navigator.permissions.query({
      name: 'notifications',
    });

    return {
      notificationValue: Notification.permission,
      permissionState: permissionStatus.state
    }
  })();`);

  expect(permissions.notificationValue).toBe('default');
  expect(permissions.permissionState).toBe('prompt');
});

test('should not call evaluate on a stack getter when using console for logging', async () => {
  const agent = pool.createAgent({
    logger,
  });
  Helpers.needsClosing.push(agent);
  const page = await agent.newPage();
  // page.on('console', console.log);
  koaServer.get('/debug', ctx => {
    ctx.body = `<html lang='en'><body><h1>Hi</h1><div id='result'>no result</div></body>
  <script>
    window.keys = [];
    const error = new Error();
    window.Object.defineProperty(error, 'stack', {
      configurable: false,
      enumerable: false,
      get: function () {
        window.keys.push(window.keys.at(-1));
        return 'proxied stack';
      }
    });
    Object.keys(console).forEach(key => {
      try {
        window.keys.push(key);
        console[key](error);
        console[key]([error]);
        console[key]({outer: error});
        console[key]({outer: [error]});
        // These don't trigger in normal chrome
        console[key]({outer: {inner: error}});
        console[key]({outer: {inner: [error]}});
      } catch (error) {}
      window.keys.pop(-1);
    })
</script></html>`;
  });
  await page.goto(`${koaServer.baseUrl}/debug`);
  await page.waitForLoad('DomContentLoaded');
  const keys = await page.evaluate<string[]>('window.keys');
  expect(keys).toHaveLength(0);
});

test('should be able to post message', async () => {
  const agent = pool.createAgent({
    logger,
  });
  Helpers.needsClosing.push(agent);
  const page = await agent.newPage();
  page.on('console', console.log);
  await page.goto(`${koaServer.baseUrl}`);
  const result = await page.evaluate<{
    plugins: {
      message: string;
      stack: string;
    };
    mimes: {
      message: string;
      stack: string;
    };
    plugin0: { message: string; stack: string };
    mime0: { message: string; stack: string };
  }>(`(() => {
    const result = {};
    try {
      window.postMessage(navigator.plugins);
    } catch (e) {
      result.plugins = { stack: e.stack, message:e.message }
    }
    try {
      window.postMessage(navigator.plugins[0]);
    } catch (e) {
      result.plugin0 = { stack: e.stack, message:e.message }
    }
    
    try {
      window.postMessage(navigator.mimeTypes);
    } catch (e) {
      result.mimes = { stack: e.stack, message:e.message }
    }
    
    try {
      window.postMessage(navigator.mimeTypes[0]);
      result.mime0='no error'
    } catch (e) {
      result.mime0 = { stack: e.stack, message:e.message }
    }
    return result;
   
 })()`);
  expect(result.plugins.message).toBe(
    "Failed to execute 'postMessage' on 'Window': PluginArray object could not be cloned.",
  );

  expect(result.plugin0.message).toBe(
    "Failed to execute 'postMessage' on 'Window': Plugin object could not be cloned.",
  );

  expect(result.mimes.message).toBe(
    "Failed to execute 'postMessage' on 'Window': MimeTypeArray object could not be cloned.",
  );

  expect(result.mime0.message).toBe(
    "Failed to execute 'postMessage' on 'Window': MimeType object could not be cloned.",
  );
});

test('should not see polyfill error overrides', async () => {
  const agent = pool.createAgent({
    logger,
  });
  Helpers.needsClosing.push(agent);
  const page = await agent.newPage();
  page.on('console', console.log);
  await page.goto(`${koaServer.baseUrl}`);
  // TODO: need to test windows
  const result = await page.evaluate<string>(`(() => {
    try {
        class ass extends Notification{}
        const ss = new ass(0)
       
        return ss.image !== undefined
    } catch (e) {
        return e.stack;
    }
   
 })()`);
  expect(result).not.toContain('anonymuos');
});

test('should get the correct platform from a nested cross-domain srcdoc iframe', async () => {
  koaServer.get('/nested-platform', ctx => {
    ctx.body = `<html><body><h1>hi</h1>
<iframe src='http://127.0.0.1:${koaServer.baseHost.split(':').pop()}/platform-iframe'></iframe>
</body></html>`;
  });
  koaServer.get('/platform-iframe', ctx => {
    ctx.body = `<html><head><script async src='./platform.js' type='text/javascript'></script></head></html>`;
  });
  koaServer.get('/platform.js', async ctx => {
    ctx.set('content-type', 'application/javascript');
    ctx.body = `let iframe = document.createElement("iframe");
    iframe.srcdoc = "/**/";
    iframe.setAttribute("style", "display: none;");
    document.head.appendChild(iframe);
    
    const nav = iframe.contentWindow.navigator;
    document.head.removeChild(iframe);
    iframe = null;
    
    fetch('/js-result', {
      method: 'POST',
      body: JSON.stringify( { win: window.navigator.platform, iframe: nav.platform }),
    })`;
  });

  const result = new Promise<{ win: string; iframe: string }>(resolve => {
    koaServer.post('/js-result', async ctx => {
      const body = (await Helpers.readableToBuffer(ctx.req)).toString();
      ctx.body = 'ok';
      const data = JSON.parse(body);
      resolve(data);
    });
  });

  const agent = pool.createAgent({
    logger,
    customEmulatorConfig: { userAgentSelector: `~ win` },
  });
  agent.hook({
    onNewBrowser(b) {
      b.engine.launchArguments.push('--site-per-process', '--host-rules=MAP * 127.0.0.1');
    },
  });

  Helpers.needsClosing.push(agent);
  const page = await agent.newPage();
  await page.goto(`${koaServer.baseUrl}/nested-platform`);
  await page.waitForLoad('DomContentLoaded');

  const { win, iframe } = await result;
  expect(win).toBe(iframe);
});

testIfNotOnGithubMac(
  'should get the correct webgl vendor from a nested srcdoc iframe',
  async () => {
    const agent = pool.createAgent({
      logger,
    });
    Helpers.needsClosing.push(agent);
    const page = await agent.newPage();
    page.on('console', console.log);
    await page.goto(`${koaServer.baseUrl}`);
    await page.waitForLoad('DomContentLoaded');
    await expect(page.evaluate('document.body.outerHTML')).resolves.toContain(
      '<h1>Example Domain</h1>',
    );
    const result = await page.evaluate<{ vendor: string; src: string }>(`(async () => {
  var iframe = document.createElement("iframe");
  iframe.srcdoc = "/**/";
  iframe.setAttribute("style", "display: none;");
  document.head.appendChild(iframe);
  
  const canvas = iframe.contentWindow.document.createElement("canvas");
  
  const gl = canvas.getContext("webgl");
  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  const vendor = gl.getParameter('37445');
  
  return { vendor, src: iframe.contentWindow.document.body.outerHTML };
 })()`);
    expect(result.vendor).toBe('Intel Inc.');
    expect(result.src).toBe('<body></body>');
  },
);

test('should properly emulate memory', async () => {
  const agent = pool.createAgent({
    logger,
  });
  Helpers.needsClosing.push(agent);
  const page = await agent.newPage();
  page.on('console', console.log);
  const server = await Helpers.runHttpsServer((req, res) => {
    res.end('<html><body><h1>Hi</h1></body></html>');
  }, false);
  await page.goto(`${server.baseUrl}`);
  const { deviceMemory, heapSize } = await page.evaluate<any>(`(() => {
  const { deviceMemory } = navigator
 
  const heapSize = performance?.memory?.jsHeapSizeLimit || null;
  return { deviceMemory, heapSize };
})()`);

  expect([2, 4, 8]).toContain(deviceMemory);
  const heapSizeGb = heapSize ? +(heapSize / 1073741824).toFixed(1) : 0;

  expect(heapSizeGb).toBeLessThanOrEqual(deviceMemory);
});

test('should not overflow on console.debug', async () => {
  const agent = pool.createAgent({
    logger,
  });
  Helpers.needsClosing.push(agent);
  const page = await agent.newPage();
  page.on('console', console.log);
  await page.goto(`${koaServer.baseUrl}`);
  const { stack } = await page.evaluate<any>(`(() => {
    const m = new Proxy(console.debug, { 
        apply() { 
            return Reflect.apply(...arguments) 
        }
    });

    try {
      Object.setPrototypeOf(console.debug, m)
      Object.setPrototypeOf(console.debug, m)
      return { stack: 'no error' }
    } catch(err) {
      return { stack: err.stack };
    }
})()`);
  expect(stack).toBe('no error');
});

test('stack overflow test should match chrome', async () => {
  const agent = pool.createAgent({
    logger,
  });
  Helpers.needsClosing.push(agent);
  const page = await agent.newPage();

  koaServer.get('/betrayal', ctx => {
    ctx.body = `<html>
<body>
<h1>Page</h1>
</body>
<script>
  let depth = 0;
  let message = '';
  let name = '';
  let stack = '';
  
  function iWillBetrayYouWithMyLongName() {
    try {
      depth++;
      iWillBetrayYouWithMyLongName();
    } catch (e) {
      message = e.message;
      name = e.name;
      stack = e.stack.toString();
    }
  }
  
  iWillBetrayYouWithMyLongName();
  window.betrayalResult = {
    depth,
    message,
    name,
    stack
  }
</script>

</html>
    
    `;
  });

  await page.goto(`${koaServer.baseUrl}/betrayal`);

  await page.waitForLoad('DomContentLoaded');
  const result = await page.evaluate<{
    depth: number;
    message: string;
    name: string;
    stack: string;
  }>(`window.betrayalResult`);
  expect(result.message).toBe('Maximum call stack size exceeded');
  expect(result.name).toBe('RangeError');
  expect(result.stack).toContain(
    `at iWillBetrayYouWithMyLongName (${koaServer.baseUrl}/betrayal:5:9)`,
  );
});

test('should properly maintain stack traces in toString', async () => {
  const agent = pool.createAgent({
    logger,
  });
  Helpers.needsClosing.push(agent);
  const page = await agent.newPage();
  await page.goto(`${koaServer.baseUrl}`);
  await page.evaluate(`(() => {
      window.hasProperStackTrace = apiFunction => {
        try {
          Object.create(apiFunction).toString(); // native throws an error
          return { stack: "Didn't Throw" };
        } catch (error) {
          return {
            stack: error.stack,
            name: error.constructor.name
          };
        }
      };
  })();`);

  const fnStack = await page.evaluate<any>(
    `window.hasProperStackTrace(AudioBuffer.prototype.copyFromChannel)`,
  );
  const toStringStack = await page.evaluate<any>(
    `window.hasProperStackTrace(Function.prototype.toString)`,
  );
  const objectStack = await page.evaluate<any>(`window.hasProperStackTrace(() => {})`);
  const proxiedFnStack = await page.evaluate<any>(
    `window.hasProperStackTrace(new Proxy(AudioBuffer.prototype.copyFromChannel, {}))`,
  );
  const getterStack = await page.evaluate<any>(
    `window.hasProperStackTrace(Object.getOwnPropertyDescriptor(Navigator.prototype, 'deviceMemory').get)`,
  );
  const proxiedGetterStack = await page.evaluate<any>(
    `window.hasProperStackTrace(new Proxy(Object.getOwnPropertyDescriptor(Navigator.prototype, 'deviceMemory').get, {}))`,
  );

  expect(fnStack.stack.split('\n').length).toBeGreaterThan(1);
  expect(fnStack.name).toBe('TypeError');
  expect(fnStack.stack.split('\n')[1]).toContain('at Function.toString');

  expect(toStringStack.stack.split('\n').length).toBeGreaterThan(1);
  expect(toStringStack.name).toBe('TypeError');
  expect(toStringStack.stack.split('\n')[1]).toContain('at Function.toString');

  expect(objectStack.stack.split('\n').length).toBeGreaterThan(1);
  expect(objectStack.name).toBe('TypeError');
  expect(objectStack.stack.split('\n')[1]).toContain('at Function.toString');

  expect(getterStack.stack.split('\n').length).toBeGreaterThan(1);
  expect(getterStack.name).toBe('TypeError');
  expect(getterStack.stack.split('\n')[1]).toContain('at Function.toString');

  expect(proxiedFnStack.stack.split('\n').length).toBeGreaterThan(1);
  expect(proxiedFnStack.name).toBe('TypeError');
  expect(proxiedFnStack.stack.split('\n')[1]).toContain('at Object.toString');

  expect(proxiedGetterStack.stack.split('\n').length).toBeGreaterThan(1);
  expect(proxiedGetterStack.name).toBe('TypeError');
  expect(proxiedGetterStack.stack.split('\n')[1]).toContain('at Object.toString');
}, 120e3);

test('should not leave stack trace markers on permissions.query.toString', async () => {
  const agent = pool.createAgent({
    logger,
  });
  Helpers.needsClosing.push(agent);
  const page = await agent.newPage();
  await page.goto(`${koaServer.baseUrl}`);
  const perms: any = await page.evaluate(`(() => {
    const permissions = window.navigator.permissions;
    return {
      hasDirectQueryProperty: permissions.hasOwnProperty('query'),
      queryToString: permissions.query.toString(),
      queryToStringToString: permissions.query.toString.toString(),
      queryToStringHasProxyHandler: permissions.query.toString.hasOwnProperty('[[Handler]]'),
      queryToStringHasProxyTarget: permissions.query.toString.hasOwnProperty('[[Target]]'),
      queryToStringHasProxyRevoked: permissions.query.toString.hasOwnProperty('[[IsRevoked]]'),
    }
  })();`);
  expect(perms.hasDirectQueryProperty).toBe(false);
  expect(perms.queryToString).toBe('function query() { [native code] }');
  expect(perms.queryToStringToString).toBe('function toString() { [native code] }');
  expect(perms.queryToStringHasProxyHandler).toBe(false);
  expect(perms.queryToStringHasProxyTarget).toBe(false);
  expect(perms.queryToStringHasProxyRevoked).toBe(false);
});

test('should not recurse the toString function', async () => {
  const agent = pool.createAgent({
    logger,
  });
  Helpers.needsClosing.push(agent);
  const page = await agent.newPage();
  await page.goto(`${koaServer.baseUrl}`);
  const isHeadless = await page.evaluate(`(() => {
    let gotYou = 0;
    const spooky = /./;
    spooky.toString = function() {
      gotYou += 1;
      return 'spooky';
    };
    console.debug(spooky);
    return gotYou > 1;
  })();`);
  expect(isHeadless).toBe(false);
});

// https://github.com/digitalhurricane-io/puppeteer-detection-100-percent
test('should not leave stack trace markers when calling getJsValue', async () => {
  const agent = pool.createAgent({
    logger,
  });
  Helpers.needsClosing.push(agent);
  const page = await agent.newPage();
  await page.goto(koaServer.baseUrl);
  await page.evaluate(`(() => {
document.querySelector = (function (orig) {
  return function() {
    const err = new Error('QuerySelector Override Detection');
    return err.stack.toString();
  };
})(document.querySelector);
  })();`);

  // for live variables, we shouldn't see markers of utils.js
  const query = await page.evaluate('document.querySelector("h1")', false);
  expect(query).toBe(
    'Error: QuerySelector Override Detection\n    at HTMLDocument.querySelector (<anonymous>:4:17)\n    at <anonymous>:1:10',
  );
});

test('should not leave stack trace markers when calling in page functions', async () => {
  const agent = pool.createAgent({
    logger,
  });
  Helpers.needsClosing.push(agent);
  koaServer.get('/marker', ctx => {
    ctx.body = `
<body>
<h1>Marker Page</h1>
<script type="text/javascript">
  function errorCheck() {
    const err = new Error('This is from inside');
    return err.stack.toString();
  }
  document.querySelectorAll = (function () {
    return function outerFunction() {
      const err = new Error('All Error');
      return err.stack.toString();
    };
  })(document.querySelectorAll);
</script>
</body>
    `;
  });
  const url = `${koaServer.baseUrl}/marker`;
  const page = await agent.newPage();
  await page.goto(url);
  await page.waitForLoad(LocationStatus.AllContentLoaded);

  const pageFunction = await page.evaluate('errorCheck()', false);
  expect(pageFunction).toBe(
    `Error: This is from inside\n    at errorCheck (${url}:6:17)\n    at <anonymous>:1:1`,
  );

  // for something created
  const queryAllTest = await page.evaluate('document.querySelectorAll("h1")', false);
  expect(queryAllTest).toBe(
    `Error: All Error\n    at HTMLDocument.outerFunction [as querySelectorAll] (${url}:11:19)\n    at <anonymous>:1:10`,
  );
});

test('should get correct outerWidth for frame', async () => {
  const agent = pool.createAgent({
    logger,
  });
  Helpers.needsClosing.push(agent);
  const page = await agent.newPage();
  await page.goto(`${koaServer.baseUrl}`);
  await page.waitForLoad(LocationStatus.AllContentLoaded);

  const result = await page.evaluate<{
    frameContentWindowOuterWidth: number;
    outerWidth: number;
    innerWidth: number;
  }>(`(() => {
      const frame = document.createElement('iframe');
      frame.srcdoc =  "/**/";
      frame.width = 0;
      frame.height = 0;
      frame.style = "position: absolute; top: 0px; left: 0px; border: none; visibility: hidden;";
      document.body.appendChild(frame);
      return {
        frameContentWindowOuterWidth: frame.contentWindow.outerWidth, 
        outerWidth: window.outerWidth,
        innerWidth: window.innerWidth
      }
  })();`);
  expect(result.outerWidth).toBe(result.frameContentWindowOuterWidth);
  expect(result.outerWidth).toBeGreaterThanOrEqual(result.innerWidth);
});

describe('Proxy detections', () => {
  const ProxyDetections = {
    checkInstanceof(apiFunction, chromeVersion) {
      const proxy = new Proxy(apiFunction, {});

      function hasValidStack(error, targetStack) {
        if (error.name !== 'TypeError') return false;
        if (error.message !== "Function has non-object prototype 'undefined' in instanceof check")
          return false;
        const targetStackLine = ((error.stack || '').split('\n') || [])[1];
        return targetStackLine.startsWith(targetStack);
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        proxy instanceof proxy;
        return '"proxy instanceof proxy" failed to throw';
      } catch (error) {
        // ---- FAILING HERE! -----
        if (chromeVersion >= 102) {
          if (!hasValidStack(error, '    at [Symbol.hasInstance]')) {
            return 'expect [Symbol.hasInstance]';
          }
        } else if (!hasValidStack(error, '    at Proxy.[Symbol.hasInstance]')) {
          return 'expect Proxy.[Symbol.hasInstance]';
        }
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        apiFunction instanceof apiFunction;
        return '"apiFunction instanceof apiFunction" failed to throw';
      } catch (error) {
        if (chromeVersion >= 102) {
          if (!hasValidStack(error, '    at [Symbol.hasInstance]')) {
            return 'expect [Symbol.hasInstance]';
          }
        } else if (!hasValidStack(error, '    at Function.[Symbol.hasInstance]')) {
          return `expect Function.[Symbol.hasInstance]. Was ${error.stack.split('\n')[1]}`;
        }
      }
      return 'ok';
    },

    getChainCycleLie(apiFunction, chromeVersion, method = 'setPrototypeOf') {
      try {
        if (method === 'setPrototypeOf') {
          return `${Object.setPrototypeOf(apiFunction, Object.create(apiFunction))}`;
        }
        // eslint-disable-next-line no-proto
        apiFunction.__proto__ = apiFunction;
        return `${apiFunction++}... no failure`;
      } catch (error) {
        if (error.name !== 'TypeError') return `Not TypeError - ${error.name}:${error.message}`;
        if (error.message !== `Cyclic __proto__ value`) return 'Not cyclic __proto__';

        const targetStackLine = ((error.stack || '').split('\n') || [])[1];
        if (method === '__proto__') {
          let targetStack = `    at Function.set __proto__ [as __proto__]`;
          if (chromeVersion >= 121) {
            targetStack = `    at set __proto__ (<anonymous>)`;
          } else if (chromeVersion >= 102) {
            targetStack = `    at set __proto__ [as __proto__]`;
          }
          if (chromeVersion >= 102 && !targetStackLine.startsWith(targetStack)) {
            return `Stack doesnt have "${targetStack.trim()}": ${error.stack}`;
          }
        }
      }
      return 'ok';
    },
  };

  test('should not reveal instanceof proxy behavior on getter', async () => {
    const agent = pool.createAgent({
      logger,
    });
    Helpers.needsClosing.push(agent);
    const page = await agent.newPage();
    await page.goto(`${koaServer.baseUrl}`);
    page.on('console', console.log);
    const result: string = await page.evaluate(
      `(function ${ProxyDetections.checkInstanceof.toString()})(Object.getOwnPropertyDescriptor(Navigator.prototype,'userAgent').get, ${browserVersion});`,
    );
    expect(result).toBe('ok');
  });

  test('should not reveal instanceof proxy behavior on fn', async () => {
    const agent = pool.createAgent({
      logger,
    });
    Helpers.needsClosing.push(agent);
    const page = await agent.newPage();
    await page.goto(`${koaServer.baseUrl}`);
    page.on('console', console.log);
    const result: string = await page.evaluate(
      `(function ${ProxyDetections.checkInstanceof.toString()})(Permissions.prototype.query, ${browserVersion});`,
    );
    expect(result).toBe('ok');
  });

  test('should not reveal recursion errors for getPrototypeOf', async () => {
    const agent = pool.createAgent({
      logger,
    });
    Helpers.needsClosing.push(agent);
    const page = await agent.newPage();
    await page.goto(`${koaServer.baseUrl}`);

    const result: string = await page.evaluate(
      `(function ${ProxyDetections.getChainCycleLie.toString()})(Permissions.prototype.query, ${browserVersion})`,
    );
    expect(result).toBe('ok');
  });

  test('should not reveal recursion errors for getPrototypeOf of a getter', async () => {
    const agent = pool.createAgent({
      logger,
    });
    Helpers.needsClosing.push(agent);
    const page = await agent.newPage();
    await page.goto(`${koaServer.baseUrl}`);

    const result: string = await page.evaluate(
      `(function ${ProxyDetections.getChainCycleLie.toString()})(Object.getOwnPropertyDescriptor(Navigator.prototype,'userAgent').get, ${browserVersion})`,
    );
    expect(result).toBe('ok');
  });

  test('should not reveal recursion errors for __proto__', async () => {
    const agent = pool.createAgent({
      logger,
    });
    Helpers.needsClosing.push(agent);
    const page = await agent.newPage();
    await page.goto(`${koaServer.baseUrl}`);
    const protoResult: string = await page.evaluate(
      `(function ${ProxyDetections.getChainCycleLie.toString()})(Permissions.prototype.query, ${browserVersion}, '__proto__')`,
    );
    expect(protoResult).toBe('ok');
  });

  test('should not fail at setting proto of Reflect.setPrototypeOf', async () => {
    const agent = pool.createAgent({
      logger,
    });
    Helpers.needsClosing.push(agent);
    const page = await agent.newPage();
    page.on('console', console.log);
    await page.goto(`${koaServer.baseUrl}`);

    function getReflectSetProtoLie(apiFunction) {
      try {
        if (Reflect.setPrototypeOf(apiFunction, Object.create(apiFunction))) {
          return 'setPrototypeOf should have failed';
        }
      } catch (error) {
        return `failed setting prototype ${error.message}`;
      }
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        '123' in apiFunction;
        return 'ok';
      } catch (error) {
        return `Error checking "123 in fn":${error.message}`;
      }
    }

    const result: string = await page.evaluate(
      `(${getReflectSetProtoLie.toString()})(Permissions.prototype.query)`,
    );
    expect(result).toBe('ok');
  });

  test('should not detect Proxy when accessing caller of toString', async () => {
    const agent = pool.createAgent({
      logger,
    });
    Helpers.needsClosing.push(agent);
    const page = await agent.newPage();
    await page.goto(`${koaServer.baseUrl}`);

    const error = await page.evaluate<{ message: string; stack: string }>(
      `(() => {
  try {
    navigator.plugins.toString.caller;
  } catch (e) {
    return { message:e.message, stack:e.stack};
  }
})();`,
    );

    expect(error).toBeTruthy();
    expect(error.message).not.toContain('Proxy');
    expect(error.stack).not.toContain('Proxy');
    expect(error.stack).not.toContain('Object.get');
    expect(error.stack).not.toContain('Reflect');
    expect(error.stack.split('\n').length).toBeGreaterThan(1);
  });

  test('should handle an undefined setPrototype', async () => {
    const agent = pool.createAgent({
      logger,
    });
    const page = await agent.newPage();
    page.on('console', console.log);
    await page.goto(`${koaServer.baseUrl}`);
    await page.waitForLoad(LocationStatus.AllContentLoaded);

    const error = await page.evaluate<{ message: string; name: string; stack: string }>(`(() => {

  try {
    Object.setPrototypeOf.call(undefined, () => {})
  } catch (error) {
    return {
      name: error.constructor.name,
      message: error.message,
      stack: error.stack,
    }
  }
})();`);
    expect(error.stack.match(/at setPrototypeOf/g)).toHaveLength(1);
    expect(error.name).toBe('TypeError');
  });

  test('should handle an undefined setPrototype for fn', async () => {
    const agent = pool.createAgent({
      logger,
    });
    const page = await agent.newPage();
    page.on('console', console.log);
    await page.goto(`${koaServer.baseUrl}`);
    await page.waitForLoad(LocationStatus.AllContentLoaded);

    const error = await page.evaluate<{ message: string; name: string; stack: string }>(`(() => {

  try {
    Object.setPrototypeOf(undefined, [])
  } catch (error) {
    return {
      name: error.constructor.name,
      message: error.message,
      stack: error.stack,
    }
  }
})();`);
    expect(error.stack.match(/at Function.setPrototypeOf/g)).toHaveLength(1);
    expect(error.name).toBe('TypeError');
  });

  test('should handle setPrototype.call with undefined', async () => {
    const agent = pool.createAgent({
      logger,
    });
    const page = await agent.newPage();
    page.on('console', console.log);
    await page.goto(`${koaServer.baseUrl}`);
    await page.waitForLoad(LocationStatus.AllContentLoaded);

    const error = await page.evaluate<{ message: string; name: string; stack: string }>(`(() => {

 try {
    Object.setPrototypeOf.call(console.debug, [console.debug])
    return true
  } catch (error) {
    return {
      name: error.constructor.name,
      message: error.message,
      stack: error.stack,
    }
  }
})();`);
    expect(error.stack.match(/at Proxy.setPrototypeOf/g)).toBeNull();
    expect(error.stack.match(/at Function.setPrototypeOf/g)).toHaveLength(1);
    expect(error.name).toBe('TypeError');
  });

  test('should handle setPrototype.apply with undefined', async () => {
    const agent = pool.createAgent({
      logger,
    });
    const page = await agent.newPage();
    page.on('console', console.log);
    await page.goto(`${koaServer.baseUrl}`);
    await page.waitForLoad(LocationStatus.AllContentLoaded);

    const error = await page.evaluate<{ message: string; name: string; stack: string }>(`(() => {

 try {
    Object.setPrototypeOf.apply(console.debug, [console.debug, console.debug])
    return true
  } catch (error) {
    return {
      name: error.constructor.name,
      message: error.message,
      stack: error.stack,
    }
  }
})();`);
    expect(error.stack.match(/at Proxy.setPrototypeOf/g)).toBeNull();
    expect(error.stack.match(/at Function.setPrototypeOf/g)).toHaveLength(1);
    expect(error.name).toBe('TypeError');
  });

  test('should handle proxied setPrototype', async () => {
    const agent = pool.createAgent({
      logger,
    });
    const page = await agent.newPage();
    page.on('console', console.log);
    await page.goto(`${koaServer.baseUrl}`);
    await page.waitForLoad(LocationStatus.AllContentLoaded);

    const error = await page.evaluate<{ message: string; name: string; stack: string }>(`(() => {

 try {
    const p = new Proxy(console, {
        apply() {
          return Reflect.apply(...arguments)
        },
        get() {
          return Reflect.get(...arguments)
        },
        set() {
          return Reflect.set(...arguments)
        },
      })

      Object.setPrototypeOf.apply(p.debug, console.debug)
      return true
  } catch (error) {
    return {
      name: error.constructor.name,
      message: error.message,
      stack: error.stack,
    }
  }
})();`);
    expect(error.stack.match(/at Proxy.setPrototypeOf/g)).toBeNull();
    expect(error.stack.match(/at Object.setPrototypeOf/g)).toBeNull();
    expect(error.stack.match(/at Function.setPrototypeOf/g)).toHaveLength(1);
    expect(error.name).toBe('TypeError');
  });

  test('should correctly bubble anonymous object prototype', async () => {
    const agent = pool.createAgent({
      logger,
    });
    const page = await agent.newPage();
    page.on('console', console.log);
    await page.goto(`${koaServer.baseUrl}`);
    await page.waitForLoad(LocationStatus.AllContentLoaded);

    const error = await page.evaluate<{ message: string; name: string; stack: string }>(`(() => {

 try {
    Object.setPrototypeOf.apply({}, [console.debug, console.debug])
    return true
  } catch (error) {
    return {
      name: error.constructor.name,
      message: error.message,
      stack: error.stack,
    }
  }
})();`);
    expect(error.stack.match(/at Object.setPrototypeOf/g)).toHaveLength(1);
    expect(error.name).toBe('TypeError');
  });

  test('should not see any proxy details in an iframe', async () => {
    const agent = pool.createAgent({
      logger,
    });
    Helpers.needsClosing.push(agent);
    const page = await agent.newPage();
    await page.goto(`${koaServer.baseUrl}`);
    await page.waitForLoad(LocationStatus.AllContentLoaded);

    const result = await page.evaluate<{
      runMap: boolean;
      originalContentWindow: boolean;
    }>(`(() => {
      const frame = document.createElement('iframe');
      document.body.appendChild(frame);
      return {
        runMap: !!(window.runMap || frame.runMap),
        originalContentWindow: !!frame.originalContentWindow, 
      }
  })();`);
    expect(result.runMap).toBe(false);
    expect(result.originalContentWindow).toBe(false);
  });

  testIfNotOnGithubMac('cannot detect a proxy of args passed into a proxied function', async () => {
    const agent = pool.createAgent({
      logger,
    });
    Helpers.needsClosing.push(agent);
    const page = await agent.newPage();
    page.on('console', console.log);
    await page.goto(`${koaServer.baseUrl}`);
    const result = await page.evaluate<{ path: string; result: string }>(`(async () => {
  let path = ''
  const proxyOfArgs = new Proxy([37445], { 
     get(target,prop, receiver) { 
       path = new Error().stack.slice(8); 
       return Reflect.get(target,prop, receiver)
     }
  })
  
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl");
  gl.getExtension('WEBGL_debug_renderer_info')
  const result = gl.getParameter.apply(gl, proxyOfArgs);
  return { path, result };
 })()`);
    expect(result.path).not.toContain('<anonymuos>');
    expect(result.result).toBe('Intel Inc.');
  });

  test('should not have too much recursion in prototype', async () => {
    const agent = pool.createAgent({
      logger,
    });
    Helpers.needsClosing.push(agent);
    const page = await agent.newPage();
    await page.goto(`${koaServer.baseUrl}`);
    await page.waitForLoad(LocationStatus.AllContentLoaded);

    const error = await page.evaluate<{ message: string; name: string; stack: string }>(`(() => {
    const apiFunction = Object.getOwnPropertyDescriptor(Navigator.prototype, 'deviceMemory').get;

    try {
      Object.setPrototypeOf(apiFunction, apiFunction) + ''
      return true
    } catch (error) {
      return {
        name: error.constructor.name,
        message: error.message,
        stack: error.stack,
      }
    }
  })();`);

    expect(error.stack.match(/Function.setPrototypeOf/g)).toHaveLength(1);
    expect(error.stack.match(/Object.apply/g)).toBe(null);
    expect(error.name).toBe('TypeError');

    const error2 = await page.evaluate<{ message: string; name: string; stack: string }>(`(() => {
  const apiFunction = WebGL2RenderingContext.prototype.getParameter;

  try {
    Object.setPrototypeOf(apiFunction, apiFunction) + ''
    return true
  } catch (error) {
  console.log(error)
    return {
      name: error.constructor.name,
      message: error.message,
      stack: error.stack,
    }
  }
})();`);
    expect(error2.stack.match(/Function.setPrototypeOf/g)).toHaveLength(1);
    expect(error.stack.match(/Object.apply/g)).toBe(null);
    expect(error2.name).toBe('TypeError');
  });

  test('should handle a null prototype', async () => {
    const agent = pool.createAgent({
      logger,
    });
    const page = await agent.newPage();
    page.on('console', console.log);
    await page.goto(`${koaServer.baseUrl}`);
    await page.waitForLoad(LocationStatus.AllContentLoaded);

    const error = await page.evaluate<{ message: string; name: string; stack: string }>(`(() => {

  try {
    const frame = document.createElement('iframe');
    frame.width = 0;
    frame.height = 0;
    frame.style = "position: absolute; top: 0px; left: 0px; border: none; visibility: hidden;";
    document.body.appendChild(frame);
    const descriptor = Object.getOwnPropertyDescriptor(frame.contentWindow.console, 'debug');
    
    Object.setPrototypeOf.apply(Object, [descriptor.value, frame.contentWindow.console.debug]);
    return true
  } catch (error) {
    return {
      name: error.constructor.name,
      message: error.message,
      stack: error.stack,
    }
  }
})();`);
    expect(error.stack.match(/Function.setPrototypeOf/g)).toHaveLength(1);
    expect(error.stack.match(/Object.apply/g)).toBe(null);
    expect(error.name).toBe('TypeError');
  });
});

it('should emulate in a shared worker', async () => {
  const hasAllResults = new Resolvable<void>();
  const jsonResults: string[] = [];
  const iterations = 1;
  const httpsServer = await Helpers.runHttpsServer(async (req, res) => {
    res.setHeader('access-control-allow-origin', '*');
    if (req.url === '/test.html') {
      res.end(`<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Document</title>
	</head>
	<body>
		<script>
      const { hardwareConcurrency, userAgent, deviceMemory } = navigator;
		  const results = [{ hardwareConcurrency, userAgent, deviceMemory }];
      
      (async () => {
        async function check() {
          const { port } = new SharedWorker("worker.js");
  
          port.start();
  
          await new Promise(resolve => {
            port.addEventListener("message", e => {
              port.close();
              results.push(e.data);
              resolve();
            });
          })
        }
  
        const checks = [];
        for (let index = 0; index < 5; index++) {
          checks.push(check());
        }
        await Promise.all(checks)
        
       await fetch('/worker-result', {
          method: 'POST',
          body: JSON.stringify(results),
        });
     })();
		</script>
</body></html>`);
    } else if (req.url.includes('worker-result')) {
      const result = await Helpers.readableToBuffer(req);
      jsonResults.push(result.toString());
      if (jsonResults.length === iterations) {
        hasAllResults.resolve();
      }

      res.end('');
    } else {
      await new Promise(resolve => setTimeout(resolve, 50));
      const body = Fs.readFileSync(`${__dirname}/assets/worker2.js`);
      res.setHeader('etag', 'W/"69-18719828fba"');
      res.setHeader('content-type', 'application/javascript; charset=utf-8');
      res.end(body);
    }
  });

  await Promise.allSettled(
    Array(iterations)
      .fill(0)
      .map(async () => {
        const agent = pool.createAgent({ logger });
        Helpers.needsClosing.push(agent);
        const page = await agent.newPage();
        await page.goto(`${httpsServer.baseUrl}/test.html`);
      }),
  );

  await hasAllResults;
  const results = jsonResults.map(x => JSON.parse(x));
  expect(results).toHaveLength(iterations);

  const resultWithUnmasked: any[] = [];

  for (const result of results) {
    const hardware = new Set(result.map(x => x.hardwareConcurrency));
    const ua = new Set(result.map(x => x.userAgent));
    if (ua.size > 1 || hardware.size > 1)
      resultWithUnmasked.push({ hardware: [...hardware], ua: [...ua] });
  }
  expect(resultWithUnmasked).toHaveLength(0);
});

it('should emulate in a blob shared worker', async () => {
  const hasAllResults = new Resolvable<void>();
  const jsonResults: string[] = [];
  const iterations = 2;

  const httpsServer = await Helpers.runHttpsServer(async (req, res) => {
    res.setHeader('access-control-allow-origin', '*');
    if (req.url === '/test.html') {
      res.end(`<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Document</title>
	</head>
	<body>
		<script>
      const { hardwareConcurrency, userAgent, deviceMemory } = navigator;
		  const results = [{ hardwareConcurrency, userAgent, deviceMemory }];
      
      (async () => {
        async function check() {
          const { port } = new SharedWorker(URL.createObjectURL(new Blob([
            "const { hardwareConcurrency, userAgent, deviceMemory } = navigator;",
            "onconnect = e => {",
            "  const port = e.ports[0];",
            "  port.postMessage({ hardwareConcurrency, userAgent, deviceMemory });",
            "  port.close();",
            "};"
         ], { type: 'application/javascript' })));
  
          port.start();
  
          await new Promise(resolve => {
            port.addEventListener("message", e => {
              port.close();
              results.push(e.data);
              resolve();
            });
          })
        }
  
        const checks = [];
        for (let index = 0; index < 20; index++) {
          checks.push(check());
        }
        await Promise.all(checks)
        
       await fetch('/worker-result', {
          method: 'POST',
          body: JSON.stringify(results),
        });
     })();
		</script>
</body></html>`);
    } else if (req.url.includes('worker-result')) {
      const result = await Helpers.readableToBuffer(req);
      jsonResults.push(result.toString());
      if (jsonResults.length === iterations) {
        hasAllResults.resolve();
      }

      res.end('');
    }
  });

  for (let i = 0; i < iterations; i += 1) {
    const agent = pool.createAgent({ logger });
    Helpers.needsClosing.push(agent);
    const page = await agent.newPage();
    await page.goto(`${httpsServer.baseUrl}/test.html`);
  }

  await hasAllResults;
  const results = jsonResults.map(x => JSON.parse(x));
  expect(results).toHaveLength(iterations);

  const resultWithUnmasked: any[] = [];

  for (const result of results) {
    const hardware = new Set(result.map(x => x.hardwareConcurrency));
    const ua = new Set(result.map(x => x.userAgent));
    if (ua.size > 1 || hardware.size > 1)
      resultWithUnmasked.push({ hardware: [...hardware], ua: [...ua] });
  }
  expect(resultWithUnmasked).toHaveLength(0);
});

test('should not trigger stack for unhandled error', async () => {
  const agent = pool.createAgent({
    logger,
  });
  Helpers.needsClosing.push(agent);
  const page = await agent.newPage();
  // page.on('console', console.log);
  koaServer.get('/debug', ctx => {
    ctx.body = `<html lang='en'><body><h1>Hi</h1><div id='result'>no result</div></body>
  <script>
    window.getterCalled = false;
    const error = new Error();
    window.Object.defineProperty(error, 'stack', {
      configurable: false,
      enumerable: false,
      get: function () {
        window.getterCalled = true;
        return 'proxied stack';
      }
    });
    throw error;
</script></html>`;
  });
  await page.goto(`${koaServer.baseUrl}/debug`);
  await page.waitForLoad('DomContentLoaded');
  const getterCalled = await page.evaluate<boolean>('window.getterCalled');
  expect(getterCalled).toBeFalsy();
});

test('should not trigger stack for unhandled rejections', async () => {
  const agent = pool.createAgent({
    logger,
  });
  Helpers.needsClosing.push(agent);
  const page = await agent.newPage();
  // page.on('console', console.log);
  koaServer.get('/debug', ctx => {
    ctx.body = `<html lang='en'><body><h1>Hi</h1><div id='result'>no result</div></body>
  <script>
    window.getterCalled = false;
    const error = new Error();
    window.Object.defineProperty(error, 'stack', {
      configurable: false,
      enumerable: false,
      get: function () {
        window.getterCalled = true;
        return 'proxied stack';
      }
    });
    async function test(){
      throw error;
    }
    test();
</script></html>`;
  });
  await page.goto(`${koaServer.baseUrl}/debug`);
  await page.waitForLoad('DomContentLoaded');
  const getterCalled = await page.evaluate<boolean>('window.getterCalled');
  expect(getterCalled).toBeFalsy();
});
