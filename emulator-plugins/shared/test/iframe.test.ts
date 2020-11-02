import { Helpers } from '@secret-agent/testing';
import Core from '@secret-agent/core';
import { InteractionCommand } from '@secret-agent/core-interfaces/IInteractions';

let koaServer;
beforeAll(async () => {
  await Core.prewarm();
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

test('should not break iframe functions', async () => {
  const page = await createPage();

  const testFuncReturnValue = 'TESTSTRING';
  await page.evaluate(`((returnValue) => {
    const { document } = window; // eslint-disable-line
    const body = document.querySelector('body');
    const iframe = document.createElement('iframe');
    iframe.srcdoc = 'foobar';
    iframe.contentWindow.mySuperFunction = () => returnValue;
    body.appendChild(iframe);
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
    results.topIsNotSame = iframe.contentWindow.top !== iframe.contentWindow;
    results.frameElementMatches =  iframe.contentWindow.frameElement === iframe;

    return results;
  })()`);

  await page.close();

  expect(results.doesExist).toBe(true);
  expect(results.isNotAClone).toBe(true);
  expect(results.selfIsNotWindow).toBe(true);
  expect(results.selfIsNotWindowTop).toBe(true);
  expect(results.topIsNotSame).toBe(true);
});

// only run this test manually
// eslint-disable-next-line jest/no-disabled-tests
test.skip('should not break recaptcha popup', async () => {
  const tab = await Core.createTab();
  const core = Core.byTabId[tab.tabId];
  Helpers.needsClosing.push(core);
  // @ts-ignore
  const page = core.tab.puppetPage;

  await core.goto('https://www.fbdemo.com/invisible-captcha/index.html');

  await core.interact([
    {
      command: InteractionCommand.click,
      mousePosition: ['window', 'document', ['querySelector', '#tswname']],
    },
    {
      command: InteractionCommand.type,
      keyboardCommands: [{ string: 'foo' }],
    },
  ]);
  await core.interact([
    {
      command: InteractionCommand.click,
      mousePosition: ['window', 'document', ['querySelector', '#tswemail']],
    },
    {
      command: InteractionCommand.type,
      keyboardCommands: [{ string: 'foo@foo.foo' }],
    },
  ]);
  await core.interact([
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
  await core.interact([
    {
      command: InteractionCommand.click,
      mousePosition: ['window', 'document', ['querySelector', '#tswsubmit']],
    },
  ]);
  await core.waitForMillis(1000);

  const { hasRecaptchaPopup } = await page.evaluate(`(() => {
    const hasRecaptchaPopup = !!document.querySelectorAll('iframe[title="recaptcha challenge"]')
      .length;
    return { hasRecaptchaPopup };
  })()`);

  await core.close();

  expect(hasRecaptchaPopup).toBe(true);
});

async function createPage() {
  const tab = await Core.createTab();
  const core = Core.byTabId[tab.tabId];
  Helpers.needsClosing.push(core);
  await core.goto(koaServer.baseUrl);
  await core.waitForLoad('AllContentLoaded');
  // @ts-ignore
  return core.tab.puppetPage;
}
