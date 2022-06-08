import { Hero, Helpers } from '@ulixee/hero-testing';
import { ITestKoaServer } from '@ulixee/hero-testing/helpers';
import { Session } from '@ulixee/hero-core';

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
    'flow',
    assert => {
      assert(hero.querySelector('.ready').$isVisible, false);
    },
    async error => {
      spy();
      expect(error).not.toBeTruthy();
      await hero.querySelector('.make-ready').$click();
    },
  );

  expect(spy).not.toHaveBeenCalled();
  expect(await hero.querySelector('.ready').textContent).toBe('You got me ready!');
  expect(spy).toHaveBeenCalledTimes(1);

  const session = Session.get(await hero.sessionId);
  const commands = session.commands.history;
  expect(commands.filter(x => x.activeFlowHandlerId !== undefined)).toHaveLength(3);
});

test('can handle multiple simultaneous handlers', async () => {
  koaServer.get('/simulflow', ctx => {
    ctx.body = `<body><h1>Hi</h1><div id="test" style="display: none"></div></body>`;
  });
  const hero = await openBrowser('/simulflow');

  await hero.registerFlowHandler(
    'flow',
    assert => assert(hero.querySelector('#test').$isVisible),
    () => Promise.resolve(),
  );
  await hero.registerFlowHandler(
    'flow2',
    assert => assert(hero.url, 'https://test.com'),
    () => Promise.resolve(),
  );
  await hero.registerFlowHandler(
    'flow3',
    assert => {
      assert(hero.querySelector('h3'));
      assert(hero.url, 'https://test2.com');
    },
    () => Promise.resolve(),
  );
  await hero.registerFlowHandler(
    'flow',
    assert => assert(hero.findResource({ httpRequest: { statusCode: 403 } })),
    () => Promise.resolve(),
  );

  await expect(hero.activeTab.triggerFlowHandlers()).resolves.toBe(undefined);
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
    'flow',
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
  await expect(hero.querySelector('.ready').textContent).rejects.toThrow('Element does not exist');
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
    'flow',
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
    'flow',
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

describe('flow commands', () => {
  beforeAll(() => {
    koaServer.get('/flowCommand', ctx => {
      ctx.body = `
<head>
  <style>
    form input { 
      display: none; 
    }
    form.ready input { 
      display:block 
    }
  </style>
</head>
<body>
  <h1>Flow Command Form</h1>
  <form>
    <input type="text" value="" id="text-field" name="field"/>
  </form>
  <a href="javascript:void(0);" onclick="clicker()" class="make-ready">Click me to start</a>
  <script type="text/javascript">
    function clicker() {
      const form = document.querySelector('form');
      form.setAttribute('class', 'ready');
      document.querySelector('h1').textContent = 'After Flow Handler'
    }
  </script>
</body>`;
    });
  });

  it('can restart a flow command block', async () => {
    const hero = await openBrowser('/flowCommand');

    const flowHandlerSpy = jest.fn();
    await hero.registerFlowHandler(
      'FormInvisible',
      assert => {
        assert(hero.querySelector('.ready').$isVisible, false);
      },
      async error => {
        flowHandlerSpy();
        expect(error).not.toBeTruthy();
        await hero.querySelector('.make-ready').$click();
        await hero.querySelector('.ready').$waitForVisible();
      },
    );

    const flowCommandSpy = jest.fn();
    await hero.flowCommand(async () => {
      flowCommandSpy();
      const field = await hero.querySelector('#text-field');
      await field.$click();
      await field.$clearInputText();
      const text = await hero.querySelector('h1').textContent;
      await field.$type(text);
    });

    expect(flowHandlerSpy).toHaveBeenCalledTimes(1);
    expect(flowCommandSpy).toHaveBeenCalledTimes(2);

    await expect(hero.querySelector('#text-field').value).resolves.toBe('After Flow Handler');

    const session = Session.get(await hero.sessionId);
    const commands = session.commands.history;
    expect(commands.filter(x => x.flowCommandId === 1 && x.retryNumber === 1)).toHaveLength(6); // type is 2
  });

  it('can restart a flow command block with waitForVisible', async () => {
    const hero = await openBrowser('/flowCommand');

    const flowHandlerSpy = jest.fn();
    await hero.registerFlowHandler(
      'FormInvisible',
      assert => {
        assert(hero.querySelector('.ready').$isVisible, false);
      },
      async error => {
        flowHandlerSpy();
        expect(error).not.toBeTruthy();
        await hero.querySelector('.make-ready').$click();
        await hero.querySelector('.ready').$waitForVisible();
      },
    );

    const flowCommandSpy = jest.fn();
    await hero.flowCommand(async () => {
      flowCommandSpy();
      const field = await hero.querySelector('#text-field').$waitForVisible({ timeoutMs: 500 });
      const text = await hero.querySelector('h1').textContent;
      await field.$type(text);
    });

    await expect(hero.querySelector('#text-field').value).resolves.toBe('After Flow Handler');

    expect(flowHandlerSpy).toHaveBeenCalledTimes(1);
    expect(flowCommandSpy).toHaveBeenCalledTimes(2);

    const session = Session.get(await hero.sessionId);
    const commands = session.commands.history;
    expect(commands.filter(x => x.flowCommandId === 1 && x.retryNumber === 1)).toHaveLength(6); // type is 2 (focus/interact), waitForVisible is 3 (add/remove/return node pointer)
  });

  it('can run until an exit clause is satisfied', async () => {
    koaServer.get('/flowExit', ctx => {
      ctx.body = `
<body>
  <form>
    <input type="text" value="" id="text" name="field" onkeyup="keyup()"/>
  </form>
  <script type="text/javascript">
  let counter = 0;
    function keyup() {
      const field = document.querySelector('#text');
      if (field.value === 'tes' && counter === 0) {
        field.blur();
        counter +=1;
      }
    }
  </script>
</body>`;
    });

    const hero = await openBrowser('/flowExit');
    await hero.registerFlowHandler(
      'Refocus',
      assert => {
        assert(hero.querySelector('#text').$hasFocus, false);
      },
      async () => {
        await hero.querySelector('#text').focus();
        await hero.querySelector('#text').$clearInputText();
      },
    );

    const flowCommandSpy = jest.fn();
    await hero.flowCommand(
      async () => {
        flowCommandSpy();
        const field = await hero.querySelector('#text').$waitForVisible({ timeoutMs: 500 });
        await field.$type('test');
      },
      {
        maxRetries: 2,
        exitState(assert) {
          assert(hero.querySelector('#text').value, 'test');
        },
      },
    );

    expect(flowCommandSpy).toHaveBeenCalledTimes(2);

    await expect(hero.querySelector('#text').value).resolves.toBe('test');
  });

  it('can handle nested command blocks', async () => {
    koaServer.get('/flowForm', ctx => {
      ctx.body = `
<body>
  <div id="dialog" style="display: none; position: fixed;width:100%;height: 100%">
    <h1>Cookies!!!</h1>
    <button class="close" onclick="closeCookiePrompt()">X</button>
  </div>
  <form>
    <input type="text" value="" id="field1" name="field1" />
    <input type="text" value="" id="field2" name="field2" onkeypress="showCookiePrompt()" />
  </form>
  <script type="text/javascript">
  
  const dialog = document.querySelector('#dialog');
  let hasTriggered = false;
  function showCookiePrompt() {
    if (!document.querySelector('#field2').value) return;
    if (hasTriggered) return;
    hasTriggered = true;
    document.forms[0].reset();
    dialog.style.display = 'block'
  }
  function closeCookiePrompt() {
    dialog.style.display = 'none'
  }
  </script>
</body>`;
    });

    const hero = await openBrowser('/flowForm');

    await hero.registerFlowHandler(
      'CookiePrompt',
      assert => {
        assert(hero.querySelector('#dialog').$isClickable, true);
      },
      async () => {
        await hero.querySelector('#dialog .close').$click();
      },
    );

    const outerFlowCommandSpy = jest.fn();
    const flow1CommandSpy = jest.fn();
    const flow2CommandSpy = jest.fn();
    await hero.flowCommand(
      async () => {
        outerFlowCommandSpy();
        const field1 = await hero.querySelector('#field1');
        const field2 = await hero.querySelector('#field2');

        await hero.flowCommand(
          async () => {
            flow1CommandSpy();
            await field1.$click();
            await field1.$clearInputText();
            await field1.$type('value1');
          },
          assert => assert(field1.value, 'value1'),
        );

        await hero.flowCommand(
          async () => {
            flow2CommandSpy();
            await field2.$click();
            await field2.$clearInputText();
            await field2.$type('value2');
          },
          assert => assert(field2.value, 'value2'),
        );
      },
      assert => {
        assert(hero.querySelector('#field1').value, 'value1');
        assert(hero.querySelector('#field2').value, 'value2');
      },
    );
    /**
     * Should have flow as follows:
     * 1. Type value 1 in field 1
     * 2. Type value 2 in field 2. On focus, a cookie prompt comes up and the form clears
     * 3. Field 2 should re-run
     * 4. Should retry the whole block
     * 5. Field 1 should populate again
     * 6. Field 2 should already be good and should not run
     */

    expect(outerFlowCommandSpy).toHaveBeenCalledTimes(2);
    expect(flow1CommandSpy).toHaveBeenCalledTimes(2);
    // 2 times on first run
    expect(flow2CommandSpy).toHaveBeenCalledTimes(2);
  });
});

async function openBrowser(path: string) {
  const hero = new Hero();
  Helpers.needsClosing.push(hero);
  await hero.goto(`${koaServer.baseUrl}${path}`);
  await hero.waitForPaintingStable();
  return hero;
}
