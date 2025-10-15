"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hero_testing_1 = require("@ulixee/hero-testing");
const AwaitedDom_1 = require("@ulixee/hero-interfaces/AwaitedDom");
const hero_1 = require("@ulixee/hero");
const HTMLIFrameElement_1 = require("@ulixee/awaited-dom/impl/official-klasses/HTMLIFrameElement");
const HTMLHeadingElement_1 = require("@ulixee/awaited-dom/impl/official-klasses/HTMLHeadingElement");
let koaServer;
beforeAll(async () => {
    koaServer = await hero_testing_1.Helpers.runKoaServer();
});
afterAll(hero_testing_1.Helpers.afterAll);
afterEach(hero_testing_1.Helpers.afterEach);
describe('basic Document tests', () => {
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
        const hero = await openBrowser(`/page`);
        const links = await hero.document.querySelectorAll('a');
        for (const link of links) {
            await hero.interact({ click: link });
            await hero.waitForLocation('change');
        }
        const finalUrl = await hero.url;
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
        const hero = await openBrowser(`/refresh`);
        const links = hero.document.querySelectorAll('a');
        const links1 = await links;
        expect([...links1]).toHaveLength(1);
        expect([...(await links1.values())]).toHaveLength(1);
        await hero.click([...(await links1.values())][0]);
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
        const hero = await openBrowser(`/reiterate`);
        const ul = await hero.document.querySelector('ul');
        const lis = await ul.getElementsByTagName('li');
        expect(Array.from(lis)).toHaveLength(3);
        const link = await hero.document.querySelector('a');
        await hero.click(link);
        try {
            // should throw
            for (const child of lis) {
                expect(child).not.toBeTruthy();
            }
        }
        catch (error) {
            expect(String(error)).toMatch(/Please add an await/);
        }
    });
    it('can re-await an element to refresh the underlying nodePointer ids', async () => {
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
        const hero = await openBrowser('/refresh-element');
        await hero.waitForPaintingStable();
        const lastChild = await hero.document.body.firstElementChild;
        expect(await lastChild.getAttribute('id')).toBe('first');
        await hero.click(lastChild);
        const refreshedChild = await lastChild;
        expect(await refreshedChild.getAttribute('id')).toBe('first');
        const updatedChild = await hero.document.body.firstElementChild;
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
        const hero = await openBrowser(`/index`);
        const element2Text = await hero.document.querySelectorAll('li')[1].textContent;
        expect(element2Text).toBe('2');
    });
    it("returns null for elements that don't exist", async () => {
        const hero = await openBrowser(`/`);
        const { document } = hero;
        const element = await document.querySelector('#this-element-aint-there');
        expect(element).toBe(null);
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
        const hero = await openBrowser(`/xpath`);
        const headings = await hero.document.evaluate('/html/body//h2', hero.document, null, AwaitedDom_1.XPathResult.ANY_TYPE, null);
        const nextHeading = headings.iterateNext();
        expect(await nextHeading.textContent).toBe('Here I am');
        const heading2 = headings.iterateNext();
        expect(await heading2.textContent).toBe('Also me');
    });
    it('can wait for xpath elements', async () => {
        koaServer.get('/xpath-wait', ctx => {
            ctx.body = `
        <body>
          <h2 style="display: none">Here I am not</h2>
          <h2>Also me</h2>
          <script>
          setTimeout(() => {
              const h2 = document.querySelector('h2');
              h2.style.display = '';
              h2.textContent = 'Here I am'
          }, 500)
</script>
        </body>
      `;
        });
        const hero = await openBrowser(`/xpath-wait`);
        const headings = hero.document.evaluate('/html/body//h2', hero.document, null, AwaitedDom_1.XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const result = await hero.waitForElement(headings.singleNodeValue, { waitForVisible: true });
        expect(result).toBeInstanceOf(HTMLHeadingElement_1.default);
        await expect(headings.singleNodeValue.textContent).resolves.toBe('Here I am');
    });
    it("returns null for xpath elements that don't exist", async () => {
        const hero = await openBrowser(`/`);
        const { document } = hero;
        const element = await document.evaluate('//div[@id="this-element-aint-there"]', document, null, AwaitedDom_1.XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        expect(element).toBe(null);
    });
    it('returns null while iterating nodes', async () => {
        koaServer.get('/xpath-nodes', ctx => {
            ctx.body = `
        <body>
          <div id="div1">Div 1</div>
          <div id="div2">Div 2</div>
          <div id="div3">Div 3</div>
        </body>
      `;
        });
        const hero = await openBrowser(`/xpath-nodes`);
        const { document } = hero;
        const iterator = await document.evaluate('//div', document, null, AwaitedDom_1.XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        await expect(iterator.iterateNext()).resolves.toBeTruthy();
        await expect(iterator.iterateNext()).resolves.toBeTruthy();
        await expect(iterator.iterateNext()).resolves.toBeTruthy();
        await expect(iterator.iterateNext()).resolves.toBe(null);
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
        const hero = await openBrowser(`/isVisible`);
        const { document } = hero;
        await expect(hero.getComputedVisibility(document.querySelector('#elem-1'))).resolves.toMatchObject({
            isVisible: true,
        });
        // visibility
        await expect(hero.getComputedVisibility(document.querySelector('#elem-2'))).resolves.toMatchObject({
            isVisible: false,
            hasCssVisibility: false,
        });
        await expect(hero.getComputedVisibility(document.querySelector('#elem-3'))).resolves.toMatchObject({
            isVisible: true,
        });
        // layout
        await expect(hero.getComputedVisibility(document.querySelector('#elem-4'))).resolves.toMatchObject({
            isVisible: false,
            hasDimensions: false,
        });
        // opacity
        await expect(hero.getComputedVisibility(document.querySelector('#elem-5'))).resolves.toMatchObject({
            isVisible: false,
            hasCssOpacity: false,
        });
        await expect(hero.getComputedVisibility(document.querySelector('#elem-6'))).resolves.toMatchObject({
            isVisible: true,
        });
        // overlay
        await expect(hero.getComputedVisibility(document.querySelector('#elem-7'))).resolves.toMatchObject({
            isVisible: true,
            isUnobstructedByOtherElements: true,
        });
        await expect(hero.getComputedVisibility(document.querySelector('#elem-8'))).resolves.toMatchObject({
            isVisible: true,
            isClickable: false,
            isUnobstructedByOtherElements: false,
        });
    });
    it('can get computed styles', async () => {
        koaServer.get('/computedStyle', ctx => {
            ctx.body = `<body>
          <div style="opacity: 0" id="elem-1">Opacity 0</div>
          <div style="opacity: 0.1" id="elem-2">Opacity 0.1</div>
        </body>`;
        });
        const hero = await openBrowser(`/computedStyle`);
        const { document } = hero;
        const elem1Style = hero.activeTab.getComputedStyle(document.querySelector('#elem-1'));
        const opacity = await elem1Style.getPropertyValue('opacity');
        expect(opacity).toBe('0');
        const elem2Style = hero.activeTab.getComputedStyle(document.querySelector('#elem-2'));
        const opacity2 = await elem2Style.getPropertyValue('opacity');
        expect(opacity2).toBe('0.1');
    });
    it('can get a data url of a canvas', async () => {
        koaServer.get('/canvas', ctx => {
            ctx.body = `
        <body>
          <label>This is a canvas</label>
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
        const hero = await openBrowser(`/canvas`);
        const { document } = hero;
        const dataUrl = await document.querySelector('canvas').toDataURL();
        expect(dataUrl).toMatch(/data:image\/png.+/);
    });
    it('can dismiss dialogs', async () => {
        koaServer.get('/dialog', ctx => {
            ctx.body = `
        <body>
          <h1>Dialog page</h1>
          <script type="text/javascript">
           setTimeout(() => confirm('Do you want to do this'), 500);
          </script>
        </body>
      `;
        });
        const hero = await openBrowser(`/dialog`);
        const { document } = hero;
        const dialogPromise = new Promise(resolve => hero.activeTab.on('dialog', resolve));
        await expect(dialogPromise).resolves.toBeTruthy();
        const dialog = await dialogPromise;
        await expect(dialog.dismiss(true)).resolves.toBe(undefined);
        // test that we don't hang here
        await expect(document.querySelector('h1').textContent).resolves.toBeTruthy();
    });
    it('can get a dataset attribute', async () => {
        koaServer.get('/dataset', ctx => {
            ctx.body = `
        <body>
          <div id="main" data-id="1" data-name="name">This is a div</div>
        </body>
      `;
        });
        const hero = await openBrowser(`/dataset`);
        const { document } = hero;
        const dataset = await document.querySelector('#main').dataset;
        expect(dataset).toEqual({ id: '1', name: 'name' });
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
        const hero = await openBrowser(`/shadow`);
        const { document } = hero;
        const shadowRoot = document.querySelector('#header').shadowRoot;
        const h1Text = await shadowRoot.querySelector('h1').textContent;
        expect(h1Text).toBe('Hello Shadow DOM');
        const lis = await shadowRoot.querySelectorAll('li').length;
        expect(lis).toBe(3);
    });
    it('allows selectors in iframes', async () => {
        koaServer.get('/iframePage', ctx => {
            ctx.body = `
        <body>
        <h1>Iframe Page</h1>
<iframe src="/subFrame"></iframe>
        </body>
      `;
        });
        koaServer.get('/subFrame', ctx => {
            ctx.body = `
        <body>
        <h1>Subframe Page</h1>
<div>This is content inside the frame</div>
        </body>
      `;
        });
        const hero = await openBrowser(`/iframePage`);
        const outerH1 = await hero.document.querySelector('h1').textContent;
        expect(outerH1).toBe('Iframe Page');
        let innerFrame;
        for (const frame of await hero.activeTab.frameEnvironments) {
            await frame.waitForLoad(hero_1.LocationStatus.DomContentLoaded);
            const url = await frame.url;
            if (url.endsWith('/subFrame')) {
                innerFrame = frame;
                break;
            }
        }
        const innerH1 = await innerFrame.document.querySelector('h1').textContent;
        expect(innerH1).toBe('Subframe Page');
        await hero.close();
    });
    it('can find the Frame object for an iframe', async () => {
        koaServer.get('/iframePage2', ctx => {
            ctx.body = `
        <body>
        <h1>Iframe Page</h1>
<iframe src="/subFrame1" name="frame1"></iframe>
<iframe src="/subFrame2" id="frame2"></iframe>
        </body>
      `;
        });
        koaServer.get('/subFrame1', ctx => {
            ctx.body = `<body><h1>Subframe Page 1</h1></body>`;
        });
        koaServer.get('/subFrame2', ctx => {
            ctx.body = `<body><h1>Subframe Page 2</h1>
<iframe src="/subFrame1" id="nested"></iframe>
</body>`;
        });
        const hero = await openBrowser(`/iframePage2`);
        const frameElement2 = hero.document.querySelector('#frame2');
        const result = await hero.waitForElement(frameElement2);
        expect(result).toBeTruthy();
        expect(result).toBeInstanceOf(HTMLIFrameElement_1.default);
        const frame2Env = await hero.activeTab.getFrameEnvironment(frameElement2);
        expect(frame2Env).toBeTruthy();
        await frame2Env.waitForLoad(hero_1.LocationStatus.AllContentLoaded);
        await expect(frame2Env.document.querySelector('h1').textContent).resolves.toBe('Subframe Page 2');
        const nestedFrameElement = frame2Env.document.querySelector('iframe');
        const nestedFrameEnv = await frame2Env.getFrameEnvironment(nestedFrameElement);
        expect(nestedFrameEnv).toBeTruthy();
        await nestedFrameEnv.waitForLoad(hero_1.LocationStatus.AllContentLoaded);
        await expect(nestedFrameEnv.document.body.innerHTML).resolves.toBe('<h1>Subframe Page 1</h1>');
        await hero.close();
    }, 130e3);
});
describe('tab.querySelector', () => {
    it('should be able to select single element', async () => {
        koaServer.get('/magic', ctx => {
            ctx.body = `
        <body>
         <div class="outer">
            <div class="inner">X</div>
          </div>
        </body>
      `;
        });
        const hero = await openBrowser(`/magic`);
        const innerDiv = hero.querySelector('.outer > .inner');
        await expect(innerDiv.innerText).resolves.toBe('X');
        await expect(innerDiv.getAttribute('class')).resolves.toBe('inner');
        await expect(hero.querySelector('.inner').textContent).resolves.toBe('X');
        await hero.close();
    });
    it('should be able to select many elements', async () => {
        koaServer.get('/magicall', ctx => {
            ctx.body = `
        <body>
         <div class="outer">
            <div class="inner">X</div>
            <div class="inner">Y</div>
          </div>
        </body>
      `;
        });
        const hero = await openBrowser(`/magicall`);
        await expect(hero.querySelectorAll('.inner').length).resolves.toBe(2);
        await expect(hero.querySelectorAll('.outer > div').length).resolves.toBe(2);
        await hero.close();
    });
});
async function openBrowser(path) {
    const hero = new hero_testing_1.Hero();
    hero_testing_1.Helpers.needsClosing.push(hero);
    await hero.goto(`${koaServer.baseUrl}${path}`);
    await hero.waitForPaintingStable();
    return hero;
}
//# sourceMappingURL=document.test.js.map