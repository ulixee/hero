import Core from '@secret-agent/core';
import { Helpers } from '@secret-agent/testing';
import { MouseEventType } from '../models/MouseEventsTable';
import { LocationStatus } from '@secret-agent/core-interfaces/Location';
import { InteractionCommand } from '@secret-agent/core-interfaces/IInteractions';

let koaServer;
beforeAll(async () => {
  await Core.start();
  koaServer = await Helpers.runKoaServer();
});

describe('basic Page Recorder tests', () => {
  it('detects added nodes', async () => {
    koaServer.get('/test1', ctx => {
      ctx.body = `<body>
<script>
    setTimeout(function() {
      const elem = document.createElement('A');
      elem.setAttribute('href', '/test2');
      document.body.append(elem)
    }, 100);
</script>
</body>`;
    });
    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];
    await core.goto(`${koaServer.baseUrl}/test1`);
    await core.waitForLoad('DomContentLoaded');

    // @ts-ignore
    const state = core.window.sessionState;

    const changesAfterLoad = await state.getPageDomChanges(state.pages.history, true);
    // @ts-ignore
    const commandId = core.window.lastCommandId;
    const [frameId] = Object.keys(changesAfterLoad);
    expect(changesAfterLoad[frameId]).toHaveLength(8);
    expect(changesAfterLoad[frameId][0][2].textContent).toBe(`${koaServer.baseUrl}/test1`);

    await core.waitForElement(['document', ['querySelector', 'a']]);

    await core.waitForMillis(100);

    const changes = await state.getPageDomChanges(state.pages.history, true, commandId);
    const [key] = Object.keys(changes);
    expect(changes[key]).toHaveLength(1);
    expect(changes[key][0][1]).toBe('added');
    expect(changes[key][0][2].tagName).toBe('A');
  });

  it('detects removed nodes', async () => {
    koaServer.get('/test2', ctx => {
      ctx.body = `<body>
<a href="#" onclick="removeMe()">I am a test</a>
<script>
function removeMe() {
  const elem = document.querySelector('a');
  elem.parentNode.removeChild(elem);
  return false;
}
</script>
</body>`;
    });
    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];
    await core.goto(`${koaServer.baseUrl}/test2`);
    await core.waitForLoad('DomContentLoaded');
    // @ts-ignore
    const state = core.window.sessionState;

    const changesAfterLoad = await state.getPageDomChanges(state.pages.history, true);
    const [frameId] = Object.keys(changesAfterLoad);
    expect(changesAfterLoad[frameId]).toHaveLength(11);
    expect(changesAfterLoad[frameId][0][2].textContent).toBe(`${koaServer.baseUrl}/test2`);
    const loadCommand = core.lastCommandId;

    await core.waitForElement(['document', ['querySelector', 'a']]);
    await core.interact([
      { command: 'click', mousePosition: ['document', ['querySelector', 'a']] },
    ]);

    await core.waitForMillis(100);

    const changes = await state.getPageDomChanges(state.pages.history, true, loadCommand);
    const [key] = Object.keys(changes);
    expect(changes[key]).toHaveLength(2);
    expect(changes[key][0][1]).toBe('removed');
  });

  it('detects reordered nodes', async () => {
    koaServer.get('/test3', ctx => {
      ctx.body = `<body>
<ul>
    <li id="id-1">1</li>
    <li id="id-2">2</li>
    <li id="id-3">3</li>
    <li id="id-4">4</li>
    <li id="id-5">5</li>
</ul>
<a href="#" onclick="sort()">I am a test</a>
<script>
function sort() {
  const elem1 = document.querySelector('li#id-1');
  const elem2 = document.querySelector('li#id-2');
  const elem3 = document.querySelector('li#id-3');
  const parent = document.querySelector('ul');
  parent.append(elem2, elem1, elem3);
  parent.append(elem1);
}
</script>
</body>`;
    });
    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];
    await core.goto(`${koaServer.baseUrl}/test3`);
    await core.waitForLoad('DomContentLoaded');
    // @ts-ignore
    const state = core.window.sessionState;

    const changesAfterLoad = await state.getPageDomChanges(state.pages.history, true);
    const [frameId] = Object.keys(changesAfterLoad);
    expect(changesAfterLoad[frameId]).toHaveLength(29);
    expect(changesAfterLoad[frameId][0][2].textContent).toBe(`${koaServer.baseUrl}/test3`);
    const loadCommand = core.lastCommandId;

    await core.waitForElement(['document', ['querySelector', 'a']]);
    await core.interact([
      { command: 'click', mousePosition: ['document', ['querySelector', 'a']] },
    ]);

    await core.waitForMillis(100);

    const changes = await state.getPageDomChanges(state.pages.history, true, loadCommand);
    const [key] = Object.keys(changes);
    // 1 remove and 1 add for each
    expect(changes[key]).toHaveLength(9);
    expect(changes[key].filter(x => x[1] === 'removed')).toHaveLength(4);

    const elem3 = changesAfterLoad[frameId].find(x => x[2].attributes?.id === 'id-3');
    const elem1 = changesAfterLoad[frameId].find(x => x[2].attributes?.id === 'id-1');

    const [lastChange, locationChange] = changes[key].slice(-2);
    expect(locationChange[1]).toBe('location');
    expect(lastChange[1]).toBe('added');
    expect(lastChange[2].id).toBe(elem1[2].id);
    expect(lastChange[2].previousSiblingId).toBe(elem3[2].id);
  });

  it('detects attribute changes', async () => {
    koaServer.get('/test4', ctx => {
      ctx.body = `<body>
<div id="divvy">This is my div</div>
<a href="#" onclick="sort()">I drive</a>
<script>
function sort() {
  document.querySelector('#divvy').setAttribute('new-attr', "1");
}
</script>
</body>`;
    });
    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];
    await core.goto(`${koaServer.baseUrl}/test4`);
    await core.waitForLoad('DomContentLoaded');
    // @ts-ignore
    const state = core.window.sessionState;

    const changesAfterLoad = await state.getPageDomChanges(state.pages.history, true);
    const [frameId] = Object.keys(changesAfterLoad);
    expect(changesAfterLoad[frameId]).toHaveLength(14);
    expect(changesAfterLoad[frameId][0][2].textContent).toBe(`${koaServer.baseUrl}/test4`);
    const loadCommand = core.lastCommandId;

    await core.waitForElement(['document', ['querySelector', 'a']]);
    await core.interact([
      { command: 'click', mousePosition: ['document', ['querySelector', 'a']] },
    ]);

    await core.waitForMillis(100);

    const changes = await state.getPageDomChanges(state.pages.history, true, loadCommand);
    const [key] = Object.keys(changes);
    expect(changes[key]).toHaveLength(2);
    expect(changes[key][0][1]).toBe('attribute');
    expect(changes[key][0][2].attributes['new-attr']).toBe('1');
  });
});

describe('basic Mouse Event tests', () => {
  it('detects mouse move and click', async () => {
    koaServer.get('/mouse1', ctx => {
      ctx.body = `<body>
<div id="divvy" style="height: 2200px">This is my div</div>
<ul>
<li>1</li>
<li>1</li>
<li>1</li>
<li>1</li>
<li>1</li>
<li>1</li>
<li>1</li>
<li>1</li>
<li>1</li>
</ul>
<span>Other one</span>
<button>I drive</button>

</body>`;
    });
    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];
    // @ts-ignore
    const state = core.window.sessionState;

    await core.goto(`${koaServer.baseUrl}/mouse1`);
    await core.waitForLoad(LocationStatus.AllContentLoaded);

    await core.interact([
      { command: 'click', mousePosition: ['document', ['querySelector', 'BUTTON']] },
    ]);

    await state.flush();
    const mouseMoves = state.db.mouseEvents.all();

    expect(mouseMoves.filter(x => x.event === MouseEventType.MOVE)).toHaveLength(1);
    expect(mouseMoves.filter(x => x.event === MouseEventType.OVER).length).toBeGreaterThanOrEqual(
      1,
    );
    expect(mouseMoves.filter(x => x.event === MouseEventType.UP)).toHaveLength(1);

    const mouseDownEvents = mouseMoves.filter(x => x.event === MouseEventType.DOWN);
    expect(mouseDownEvents).toHaveLength(1);

    const changes = await state.getPageDomChanges(state.pages.history, true);
    const [domChanges] = Object.values(changes);
    const linkNode = domChanges.find(x => x[2].tagName === 'BUTTON')[2];

    expect(mouseDownEvents[0].targetNodeId).toBe(linkNode.id);

    const scrollRecords = state.db.scrollEvents.all();
    expect(scrollRecords.length).toBeGreaterThanOrEqual(1);
    expect(scrollRecords[0].scrollY).toBeGreaterThanOrEqual(500);
  });
});

describe('basic Form element tests', () => {
  it('detects typing in an input', async () => {
    koaServer.get('/input', ctx => {
      ctx.body = `<body>
<input type="text" value="" name="box">

<button onclick="clickedButton()">Button</button>
<script>
 function clickedButton() {
   document.querySelector('input').value = 'test';
 }
</script>
</body>`;
    });
    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];
    await core.goto(`${koaServer.baseUrl}/input`);
    await core.waitForLoad('AllContentLoaded');
    await new Promise(resolve => setTimeout(resolve, 250));
    // @ts-ignore
    const state = core.window.sessionState;

    await core.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['document', ['querySelector', 'input']],
      },
      {
        command: InteractionCommand.type,
        keyboardCommands: [{ string: 'Hello world!' }],
      },
    ]);

    const textValue = await core.execJsPath(['document', ['querySelector', 'input'], 'value']);
    expect(textValue.value).toBe('Hello world!');

    await core.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['document', ['querySelector', 'button']],
      },
    ]);
    const textValue2 = await core.execJsPath(['document', ['querySelector', 'input'], 'value']);
    expect(textValue2.value).toBe('test');

    await state.flush();
    const changesAfterType = await state.getPageDomChanges(state.pages.history, true);
    const [domChanges] = Object.values(changesAfterType);

    // should have a change for each keypress + one for test
    expect(domChanges.filter(x => x[1] === 'property')).toHaveLength('Hello world!'.length + 1);

    const focusRecords = state.db.focusEvents.all();
    expect(focusRecords).toHaveLength(3);
    const inputNode = domChanges.find(x => x[2].tagName === 'INPUT')[2];
    expect(focusRecords[0].targetNodeId).toBe(inputNode.id);
  });

  it('detects typing in a textarea', async () => {
    koaServer.get('/textarea', ctx => {
      ctx.body = `<body>
<textarea name="any"></textarea>

<button onclick="clickedButton()">Button</button>
<script>
 function clickedButton() {
   document.querySelector('textarea').value = 'test';
 }
</script>
</body>`;
    });
    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];
    await core.goto(`${koaServer.baseUrl}/textarea`);
    await core.waitForLoad('AllContentLoaded');
    await new Promise(resolve => setTimeout(resolve, 250));
    // @ts-ignore
    const state = core.window.sessionState;

    await core.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['document', ['querySelector', 'textarea']],
      },
      {
        command: InteractionCommand.type,
        keyboardCommands: [{ string: 'Hello world!' }],
      },
    ]);

    const textValue = await core.execJsPath(['document', ['querySelector', 'textarea'], 'value']);
    expect(textValue.value).toBe('Hello world!');

    await core.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['document', ['querySelector', 'button']],
      },
    ]);
    const textValue2 = await core.execJsPath(['document', ['querySelector', 'textarea'], 'value']);
    expect(textValue2.value).toBe('test');

    await state.flush();
    const changesAfterType = await state.getPageDomChanges(state.pages.history, true);
    const [domChanges] = Object.values(changesAfterType);

    // should have a change for each keypress + one for test
    expect(domChanges.filter(x => x[1] === 'property')).toHaveLength('Hello world!'.length + 1);

    const focusRecords = state.db.focusEvents.all();
    expect(focusRecords).toHaveLength(3);
    const inputNode = domChanges.find(x => x[2].tagName === 'TEXTAREA')[2];
    expect(focusRecords[0].targetNodeId).toBe(inputNode.id);
  });

  it('detects checking a checkbox', async () => {
    koaServer.get('/cbox', ctx => {
      ctx.body = `<body>

<input type="checkbox" id="cbox1" name="field">Box 1</input>
<input type="checkbox" id="cbox2" name="field">Box 2</input>

<button onclick="clickedButton()">Button</button>
<script>
 function clickedButton() {
   document.querySelector('#cbox2').checked = true;
 }
</script>
</body>`;
    });
    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];
    await core.goto(`${koaServer.baseUrl}/cbox`);
    await core.waitForLoad('AllContentLoaded');
    await new Promise(resolve => setTimeout(resolve, 250));
    // @ts-ignore
    const state = core.window.sessionState;

    await core.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['document', ['querySelector', '#cbox1']],
      },
    ]);

    await core.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['document', ['querySelector', 'button']],
      },
    ]);
    const values = await core.execJsPath(['document', ['querySelectorAll', ':checked']]);
    expect(Object.keys(values.value)).toHaveLength(2);

    await state.flush();
    const changesAfterType = await state.getPageDomChanges(state.pages.history, true);
    const [domChanges] = Object.values(changesAfterType);

    // should have a change for each keypress + one for test
    expect(domChanges.filter(x => x[1] === 'property')).toHaveLength(2);

    const focusRecords = state.db.focusEvents.all();
    expect(focusRecords).toHaveLength(3);
    const inputNode = domChanges.find(x => x[2].tagName === 'INPUT')[2];
    expect(focusRecords[0].targetNodeId).toBe(inputNode.id);
  });

  it('detects changing a radio', async () => {
    koaServer.get('/radio', ctx => {
      ctx.body = `<body>

<input type="radio" checked="true" id="radio1" name="radiogroup">Radio 1</input>
<input type="radio" id="radio2" name="radiogroup">Radio 2</input>

<button onclick="clickedButton()">Button</button>
<script>
 function clickedButton() {
   document.querySelector('#radio1').checked = true;
 }
</script>
</body>`;
    });
    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];
    await core.goto(`${koaServer.baseUrl}/radio`);
    await core.waitForLoad('AllContentLoaded');
    await new Promise(resolve => setTimeout(resolve, 250));
    // @ts-ignore
    const state = core.window.sessionState;

    await core.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['document', ['querySelector', '#radio2']],
      },
    ]);

    await core.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['document', ['querySelector', 'button']],
      },
    ]);
    const values = await core.execJsPath(['document', ['querySelectorAll', ':checked']]);
    expect(Object.keys(values.value)).toHaveLength(1);

    await state.flush();
    const changesAfterType = await state.getPageDomChanges(state.pages.history, true);
    const [domChanges] = Object.values(changesAfterType);

    // 2 changes per radio change
    expect(domChanges.filter(x => x[1] === 'property')).toHaveLength(4);
    expect(
      domChanges.filter(x => x[1] === 'property' && x[2].properties.checked === true),
    ).toHaveLength(2);

    const focusRecords = state.db.focusEvents.all();
    expect(focusRecords).toHaveLength(3);
    const inputNode = domChanges.find(x => x[2].attributes?.id === 'radio2')[2];
    expect(focusRecords[0].targetNodeId).toBe(inputNode.id);
  });

  it('detects changing a select', async () => {
    koaServer.get('/select', ctx => {
      ctx.body = `<body>
<select name="test">
  <option id="opt1" value="1" selected>Option 1</option>
  <option id="opt2" value="2">Option 2</option>
</select>

<button onclick="clickedButton()">Button</button>
<script>
 function clickedButton() {
   document.querySelector('#opt1').selected = true;
 }
</script>
</body>`;
    });
    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];
    await core.goto(`${koaServer.baseUrl}/select`);
    await core.waitForLoad('AllContentLoaded');
    await new Promise(resolve => setTimeout(resolve, 250));
    // @ts-ignore
    const state = core.window.sessionState;

    await core.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['document', ['querySelector', 'select']],
      },
      {
        command: InteractionCommand.click,
        mousePosition: ['document', ['querySelector', '#opt2']],
      },
    ]);

    await core.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['document', ['querySelector', 'button']],
      },
    ]);
    const values = await core.execJsPath(['document', ['querySelectorAll', ':checked']]);
    expect(Object.keys(values.value)).toHaveLength(1);

    await state.flush();
    const changesAfterType = await state.getPageDomChanges(state.pages.history, true);
    const [domChanges] = Object.values(changesAfterType);

    const focusRecords = state.db.focusEvents.all();

    expect(focusRecords).toHaveLength(3);
    const select = domChanges.find(x => x[2].tagName === 'SELECT')[2];
    const opt2 = domChanges.find(x => x[2].attributes?.id === 'opt2')[2];
    expect(focusRecords[0].targetNodeId).toBe(select.id);

    // 2 sets of: 1 change for each option, 1 for select
    expect(domChanges.filter(x => x[1] === 'property')).toHaveLength(6);
    expect(domChanges.filter(x => x[1] === 'property' && x[2].id === select.id)).toHaveLength(2);
    expect(domChanges.filter(x => x[1] === 'property' && x[2].id === opt2.id)).toHaveLength(2);
  });
});

afterAll(async () => {
  await Core.shutdown();
  await Helpers.closeAll();
});
