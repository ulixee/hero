import SecretAgent from '../index';
import { Helpers } from '@secret-agent/testing';
import Core from '../../core';

let koaServer;
beforeAll(async () => {
  await SecretAgent.start();
  koaServer = await Helpers.runKoaServer();
});

describe('basic Document tests', () => {
  it('runs goto', async () => {
    const exampleUrl = `${koaServer.baseUrl}/`;
    const browser = await SecretAgent.createBrowser();

    await browser.goto(exampleUrl);
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
    const browser = await SecretAgent.createBrowser();
    await browser.goto(`${koaServer.baseUrl}/page`);
    await browser.waitForAllContentLoaded();
    const links = await browser.document.querySelectorAll('a');

    for (const link of links) {
      await browser.interact({ click: link, waitForElementVisible: link });
      await browser.waitForLocation('change');
    }
    const finalUrl = await browser.url;
    expect(finalUrl).toBe(`${koaServer.baseUrl}/page#page3`);

    await browser.close();
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
    const browser = await SecretAgent.createBrowser();
    await browser.goto(`${koaServer.baseUrl}/refresh`);
    await browser.waitForAllContentLoaded();
    const links = browser.document.querySelectorAll('a');
    const links1 = await links;
    expect([...links1]).toHaveLength(1);
    expect([...(await links1.values())]).toHaveLength(1);
    await browser.click([...(await links1.values())][0]);

    expect([...(await links)]).toHaveLength(2);
    expect([...(await links1)]).toHaveLength(1);
    expect([...(await links1.values())]).toHaveLength(1);
    await browser.close();
  });

  it('must call await on a nodelist to re-iterate', async () => {
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
    const browser = await SecretAgent.createBrowser();
    await browser.goto(`${koaServer.baseUrl}/reiterate`);
    await browser.waitForAllContentLoaded();
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
      expect(String(error)).toMatch(/Please add an await/);
    }

    await browser.close();
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
    const browser = await SecretAgent.createBrowser();
    await browser.goto(`${koaServer.baseUrl}/refresh-element`);
    await browser.waitForAllContentLoaded();
    const lastChild = await browser.document.body.firstElementChild;
    expect(await lastChild.getAttribute('id')).toBe('first');
    await browser.click(lastChild);

    const refreshedChild = await lastChild;
    expect(await refreshedChild.getAttribute('id')).toBe('first');

    const updatedChild = await browser.document.body.firstElementChild;
    expect(await updatedChild.getAttribute('id')).toBe('number2');
    await browser.close();
  });
});

afterAll(async () => {
  await SecretAgent.shutdown();
  await Helpers.closeAll();
});
