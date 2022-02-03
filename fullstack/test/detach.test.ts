import { Helpers } from '@ulixee/hero-testing';
import { ITestKoaServer } from '@ulixee/hero-testing/helpers';
import Hero from '../index';
import CoreSession from '@ulixee/hero/lib/CoreSession';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import FrameEnvironment from '@ulixee/hero-core/lib/FrameEnvironment';
import Core from '@ulixee/hero-core/index';
import ConnectionToLocalCore from '../lib/ConnectionToLocalCore';
import { InternalPropertiesSymbol } from '@ulixee/hero/lib/InternalProperties';

let koaServer: ITestKoaServer;
const coreSessionDetachSpy = jest.spyOn(CoreSession.prototype, 'detachTab');

beforeAll(async () => {
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic Detach tests', () => {
  it('can detach a document', async () => {
    koaServer.get('/detach-1', ctx => {
      ctx.body = `
        <body>
          <a href="#page1">Click Me</a>
        </body>
      `;
    });
    const hero = await openBrowser(`/detach-1`);
    const links = await hero.document.querySelectorAll('a').length;
    expect(links).toBe(1);

    const frozenTab = await hero.detach(hero.activeTab);
    const detachedTab = await frozenTab.document.querySelectorAll('a').length;
    expect(detachedTab).toBe(1);
  });

  it('should keep the original tab detached', async () => {
    koaServer.get('/detach-grow', ctx => {
      ctx.body = `
        <body>
          <a href="javascript:void(0);" onclick="clicker()">Click Me</a>

          <script>
          function clicker() {
            const elem = document.createElement('A');
            document.querySelector('a').after(elem)
          }
          </script>
        </body>
      `;
    });
    const hero = await openBrowser(`/detach-grow`);
    const links = await hero.document.querySelectorAll('a').length;
    expect(links).toBe(1);

    const frozenTab = await hero.detach(hero.activeTab);
    const detachedTab = await frozenTab.document.querySelectorAll('a').length;
    expect(detachedTab).toBe(1);

    await hero.click(hero.document.querySelector('a'));
    const linksAfterClick = await hero.document.querySelectorAll('a').length;
    expect(linksAfterClick).toBe(2);

    const detachedLinksAfterClick = await frozenTab.document.querySelectorAll('a').length;
    expect(detachedLinksAfterClick).toBe(1);

    const frozenTab2 = await hero.detach(hero.activeTab);
    const detachedTab2 = await frozenTab2.document.querySelectorAll('a').length;
    expect(detachedTab2).toBe(2);
  });

  it('can handle jsPaths when element not present', async () => {
    coreSessionDetachSpy.mockClear();
    let run = 0;
    koaServer.get('/detach-notthere', ctx => {
      run += 1;
      if (run === 1) {
        ctx.body = `
        <body>
          <a id="link1">Click Me</a>
          <div id="loop">
              <div class="parent">
                <div class="child">1</div>
                <div class="child">2</div>
                <div class="child">3</div>
              </div>
          </div>
        </body>
      `;
      } else {
        ctx.body = `
        <body>
          <a id="link2">Click Me</a>
        </body>
      `;
      }
    });

    {
      const agent = await openBrowser(`/detach-notthere`);
      await mockDetach(agent);
      const frozenTab = await agent.detach(agent.activeTab);
      const link = await frozenTab.document.querySelector('#link1');
      await expect(link.innerText).resolves.toBe('Click Me');
      await expect(
        frozenTab.document.querySelector('#loop').firstElementChild.innerHTML,
      ).resolves.toBeTruthy();
      const parent = await frozenTab.document.querySelectorAll('.child');
      for (const child of parent) {
        await expect(child.hasAttribute('class')).resolves.toBe(true);
      }
      await agent.close();
    }
    {
      const agent = await openBrowser(`/detach-notthere`);
      await mockDetach(agent);
      const frozenTab = await agent.detach(agent.activeTab);
      const link = await frozenTab.document.querySelector('#link1');
      expect(link).toBe(null);

      await expect(
        frozenTab.document.querySelector('#loop').firstElementChild.innerHTML,
      ).rejects.toThrow();
      const parent = await frozenTab.document.querySelectorAll('.child');
      for (const child of parent) {
        expect(child).not.toBeTruthy();
      }
      await agent.close();
    }
  });

  it('will wait for flushes to complete', async () => {
    koaServer.get('/detach-flush', ctx => {
      ctx.body = `
        <body>
          <a id="link1" href="#page1">Click Me</a>
        </body>
      `;
    });
    const connection = new ConnectionToLocalCore();
    await connection.connect();
    const sendRequest = connection.sendRequest.bind(connection);
    const sendRequestSpy = jest.spyOn(connection, 'sendRequest');
    coreSessionDetachSpy.mockClear();

    {
      const hero = await new Hero({ connectionToCore: connection });
      Helpers.needsClosing.push(hero);
      await hero.goto(`${koaServer.baseUrl}/detach-flush`);
      await hero.waitForPaintingStable();

      await mockDetach(hero, 'detach-flush');
      const frozenTab = await hero.detach(hero.activeTab);
      const link = await frozenTab.document.querySelector('#link1');
      await link.getAttribute('id');
      await link.getAttribute('class');
      await link.dataset;
      const links = await frozenTab.document.querySelectorAll('a').length;
      expect(links).toBe(1);

      const outgoingCommands = sendRequestSpy.mock.calls;
      expect(outgoingCommands.map(c => c[0].command)).toMatchObject([
        'Core.createSession',
        'Tab.goto',
        'FrameEnvironment.waitForLoad',
        'Session.detachTab',
        'FrameEnvironment.execJsPath',
        'FrameEnvironment.execJsPath',
        'FrameEnvironment.execJsPath',
        'FrameEnvironment.execJsPath',
        'FrameEnvironment.execJsPath',
      ]);
      await hero.close();
    }
    {
      const flushPromise = new Resolvable<void>();
      sendRequestSpy.mockClear();
      sendRequestSpy.mockImplementation(async request => {
        if (request.command === 'Session.flush' && !flushPromise.isResolved) {
          flushPromise.resolve();
          await new Promise(setImmediate);
        }
        return sendRequest(request);
      });

      const hero = await new Hero({ connectionToCore: connection });
      Helpers.needsClosing.push(hero);

      const connectionToClient = Core.connections[Core.connections.length - 1];
      // @ts-ignore
      const recordCommands = connectionToClient.recordCommands;
      const recordCommandsSpy = jest.spyOn<any, any>(connectionToClient, 'recordCommands');
      const waitForClose = new Resolvable<void>();
      recordCommandsSpy.mockImplementation(async (...args) => {
        if (!waitForClose.isResolved && (args[2] as any).length > 10) {
          await waitForClose.promise;
        }

        return recordCommands.call(connectionToClient, ...args);
      });

      await hero.goto(`${koaServer.baseUrl}/detach-flush`);
      await hero.waitForPaintingStable();
      await mockDetach(hero, 'detach-flush');
      const frozenTab = await hero.detach(hero.activeTab);
      const link = await frozenTab.document.querySelector('#link1');
      await link.getAttribute('id');
      await link.getAttribute('class');
      await link.dataset;

      const frameSpy = jest.spyOn(FrameEnvironment.prototype, 'recordDetachedJsPath');

      const coreFrame = await frozenTab.mainFrameEnvironment[InternalPropertiesSymbol]
        .coreFramePromise;
      for (let i = 0; i < 1001; i += 1) {
        coreFrame.recordDetachedJsPath(1, new Date(), new Date());
      }
      await flushPromise;
      const links = await frozenTab.document.querySelectorAll('a').length;
      expect(links).toBe(1);

      await Promise.all([hero.close(), waitForClose.resolve()]);
      const outgoingCommands = sendRequestSpy.mock.calls;
      expect(outgoingCommands.map(c => c[0].command)).toMatchObject([
        'Core.createSession',
        'Tab.goto',
        'FrameEnvironment.waitForLoad',
        'Session.detachTab',
        'Session.flush',
        'Session.flush',
        'Session.close',
      ]);

      expect(frameSpy).toHaveBeenCalledTimes(1006);
    }
  });
});

async function openBrowser(path: string) {
  const hero = new Hero();
  Helpers.needsClosing.push(hero);
  await hero.goto(`${koaServer.baseUrl}${path}`);
  await hero.waitForPaintingStable();
  return hero;
}

async function mockDetach(hero: Partial<Hero>, callsitePath = 'path1') {
  coreSessionDetachSpy.mockImplementationOnce(function (tab, _: string, key?: string) {
    return this.detachTab(tab, callsitePath, key);
  });
}
