import { Helpers } from '@secret-agent/testing';
import Fs from 'fs';
import fpscanner from 'fpscanner';
import Core from '@secret-agent/core';
import SecretAgent from '../index';

const fpCollectPath = require.resolve('fpcollect/src/fpCollect.js');

let koaServer;
beforeAll(async () => {
  await SecretAgent.start();
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
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

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

  const browser = await SecretAgent.createBrowser();
  await browser.goto(`${koaServer.baseUrl}/collect`);

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
});

test('permissions API', async () => {
  const browser = await SecretAgent.createBrowser();
  await browser.goto(`${koaServer.baseUrl}`);
  const core = Core.byTabId[browser.activeTab.tabId];
  // @ts-ignore
  const page = core.tab.puppetPage;
  const isHeadless = await page.evaluate(`(async () => {
    const permissionStatus = await navigator.permissions.query({
      name: 'notifications',
    });
  
    return Notification.permission === 'denied' && permissionStatus.state === 'prompt';
  })();`);
  expect(isHeadless).toBe(false);
});

test('should not leave markers on permissions.query.toString ', async () => {
  const browser = await SecretAgent.createBrowser();
  await browser.goto(`${koaServer.baseUrl}`);
  const core = Core.byTabId[browser.activeTab.tabId];
  // @ts-ignore
  const page = core.tab.puppetPage;
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
  const browser = await SecretAgent.createBrowser();
  await browser.goto(`${koaServer.baseUrl}`);
  const core = Core.byTabId[browser.activeTab.tabId];
  // @ts-ignore
  const page = core.tab.puppetPage;
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
  const browser = await SecretAgent.createBrowser();
  await browser.goto(koaServer.baseUrl);
  const core = Core.byTabId[browser.activeTab.tabId];
  // @ts-ignore
  const page = core.tab.puppetPage;
  await page.evaluate(`(() => {
document.querySelector = (function (orig) {
  return function() {
    const err = new Error('QuerySelector Override Detection');
    return err.stack.toString();
  };
})(document.querySelector);
  })();`);

  // for live variables, we shouldn't see markers of utils.js
  const query = await core.getJsValue('document.querySelector("h1")');
  expect(query.value).toBe(
    'Error: QuerySelector Override Detection\n    at HTMLDocument.querySelector (<anonymous>:4:17)',
  );
});

test('should not leave stack trace markers when calling in page functions', async () => {
  const browser = await SecretAgent.createBrowser();
  koaServer.get('/marker', ctx => {
    ctx.body = `
<body></body>
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
    `;
  });
  const url = `${koaServer.baseUrl}/marker`;
  await browser.goto(url);
  const core = Core.byTabId[browser.activeTab.tabId];

  const pageFunction = await core.getJsValue('errorCheck()');
  expect(pageFunction.value).toBe(`Error: This is from inside\n    at errorCheck (${url}:5:17)`);

  // for something created
  const queryAllTest = await core.getJsValue('document.querySelectorAll("h1")');
  expect(queryAllTest.value).toBe(
    `Error: All Error\n    at HTMLDocument.outerFunction [as querySelectorAll] (${url}:10:19)`,
  );
});
