import { Helpers } from '@secret-agent/testing';
import { XPathResult } from '@secret-agent/core-interfaces/AwaitedDom';
import SecretAgent from '../index';

let koaServer;
beforeAll(async () => {
  await SecretAgent.start();
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic Document tests', () => {
  it('runs goto', async () => {
    const browser = await openBrowser('/');
    const url = await browser.document.location.host;
    const html = await browser.document.body.outerHTML;
    const linkText = await browser.document.querySelector('a').textContent;
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
    const browser = await openBrowser(`/page`);
    const links = await browser.document.querySelectorAll('a');

    for (const link of links) {
      await browser.interact({ click: link, waitForElementVisible: link });
      await browser.waitForLocation('change');
    }
    const finalUrl = await browser.url;
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
    const browser = await openBrowser(`/refresh`);
    const links = browser.document.querySelectorAll('a');
    const links1 = await links;
    expect([...links1]).toHaveLength(1);
    expect([...(await links1.values())]).toHaveLength(1);
    await browser.click([...(await links1.values())][0]);

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
    const browser = await openBrowser(`/reiterate`);
    const ul = await browser.document.querySelector('ul');
    const lis = await ul.getElementsByTagName('li');
    expect(Array.from(lis)).toHaveLength(3);

    const link = await browser.document.querySelector('a');
    await browser.click(link);
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
    const browser = await openBrowser('/refresh-element');
    await browser.waitForAllContentLoaded();
    const lastChild = await browser.document.body.firstElementChild;
    expect(await lastChild.getAttribute('id')).toBe('first');
    await browser.click(lastChild);

    const refreshedChild = await lastChild;
    expect(await refreshedChild.getAttribute('id')).toBe('first');

    const updatedChild = await browser.document.body.firstElementChild;
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
    const browser = await openBrowser(`/index`);

    const element2Text = await browser.document.querySelectorAll('li')[1].textContent;
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
    const browser = await openBrowser(`/xpath`);

    const headings = await browser.document.evaluate(
      '/html/body//h2',
      browser.document,
      null,
      XPathResult.ANY_TYPE,
      null,
    );
    const nextHeading = headings.iterateNext();
    expect(await nextHeading.textContent).toBe('Here I am');
    const heading2 = headings.iterateNext();
    expect(await heading2.textContent).toBe('Also me');
  });
});

async function openBrowser(path: string) {
  const browser = await SecretAgent.createBrowser();
  Helpers.needsClosing.push(browser);
  await browser.goto(`${koaServer.baseUrl}${path}`);
  await browser.waitForAllContentLoaded();
  return browser;
}
