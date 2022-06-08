import { Helpers, Hero } from '@ulixee/hero-testing';
import * as Fs from 'fs';
import * as fpscanner from 'fpscanner';
import { Session } from '@ulixee/hero-core';
import { ITestKoaServer } from '@ulixee/hero-testing/helpers';
import { LocationStatus } from '@ulixee/hero';

const fpCollectPath = require.resolve('fpcollect/src/fpCollect.js');

let koaServer: ITestKoaServer;
beforeAll(async () => {
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

  const hero = new Hero();
  Helpers.needsClosing.push(hero);
  await hero.goto(`${koaServer.baseUrl}/collect`);
  await hero.waitForPaintingStable();

  const data = await analyzePromise;
  const results = fpscanner.analyseFingerprint(data);
  for (const key of Object.keys(results)) {
    const result = results[key];
    const isConsistent = result.consistent === fpscanner.CONSISTENT;
    // eslint-disable-next-line no-console
    if (!isConsistent) console.log('Not consistent', result);
    expect(isConsistent).toBe(true);
  }
  expect(data).toBeTruthy();
}, 30e3);

test('should not be denied for notifications but prompt for permissions', async () => {
  const hero = new Hero();
  Helpers.needsClosing.push(hero);
  await hero.goto(`${koaServer.baseUrl}`);
  const activeTab = await hero.activeTab;
  const tabId = await activeTab.tabId;
  const sessionId = await hero.sessionId;
  const tab = Session.getTab({ tabId, sessionId });
  const page = tab.page;
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

test('should not leave markers on permissions.query.toString', async () => {
  const hero = new Hero();
  Helpers.needsClosing.push(hero);
  const tabId = await hero.activeTab.tabId;
  await hero.goto(`${koaServer.baseUrl}`);
  const sessionId = await hero.sessionId;
  const tab = Session.getTab({ tabId, sessionId });
  const page = tab.page;
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
  const hero = new Hero();
  Helpers.needsClosing.push(hero);
  await hero.goto(`${koaServer.baseUrl}`);
  const tabId = await hero.activeTab.tabId;
  const sessionId = await hero.sessionId;
  const tab = Session.getTab({ tabId, sessionId });
  const page = tab.page;
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

test('should properly maintain stack traces in toString', async () => {
  const hero = new Hero();
  Helpers.needsClosing.push(hero);
  await hero.goto(`${koaServer.baseUrl}`);
  const tabId = await hero.activeTab.tabId;
  const sessionId = await hero.sessionId;
  const tab = Session.getTab({ tabId, sessionId });
  const page = tab.page;
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
    `window.hasProperStackTrace(Function.prototype.toString)`,
  );
  expect(fnStack.stack.split('\n').length).toBeGreaterThan(1);
  expect(fnStack.name).toBe('TypeError');
  expect(fnStack.stack.split('\n')[1]).toContain('at Function.toString');

  const fnStack2 = await page.evaluate<any>(`window.hasProperStackTrace(() => {})`);
  expect(fnStack2.stack.split('\n').length).toBeGreaterThan(1);
  expect(fnStack2.name).toBe('TypeError');
  expect(fnStack2.stack.split('\n')[1]).toContain('at Function.toString');
});

// https://github.com/digitalhurricane-io/puppeteer-detection-100-percent
test('should not leave stack trace markers when calling getJsValue', async () => {
  const hero = new Hero();
  Helpers.needsClosing.push(hero);
  const tabId = await hero.activeTab.tabId;
  await hero.goto(koaServer.baseUrl);
  const sessionId = await hero.sessionId;
  const tab = Session.getTab({ tabId, sessionId });
  const page = tab.page;
  await page.evaluate(`(() => {
document.querySelector = (function (orig) {
  return function() {
    const err = new Error('QuerySelector Override Detection');
    return err.stack.toString();
  };
})(document.querySelector);
  })();`);

  // for live variables, we shouldn't see markers of utils.js
  const query = await tab.getJsValue('document.querySelector("h1")');
  expect(query).toBe(
    'Error: QuerySelector Override Detection\n    at HTMLDocument.querySelector (<anonymous>:4:17)\n    at <anonymous>:1:10',
  );
});

test('should not leave stack trace markers when calling in page functions', async () => {
  const hero = new Hero();
  Helpers.needsClosing.push(hero);
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
  await hero.goto(url);
  await hero.waitForPaintingStable();
  const tabId = await hero.activeTab.tabId;
  const sessionId = await hero.sessionId;
  const tab = Session.getTab({ tabId, sessionId });

  const pageFunction = await tab.getJsValue('errorCheck()');
  expect(pageFunction).toBe(
    `Error: This is from inside\n    at errorCheck (${url}:6:17)\n    at <anonymous>:1:1`,
  );

  // for something created
  const queryAllTest = await tab.getJsValue('document.querySelectorAll("h1")');
  expect(queryAllTest).toBe(
    `Error: All Error\n    at HTMLDocument.outerFunction [as querySelectorAll] (${url}:11:19)\n    at <anonymous>:1:10`,
  );
});

test('should not have too much recursion in prototype', async () => {
  const hero = new Hero();
  Helpers.needsClosing.push(hero);
  const tabId = await hero.activeTab.tabId;
  const sessionId = await hero.sessionId;
  const tab = Session.getTab({ tabId, sessionId });
  const page = tab.page;
  await hero.goto(`${koaServer.baseUrl}`);
  await hero.activeTab.waitForLoad(LocationStatus.AllContentLoaded);

  const error = await page.evaluate<{ message: string; name: string }>(`(() => {
    const apiFunction = Object.getOwnPropertyDescriptor(Navigator.prototype, 'deviceMemory').get;

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

  expect(error.name).toBe('TypeError');

  const error2 = await page.evaluate<{ message: string; name: string }>(`(() => {
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

  expect(error2.name).toBe('TypeError');
});

describe('Proxy detections', () => {
  const ProxyDetections = {
    checkInstanceof(apiFunction) {
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

        if (!hasValidStack(error, '    at Proxy.[Symbol.hasInstance]')) {
          return 'expect Proxy.[Symbol.hasInstance]';
        }
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        apiFunction instanceof apiFunction;
        return '"apiFunction instanceof apiFunction" failed to throw';
      } catch (error) {
        if (!hasValidStack(error, '    at Function.[Symbol.hasInstance]')) {
          return 'expect Function.[Symbol.hasInstance]. Was ' + error.stack.split('\n')[1];
        }
      }
      return 'ok';
    },

    getChainCycleLie(apiFunction, method = 'setPrototypeOf') {
      try {
        if (method == 'setPrototypeOf') {
          return Object.setPrototypeOf(apiFunction, Object.create(apiFunction)) + '';
        } else {
          apiFunction.__proto__ = apiFunction;
          return apiFunction++ + '... no failure';
        }
      } catch (error) {
        if (error.name !== 'TypeError')
          return 'Not TypeError - ' + error.name + ':' + error.message;
        if (error.message !== `Cyclic __proto__ value`) return 'Not cyclic __proto__';

        const targetStackLine = ((error.stack || '').split('\n') || [])[1];
        if (
          method === '__proto__' &&
          !targetStackLine.startsWith(`    at Function.set __proto__ [as __proto__]`)
        ) {
          return 'Stack doesnt have "at Function.set __proto__ [as __proto__]": ' + error.stack;
        }
      }
      return 'ok';
    },
  };

  test('should not reveal instanceof proxy behavior on getter', async () => {
    const hero = new Hero();
    Helpers.needsClosing.push(hero);
    const tabId = await hero.activeTab.tabId;
    await hero.goto(`${koaServer.baseUrl}`);
    const sessionId = await hero.sessionId;
    const tab = Session.getTab({ tabId, sessionId });
    const page = tab.page;
    page.on('console', console.log);
    const result: string = await page.evaluate(
      `(function ${ProxyDetections.checkInstanceof.toString()})(Object.getOwnPropertyDescriptor(Navigator.prototype,'userAgent').get);`,
    );
    expect(result).toBe('ok');
  });

  test('should not reveal instanceof proxy behavior on fn', async () => {
    const hero = new Hero();
    Helpers.needsClosing.push(hero);
    const tabId = await hero.activeTab.tabId;
    await hero.goto(`${koaServer.baseUrl}`);
    const sessionId = await hero.sessionId;
    const tab = Session.getTab({ tabId, sessionId });
    const page = tab.page;
    page.on('console', console.log);
    const result: string = await page.evaluate(
      `(function ${ProxyDetections.checkInstanceof.toString()})(Permissions.prototype.query);`,
    );
    expect(result).toBe('ok');
  });

  test('should not reveal recursion errors for getPrototypeOf', async () => {
    const hero = new Hero();
    Helpers.needsClosing.push(hero);
    const tabId = await hero.activeTab.tabId;
    await hero.goto(`${koaServer.baseUrl}`);
    const sessionId = await hero.sessionId;
    const tab = Session.getTab({ tabId, sessionId });
    const page = tab.page;

    const result: string = await page.evaluate(
      `(function ${ProxyDetections.getChainCycleLie.toString()})(Permissions.prototype.query)`,
    );
    expect(result).toBe('ok');
  });

  test('should not reveal recursion errors for getPrototypeOf of a getter', async () => {
    const hero = new Hero();
    Helpers.needsClosing.push(hero);
    const tabId = await hero.activeTab.tabId;
    await hero.goto(`${koaServer.baseUrl}`);
    const sessionId = await hero.sessionId;
    const tab = Session.getTab({ tabId, sessionId });
    const page = tab.page;

    const result: string = await page.evaluate(
      `(function ${ProxyDetections.getChainCycleLie.toString()})(Object.getOwnPropertyDescriptor(Navigator.prototype,'userAgent').get)`,
    );
    expect(result).toBe('ok');
  });

  test('should not reveal recursion errors for __proto__', async () => {
    const hero = new Hero();
    Helpers.needsClosing.push(hero);
    const tabId = await hero.activeTab.tabId;
    await hero.goto(`${koaServer.baseUrl}`);
    const sessionId = await hero.sessionId;
    const tab = Session.getTab({ tabId, sessionId });
    const page = tab.page;
    const protoResult: string = await page.evaluate(
      `(function ${ProxyDetections.getChainCycleLie.toString()})(Permissions.prototype.query, '__proto__')`,
    );
    expect(protoResult).toBe('ok');
  });

  test('should not fail at setting proto of Reflect.setPrototypeOf', async () => {
    const hero = new Hero();
    Helpers.needsClosing.push(hero);
    const tabId = await hero.activeTab.tabId;
    await hero.goto(`${koaServer.baseUrl}`);
    const sessionId = await hero.sessionId;
    const tab = Session.getTab({ tabId, sessionId });
    const page = tab.page;

    function getReflectSetProtoLie(apiFunction) {
      try {
        if (Reflect.setPrototypeOf(apiFunction, Object.create(apiFunction))) {
          return 'setPrototypeOf should have failed';
        }
      } catch (error) {
        return 'failed setting prototype ' + error.message;
      }
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        '123' in apiFunction;
        return 'ok';
      } catch (error) {
        return 'Error checking "123 in fn":' + error.message;
      }
    }
    const result: string = await page.evaluate(
      `(${getReflectSetProtoLie.toString()})(Permissions.prototype.query)`,
    );
    expect(result).toBe('ok');
  });
});
