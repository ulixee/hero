import { Helpers, TestLogger } from '@ulixee/unblocked-agent-testing';
import { InteractionCommand } from '@ulixee/unblocked-specification/agent/interact/IInteractions';
import { ITestKoaServer } from '@ulixee/unblocked-agent-testing/helpers';
import Pool from '@ulixee/unblocked-agent/lib/Pool';
import Agent from '@ulixee/unblocked-agent/lib/Agent';
import Page from '@ulixee/unblocked-agent/lib/Page';
import { LoadStatus } from '@ulixee/unblocked-specification/agent/browser/Location';
import { URL } from 'url';
import IResourceType from '@ulixee/unblocked-specification/agent/net/IResourceType';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import { IncomingHttpHeaders } from 'http';
import BrowserEmulator from '../index';

let koaServer: ITestKoaServer;
let pool: Pool;

const logger = TestLogger.forTest(module);

beforeEach(Helpers.beforeEach);
beforeAll(async () => {
  pool = new Pool({ plugins: [BrowserEmulator] });
  Helpers.onClose(() => pool.close(), true);
  await pool.start();
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

test('should have a chrome object on iframes', async () => {
  const page = await createPage();

  const frameType = await page.evaluate(`(() => {
  const iframe = document.createElement('iframe');
  iframe.srcdoc = 'blank page';
  document.body.appendChild(iframe);

  const result = typeof iframe.contentWindow.chrome;
  iframe.remove();

  return result;
})();`);
  expect(frameType).toBe('object');
});

test('should not break toString across frames', async () => {
  const page = await createPage();

  const toStrings = await page.evaluate(`(() => {
  const iframe = document.createElement('iframe');
  document.body.appendChild(iframe);

  const contentWindow = iframe.contentWindow;
  const fnCallWithFrame = contentWindow.Function.prototype.toString.call(Function.prototype.toString);
  const fnToString = Function.toString + '';

  return {
    fnToString,
    fnCallWithFrame
  }
})();`);

  const { fnToString, fnCallWithFrame } = toStrings as any;
  expect(fnToString).toBe(fnCallWithFrame);
});

test('should not break iframe functions', async () => {
  const page = await createPage();

  const testFuncReturnValue = 'TESTSTRING';
  await page.evaluate(`((returnValue) => {
    const { document } = window; // eslint-disable-line
    const body = document.querySelector('body');
    const iframe = document.createElement('iframe');
    iframe.srcdoc = 'foobar';
    body.appendChild(iframe);
    iframe.contentWindow.mySuperFunction = () => returnValue;
  })("${testFuncReturnValue}")`);

  const realReturn = await page.evaluate(
    `document.querySelector('iframe').contentWindow.mySuperFunction()`,
  );
  await page.close();
  expect(realReturn).toBe(testFuncReturnValue);
});

test('should have chrome object in all kinds of iframes', async () => {
  const page = await createPage();

  const basiciframe = await page.evaluate(`(() => {
    const el = document.createElement('iframe');
    document.body.appendChild(el);
    return typeof el.contentWindow.chrome;
  })()`);

  const sandboxSOiframe = await page.evaluate(`(() => {
    const el = document.createElement('iframe');
    el.setAttribute('sandbox', 'allow-same-origin');
    document.body.appendChild(el);
    return typeof el.contentWindow.chrome;
  })()`);

  const sandboxSOASiframe = await page.evaluate(`(() => {
    const el = document.createElement('iframe');
    el.setAttribute('sandbox', 'allow-same-origin allow-scripts');
    document.body.appendChild(el);
    return typeof el.contentWindow.chrome;
  })()`);

  const srcdociframe = await page.evaluate(`(() => {
    const el = document.createElement('iframe');
    el.srcdoc = 'blank page, boys.';
    document.body.appendChild(el);
    return typeof el.contentWindow.chrome;
  })()`);

  await page.close();
  expect(basiciframe).toBe('object');
  expect(sandboxSOiframe).toBe('object');
  expect(sandboxSOASiframe).toBe('object');
  expect(srcdociframe).toBe('object');
});

test('should have plugins in frames', async () => {
  const page = await createPage();

  const plugins = await page.evaluate<number>(`window.navigator.plugins.length`);
  const iframePlugins = await page.evaluate<number>(`(() => {
    const iframe = document.createElement('iframe');
    iframe.srcdoc = 'page intentionally left blank';
    document.body.appendChild(iframe);

    return iframe.contentWindow.navigator.plugins.length;
  })()`);
  expect(plugins).toBe(iframePlugins);
});

test('should not be able to detect contentWindow overrides', async () => {
  const page = await createPage();

  const results = await page.evaluate<any>(`(() => {
    const results = {};

    const iframe = document.createElement('iframe');
    iframe.srcdoc = 'page intentionally left blank';
    document.body.appendChild(iframe);

    const descriptors = Object.getOwnPropertyDescriptors(HTMLIFrameElement.prototype);
    results.descriptorToString = descriptors.contentWindow.get.toString();
    results.descriptorToStringToString = descriptors.contentWindow.get.toString.toString();
    results.windowType = typeof iframe.contentWindow;
    results.noProxySignature = !iframe.srcdoc.toString.hasOwnProperty('[[IsRevoked]]');
    return results;
  })()`);
  expect(results.descriptorToString).toBe('function get contentWindow() { [native code] }');
  expect(results.descriptorToStringToString).toBe('function toString() { [native code] }');
  expect(results.noProxySignature).toBe(true);
  expect(results.windowType).toBe('object');
});

test('should override before iframe.src using javascript', async () => {
  const agent = await createAgent();
  const page = await agent.newPage();
  await page.goto(`${koaServer.baseUrl}`);
  await page.waitForLoad(LoadStatus.DomContentLoaded);
  const complete = new Promise(resolve => page.once('console', msg => resolve(msg.message)));

  await page.evaluate(`(() => {

    const iframe = document.createElement('iframe');
    iframe.src = 'javascript:console.log(navigator.userAgent)';
    document.body.appendChild(iframe);
  })()`);

  await expect(complete).resolves.toBe(agent.emulationProfile.userAgentOption.string);
});

test('should emulate contentWindow features', async () => {
  const page = await createPage();

  const results: any = await page.evaluate(`(() => {
    const results = {};

    const iframe = document.createElement('iframe');
    iframe.srcdoc = 'page intentionally left blank';
    document.body.appendChild(iframe);

    results.doesExist = !!iframe.contentWindow; // Verify iframe isn't remapped to main window
    results.isNotAClone = iframe.contentWindow !== window; // Verify iframe isn't remapped to main window
    results.selfIsNotWindow = iframe.contentWindow.self !== window;
    results.selfIsNotWindowTop = iframe.contentWindow.self !== window.top;
    results.selfIsAWindow = iframe.contentWindow.self instanceof Window;
    results.topIsNotSame = iframe.contentWindow.top !== iframe.contentWindow;
    results.frameElementMatches =  iframe.contentWindow.frameElement === iframe;

    return results;
  })()`);

  await page.close();

  expect(results.doesExist).toBe(true);
  expect(results.isNotAClone).toBe(true);
  expect(results.selfIsNotWindow).toBe(true);
  expect(results.selfIsNotWindowTop).toBe(true);
  expect(results.selfIsAWindow).toBe(true);
  expect(results.topIsNotSame).toBe(true);
});

test('should handle a removed frame', async () => {
  const agent = await createAgent();
  const page = await createPage(agent);
  await page.goto(koaServer.baseUrl);
  await page.waitForLoad('PaintingStable');
  const navigatorPlatform = await page.evaluate<string>(`(() => {
    try {
      const numberOfIframes = window.length;
      const div = document.createElement('div');
      div.setAttribute('style', 'display:none');
      document.body.appendChild(div);
      div.innerHTML = '<div style="height: 100vh;width: 100vw;position: absolute;left:-10000px;visibility: hidden;"><iframe></iframe></div>';
      const iframeWindow = window[numberOfIframes];
      div.parentNode.removeChild(div);
      return iframeWindow.navigator.platform;
    } catch (error) {
      console.error(error);
    }
  })()`);
  await page.close();
  expect(navigatorPlatform).toBe(agent.emulationProfile.windowNavigatorPlatform);
});

test('should set user agent on same origin frames', async () => {
  const agent = await createAgent();
  const page = await createPage(agent);
  await page.goto(koaServer.baseUrl);
  await page.waitForLoad('PaintingStable');
  const data = await page.evaluate<any>(`(() => {
    try {
      const iframe = document.createElement('iframe');
      iframe.setAttribute('style', 'display:none');
      iframe.src = location.href;
      document.body.append(iframe);

      const { userAgent, platform } = iframe.contentWindow.navigator || {};
      const data = { iframe: { userAgent, platform}, page: { userAgent: navigator.userAgent, platform: navigator.platform } };
      iframe.parentNode.removeChild(iframe);
      return data;
    } catch (error) {
      console.error(error);
      return;
    }
  })()`);
  await page.close();

  expect(data.iframe.platform).toBe(data.page.platform);
  expect(data.iframe.userAgent).toBe(data.page.userAgent);
});

test('should set user agent on cross origin frames', async () => {
  const iframeData = new Resolvable<{
    iframe: { userAgent: string; platform: string };
    headers: IncomingHttpHeaders;
  }>();
  const sslServer = await Helpers.runHttpsServer(async (req, res) => {
    res.setHeader('access-control-allow-origin', '*');
    res.setHeader(
      'Access-Control-Allow-Headers',
      req.headers['access-control-request-headers'] ?? '',
    );
    if (req.url === '/cross-storage') {
      res.end(`<!DOCTYPE html>
      <html lang="en"><body>
<div>Cross Storage</div>
<iframe src="https://dataliberationfoundation.org/frame" sandbox='allow-scripts' ></iframe>
</body>
      </html>`);
      return;
    }
    if (req.url === '/cross-origin-data' && req.method === 'POST') {
      const result = await Helpers.readableToBuffer(req);
      const json = JSON.parse(result.toString());
      iframeData.resolve({ iframe: json, headers: req.headers });
      res.end('');
      return;
    }
    res.end('');
  });
  const agent = await createAgent();
  const page = await createPage(agent);
  agent.mitmRequestSession.interceptorHandlers.push({
    urls: ['https://dataliberationfoundation.org/*'],
    types: [],
    handlerFn(url: URL, type: IResourceType, request, response) {
      response.end(`<html><body><p>frame body</p>
<script>
  const { userAgent, platform } = window.navigator || {}
   fetch('${sslServer.baseUrl}/cross-origin-data', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userAgent, platform }),
    });
</script>
</body>
</html>`);
      return true;
    },
  });

  await page.goto(`${sslServer.baseUrl}/cross-storage`);
  const data = await page.evaluate<any>(`(() => {
    try {
      const data = { userAgent: navigator.userAgent, platform: navigator.platform };
      
      return data;
    } catch (error) {
      console.error(error);
      return;
    }
  })()`);

  const { iframe, headers } = await iframeData;

  expect(iframe.platform).toBe(data.platform);
  expect(headers['sec-ch-ua-platform']).toBe(
    { Win32: '"Windows"', MacIntel: '"macOS"' }[data.platform],
  );
  expect(iframe.userAgent).toBe(data.userAgent);
  await page.close();
});

// only run this test manually
// eslint-disable-next-line jest/no-disabled-tests
test.skip('should not break recaptcha popup', async () => {
  const page = await createPage();

  await page.goto('https://www.fbdemo.com/invisible-captcha/index.html');

  await page.interact([
    {
      command: InteractionCommand.click,
      mousePosition: ['window', 'document', ['querySelector', '#tswname']],
    },
    {
      command: InteractionCommand.type,
      keyboardCommands: [{ string: 'foo' }],
    },
  ]);
  await page.interact([
    {
      command: InteractionCommand.click,
      mousePosition: ['window', 'document', ['querySelector', '#tswemail']],
    },
    {
      command: InteractionCommand.type,
      keyboardCommands: [{ string: 'foo@foo.foo' }],
    },
  ]);
  await page.interact([
    {
      command: InteractionCommand.click,
      mousePosition: ['window', 'document', ['querySelector', '#tswcomments']],
    },
    {
      command: InteractionCommand.type,
      keyboardCommands: [
        {
          string:
            'In the depth of winter, I finally learned that within me there lay an invincible summer.',
        },
      ],
    },
  ]);
  await page.interact([
    {
      command: InteractionCommand.click,
      mousePosition: ['window', 'document', ['querySelector', '#tswsubmit']],
    },
  ]);
  await new Promise(resolve => setTimeout(resolve, 1e3));

  const { hasRecaptchaPopup } = await page.evaluate<any>(`(() => {
    const hasRecaptchaPopup = !!document.querySelectorAll('iframe[title="recaptcha challenge"]')
      .length;
    return { hasRecaptchaPopup };
  })()`);

  await page.close();

  expect(hasRecaptchaPopup).toBe(true);
});

async function createPage(agent?: Agent): Promise<Page> {
  agent ??= await createAgent();
  const page = await agent.newPage();
  Helpers.needsClosing.push(page);
  await page.goto(koaServer.baseUrl);
  await page.waitForLoad('PaintingStable');
  return page;
}

async function createAgent(): Promise<Agent> {
  const agent = pool.createAgent({
    logger,
  });
  Helpers.needsClosing.push(agent);
  return agent;
}
