import { Helpers } from '@ulixee/hero-testing';
import { ITestKoaServer } from '@ulixee/hero-testing/helpers';
import Hero from '../index';
import { Session } from '@ulixee/hero-core/index';

let koaServer: ITestKoaServer;
beforeAll(async () => {
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

test('will trigger a flow handler when an error occurs', async () => {
  koaServer.get('/flowHandler', ctx => {
    ctx.body = `<body>
  <h1>Nothing here yet</h1>
  <a href="javascript:void(0);" onclick="clicker()" class="make-ready">Click me to start</a>
  <script type="text/javascript">
    function clicker() {
      const div = document.createElement('div');
      div.textContent = 'You got me ready!';
      div.setAttribute('class', 'ready');
      document.body.appendChild(div);
    }
</script>
</body>`;
  });

  const hero = await openBrowser('/flowHandler');

  const spy = jest.fn();

  await hero.registerFlowHandler(
    assert => {
      assert(hero.querySelector('.ready').$isVisible, false);
    },
    async error => {
      spy();
      expect(error).not.toBeTruthy();
      await hero.querySelector('.make-ready').$click();
    }
  );

  expect(spy).not.toHaveBeenCalled();
  expect(await hero.querySelector('.ready').textContent).toBe('You got me ready!');
  expect(spy).toHaveBeenCalledTimes(1);

  const session = Session.get(await hero.sessionId);
  const commands = session.commands.history;
  expect(commands.filter(x => x.activeFlowHandlerId !== undefined)).toHaveLength(1);
});

test('bubbles up handler errors to the line of code that triggers the handlers', async () => {
  koaServer.get('/flow-errors', ctx => {
    ctx.body = `<body>
  <h1>Nothing here yet</h1>
</body>`;
  });

  const hero = await openBrowser('/flow-errors');

  const spy = jest.fn();

  await hero.registerFlowHandler(
    {
      all(assert) {
        assert(hero.querySelector('.ready').$isVisible, false);
      },
    },
    async error => {
      spy();
      expect(error).not.toBeTruthy();
      await hero.querySelector('.make-ready').$click();
    },
  );

  expect(spy).not.toHaveBeenCalled();
  // will bubble up the interaction error here
  await expect(hero.querySelector('.ready').textContent).rejects.toThrow('element does not exist');
  expect(spy).toHaveBeenCalledTimes(1);
});

test('checks multiple handlers', async () => {
  koaServer.get('/flow-multi', ctx => {
    ctx.body = `<body>

  <a href="javascript:void(0);" onclick="clicker()" class="make-visible">Click me div visible</a>
<div class="content" style="position: relative">
  <h1>Nothing here yet</h1>
  <div class="wanted" style="display:none" onclick="didClick = true">Ready in 2</div>
  <div class="popup" onclick="clickPopup()" style="position: absolute; top: 0; left:0; width: 500px;height:500px">Over the content</div>
</div>
  <script type="text/javascript">
    function clicker() {
      document.querySelector('.wanted').setAttribute('style','')
    }
    function clickPopup() {
      document.querySelector('.popup').remove();
    }
    let didClick =false;
</script>
</body>`;
  });

  const hero = await openBrowser('/flow-multi');

  const popupSpy = jest.fn();

  await hero.registerFlowHandler(
    {
      all(assert) {
        assert(hero.querySelector('.popup').$isVisible);
      },
    },
    async () => {
      popupSpy();
      await hero.querySelector('.popup').$click();
    },
  );

  const linkSpy = jest.fn();
  await hero.registerFlowHandler(
    {
      all(assert) {
        assert(hero.querySelector('.wanted').$isVisible, false);
      },
    },
    async () => {
      linkSpy();
      await hero.querySelector('.make-visible').$click();
    },
  );

  expect(linkSpy).not.toHaveBeenCalled();
  expect(popupSpy).not.toHaveBeenCalled();
  await expect(hero.querySelector('.wanted').$click()).resolves.toBeUndefined();
  expect(linkSpy).toHaveBeenCalledTimes(1);
  expect(popupSpy).toHaveBeenCalledTimes(1);
  await expect(hero.getJsValue('didClick')).resolves.toBe(true);
});

async function openBrowser(path: string) {
  const hero = new Hero();
  Helpers.needsClosing.push(hero);
  await hero.goto(`${koaServer.baseUrl}${path}`);
  await hero.waitForPaintingStable();
  return hero;
}
