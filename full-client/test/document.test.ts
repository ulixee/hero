import { Helpers } from '@secret-agent/testing';
import { XPathResult } from '@secret-agent/core-interfaces/AwaitedDom';
import { ITestKoaServer } from '@secret-agent/testing/helpers';
import { Handler } from '../index';

let koaServer: ITestKoaServer;
let handler: Handler;
beforeAll(async () => {
  handler = new Handler();
  Helpers.onClose(() => handler.close(), true);
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic Document tests', () => {
  it('runs goto', async () => {
    const agent = await openBrowser('/');
    const url = await agent.document.location.host;
    const html = await agent.document.body.outerHTML;
    const linkText = await agent.document.querySelector('a').textContent;
    expect(html).toMatch('Example Domain');
    expect(linkText).toBe('More information...');
    expect(url).toBe(koaServer.baseHost);
  });

  it('can iterate over multiple querySelectorElements', async () => {
    koaServer.get('/page', ctx => {
      ctx.body = `
        <body>
          <a href="#page1">Click Me</a>
          <a href="#page2">Click Me</a>
          <a href="#page3">Click Me</a>
        </body>
      `;
    });
    const agent = await openBrowser(`/page`);
    const links = await agent.document.querySelectorAll('a');

    for (const link of links) {
      await agent.interact({ click: link, waitForElementVisible: link });
      await agent.waitForLocation('change');
    }
    const finalUrl = await agent.url;
    expect(finalUrl).toBe(`${koaServer.baseUrl}/page#page3`);
  });

  it('can refresh an element list', async () => {
    koaServer.get('/refresh', ctx => {
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
    const agent = await openBrowser(`/refresh`);
    const links = agent.document.querySelectorAll('a');
    const links1 = await links;
    expect([...links1]).toHaveLength(1);
    expect([...(await links1.values())]).toHaveLength(1);
    await agent.click([...(await links1.values())][0]);

    expect([...(await links)]).toHaveLength(2);
    expect([...(await links1)]).toHaveLength(1);
    expect([...(await links1.values())]).toHaveLength(1);
  });

  it('must call await on a NodeList to re-iterate', async () => {
    koaServer.get('/reiterate', ctx => {
      ctx.body = `
        <body>
          <ul>
            <li>1</li>
            <li>2</li>
            <li>3</li>
          </ul>
          <a href="javascript:void(0)" onclick="clicker()">link</a>
          <script>
            function clicker() {
              document.querySelector('ul').append('<li>4</li>');
            }
          </script>
        </body>
      `;
    });
    const agent = await openBrowser(`/reiterate`);
    const ul = await agent.document.querySelector('ul');
    const lis = await ul.getElementsByTagName('li');
    expect(Array.from(lis)).toHaveLength(3);

    const link = await agent.document.querySelector('a');
    await agent.click(link);
    try {
      // should throw
      for (const child of lis) {
        expect(child).not.toBeTruthy();
      }
    } catch (error) {
      // eslint-disable-next-line jest/no-try-expect
      expect(String(error)).toMatch(/Please add an await/);
    }
  });

  it('can re-await an element to refresh the underlying attached nodeids', async () => {
    koaServer.get('/refresh-element', ctx => {
      ctx.body = `
        <body>
          <a id="first" href="javascript:void(0);" onclick="clicker()">Click Me</a>

          <script>
          function clicker() {
            const elem = document.createElement('A');
            elem.setAttribute('id', 'number2');
            document.body.prepend(elem)
          }
          </script>
        </body>
      `;
    });
    const agent = await openBrowser('/refresh-element');
    await agent.waitForAllContentLoaded();
    const lastChild = await agent.document.body.firstElementChild;
    expect(await lastChild.getAttribute('id')).toBe('first');
    await agent.click(lastChild);

    const refreshedChild = await lastChild;
    expect(await refreshedChild.getAttribute('id')).toBe('first');

    const updatedChild = await agent.document.body.firstElementChild;
    expect(await updatedChild.getAttribute('id')).toBe('number2');
  });

  it('should be able to access a NodeList by index', async () => {
    koaServer.get('/index', ctx => {
      ctx.body = `
        <body>
          <ul>
            <li>1</li>
            <li>2</li>
            <li>3</li>
          </ul>
        </body>
      `;
    });
    const agent = await openBrowser(`/index`);

    const element2Text = await agent.document.querySelectorAll('li')[1].textContent;
    expect(element2Text).toBe('2');
  });

  it('can execute xpath', async () => {
    koaServer.get('/xpath', ctx => {
      ctx.body = `
        <body>
          <h2>Here I am</h2>
          <ul>
            <li>1</li>
            <li>2</li>
            <li>3</li>
          </ul>
          <h2>Also me</h2>
        </body>
      `;
    });
    const agent = await openBrowser(`/xpath`);

    const headings = await agent.document.evaluate(
      '/html/body//h2',
      agent.document,
      null,
      XPathResult.ANY_TYPE,
      null,
    );
    const nextHeading = headings.iterateNext();
    expect(await nextHeading.textContent).toBe('Here I am');
    const heading2 = headings.iterateNext();
    expect(await heading2.textContent).toBe('Also me');
  });

  it('can determine if an element is visible', async () => {
    koaServer.get('/isVisible', ctx => {
      ctx.body = `
        <body>
          <div id="elem-1">Element 1</div>
          <div style="visibility: hidden">
            <div id="elem-2">Visibility none</div>
          </div>
          <div style="visibility: visible">
            <div id="elem-3">Visibility visible</div>
          </div>
          <div style="display:none" id="elem-4">No display</div>
          <div style="opacity: 0" id="elem-5">Opacity 0</div>
          <div style="opacity: 0.1" id="elem-6">Opacity 0.1</div>
          <div style="position: relative; width: 100px">
            <div id="elem-7" style="position: absolute; left: 0; width: 20px; top; 0; height:20px;">Showing Element</div>
            <div id="elem-8" style="position: absolute; left: 20px; width: 20px; top; 0; height:20px;">Showing Element</div>
            <div style="position: absolute; left: 21px; width: 10px; top; 0; height:20px;">Overlay Element</div>
          </div>
        </body>
      `;
    });
    const agent = await openBrowser(`/isVisible`);
    const { document } = agent;
    await expect(agent.isElementVisible(document.querySelector('#elem-1'))).resolves.toBe(true);
    // visibility
    await expect(agent.isElementVisible(document.querySelector('#elem-2'))).resolves.toBe(false);
    await expect(agent.isElementVisible(document.querySelector('#elem-3'))).resolves.toBe(true);
    // layout
    await expect(agent.isElementVisible(document.querySelector('#elem-4'))).resolves.toBe(false);
    // opacity
    await expect(agent.isElementVisible(document.querySelector('#elem-5'))).resolves.toBe(false);
    await expect(agent.isElementVisible(document.querySelector('#elem-6'))).resolves.toBe(true);
    // overlay
    await expect(agent.isElementVisible(document.querySelector('#elem-7'))).resolves.toBe(true);
    await expect(agent.isElementVisible(document.querySelector('#elem-8'))).resolves.toBe(false);
  });

  it('can get computed styles', async () => {
    koaServer.get('/computedStyle', ctx => {
      ctx.body = `<body>
          <div style="opacity: 0" id="elem-1">Opacity 0</div>
          <div style="opacity: 0.1" id="elem-2">Opacity 0.1</div>
        </body>`;
    });
    const agent = await openBrowser(`/computedStyle`);
    const { document } = agent;
    const elem1Style = agent.activeTab.getComputedStyle(document.querySelector('#elem-1'));
    const opacity = await elem1Style.getPropertyValue('opacity');
    expect(opacity).toBe('0');

    const elem2Style = agent.activeTab.getComputedStyle(document.querySelector('#elem-2'));
    const opacity2 = await elem2Style.getPropertyValue('opacity');
    expect(opacity2).toBe('0.1');
  });

  it('can get a data url of a canvas', async () => {
    koaServer.get('/canvas', ctx => {
      ctx.body = `
        <body>
          <canvas id="canvas"></canvas>
          <script>
            const c = document.getElementById("canvas");
            const ctx = c.getContext("2d");
            ctx.moveTo(0, 0);
            ctx.lineTo(200, 100);
            ctx.stroke();
          </script>
        </body>
      `;
    });
    const agent = await openBrowser(`/canvas`);
    const { document } = agent;
    const dataUrl = await document.querySelector('canvas').toDataURL();
    expect(dataUrl).toMatch(/data:image\/png.+/);
  });

  it('allows you to run shadow dom query selectors', async () => {
    koaServer.get('/shadow', ctx => {
      ctx.body = `
        <body>
          <header id="header"></header>
          <script>
            const header = document.getElementById('header');
            const shadowRoot = header.attachShadow({ mode: 'closed' });
            shadowRoot.innerHTML = \`<div>
             <h1>Hello Shadow DOM</h1>
             <ul>
              <li>1</li>
              <li>2</li>
              <li>3</li>
             </ul>
            </div>\`;
          </script>
        </body>
      `;
    });
    const agent = await openBrowser(`/shadow`);
    const { document } = agent;
    const shadowRoot = document.querySelector('#header').shadowRoot;
    const h1Text = await shadowRoot.querySelector('h1').textContent;
    expect(h1Text).toBe('Hello Shadow DOM');

    const lis = await shadowRoot.querySelectorAll('li').length;
    expect(lis).toBe(3);
  });
});

async function openBrowser(path: string) {
  const agent = await handler.createAgent();
  Helpers.needsClosing.push(agent);
  await agent.goto(`${koaServer.baseUrl}${path}`);
  await agent.waitForAllContentLoaded();
  return agent;
}
