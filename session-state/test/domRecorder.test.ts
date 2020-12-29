import Core, { Session } from '@secret-agent/core';
import { Helpers } from '@secret-agent/testing';
import { LocationStatus } from '@secret-agent/core-interfaces/Location';
import { InteractionCommand } from '@secret-agent/core-interfaces/IInteractions';
import { ITestKoaServer } from '@secret-agent/testing/helpers';
import CoreServerConnection from '@secret-agent/core/lib/CoreServerConnection';
import { MouseEventType } from '../models/MouseEventsTable';
import DomChangesTable from '../models/DomChangesTable';

let koaServer: ITestKoaServer;
let coreServerConnection: CoreServerConnection;
beforeAll(async () => {
  coreServerConnection = Core.addConnection();
  Helpers.onClose(() => coreServerConnection.disconnect(), true);
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic Page Recorder tests', () => {
  it('detects added nodes', async () => {
    koaServer.get('/test1', ctx => {
      ctx.body = `<body>
<a href="#" onclick="addMe()">I am a test</a>
<script>
function addMe() {
  const elem = document.createElement('A');
  elem.setAttribute('id', 'link2');
  elem.setAttribute('href', '/test2');
  document.body.append(elem);
  return false;
}
</script>
</body>`;
    });
    const meta = await coreServerConnection.createSession({
      humanEmulatorId: 'skipper',
    });
    const tab = Session.getTab(meta);
    await tab.goto(`${koaServer.baseUrl}/test1`);
    await tab.waitForLoad('DomContentLoaded');

    const pages = tab.navigationTracker;
    const state = tab.sessionState;

    await tab.domRecorder.flush();
    const changesAfterLoad = await state.getMainFrameDomChanges(pages.history);

    const commandId = tab.lastCommandId;
    const [frameId] = Object.keys(changesAfterLoad);
    expect(changesAfterLoad[frameId]).toHaveLength(12);
    expect(changesAfterLoad[frameId][0][2].textContent).toBe(`${koaServer.baseUrl}/test1`);

    await tab.interact([{ command: 'click', mousePosition: ['document', ['querySelector', 'a']] }]);

    await tab.waitForElement(['document', ['querySelector', 'a#link2']]);

    await tab.domRecorder.flush();
    const changes = await state.getMainFrameDomChanges(pages.history, commandId);
    const [key] = Object.keys(changes);
    expect(changes[key]).toHaveLength(2);
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
    const meta = await coreServerConnection.createSession();
    const tab = Session.getTab(meta);
    await tab.goto(`${koaServer.baseUrl}/test2`);
    await tab.waitForLoad('DomContentLoaded');

    const pages = tab.navigationTracker;
    const state = tab.sessionState;

    await tab.domRecorder.flush();
    const changesAfterLoad = await state.getMainFrameDomChanges(pages.history);
    const [frameId] = Object.keys(changesAfterLoad);
    expect(changesAfterLoad[frameId]).toHaveLength(12);
    expect(changesAfterLoad[frameId][0][2].textContent).toBe(`${koaServer.baseUrl}/test2`);
    const loadCommand = tab.lastCommandId;

    await tab.waitForElement(['document', ['querySelector', 'a']]);
    await tab.interact([{ command: 'click', mousePosition: ['document', ['querySelector', 'a']] }]);

    await tab.waitForMillis(100);

    await tab.domRecorder.flush();
    const changes = await state.getMainFrameDomChanges(pages.history, loadCommand);
    const [key] = Object.keys(changes);
    expect(changes[key]).toHaveLength(2);
    expect(changes[key][0][1]).toBe('removed');

    await tab.close();
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
    const meta = await coreServerConnection.createSession();
    const tab = Session.getTab(meta);
    await tab.goto(`${koaServer.baseUrl}/test3`);
    await tab.waitForLoad('DomContentLoaded');

    const pages = tab.navigationTracker;

    const state = tab.sessionState;

    await tab.domRecorder.flush();
    const changesAfterLoad = await state.getMainFrameDomChanges(pages.history);
    const [frameId] = Object.keys(changesAfterLoad);
    expect(changesAfterLoad[frameId]).toHaveLength(30);
    expect(changesAfterLoad[frameId][0][2].textContent).toBe(`${koaServer.baseUrl}/test3`);
    const loadCommand = tab.lastCommandId;

    await tab.waitForElement(['document', ['querySelector', 'a']]);
    await tab.interact([{ command: 'click', mousePosition: ['document', ['querySelector', 'a']] }]);

    await tab.waitForMillis(100);

    await tab.domRecorder.flush();
    const changes = await state.getMainFrameDomChanges(pages.history, loadCommand);
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

    await tab.close();
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
    const meta = await coreServerConnection.createSession();
    const tab = Session.getTab(meta);
    await tab.goto(`${koaServer.baseUrl}/test4`);
    await tab.waitForLoad('DomContentLoaded');

    const state = tab.sessionState;

    const pages = tab.navigationTracker;

    await tab.domRecorder.flush();
    const changesAfterLoad = await state.getMainFrameDomChanges(pages.history);
    const [frameId] = Object.keys(changesAfterLoad);
    expect(changesAfterLoad[frameId]).toHaveLength(15);
    expect(changesAfterLoad[frameId][0][2].textContent).toBe(`${koaServer.baseUrl}/test4`);
    const loadCommand = tab.lastCommandId;

    await tab.waitForElement(['document', ['querySelector', 'a']]);
    await tab.interact([{ command: 'click', mousePosition: ['document', ['querySelector', 'a']] }]);

    await tab.waitForMillis(100);

    await tab.domRecorder.flush();
    const changes = await state.getMainFrameDomChanges(pages.history, loadCommand);
    const [key] = Object.keys(changes);
    expect(changes[key]).toHaveLength(2);
    expect(changes[key][0][1]).toBe('attribute');
    expect(changes[key][0][2].attributes['new-attr']).toBe('1');

    await tab.close();
  });

  it('records frame dom ids', async () => {
    koaServer.get('/iframe', ctx => {
      ctx.body = `<body>
<div id="divvy">This is my div</div>
<iframe name="test1" srcdoc="<body>Hello world</body"></iframe>
<iframe name="srcTest" src="${koaServer.baseUrl}/iframe2"></iframe>
</body>`;
    });
    koaServer.get('/iframe2', ctx => {
      ctx.body = `<body>
<h1>Not much to see</h1>
<iframe name="subframe" src="${koaServer.baseUrl}/iframe3"></iframe>
</body>`;
    });
    koaServer.get('/iframe3', ctx => {
      ctx.body = `<body><h1>This is deep</h1></body>`;
    });

    const meta = await coreServerConnection.createSession();
    const tab = Session.getTab(meta);
    await tab.goto(`${koaServer.baseUrl}/iframe`);
    await tab.waitForLoad('AllContentLoaded');
    const state = tab.sessionState;

    expect(tab.puppetPage.frames).toHaveLength(4);
    await tab.puppetPage.frames[1].waitForLoad();
    await tab.puppetPage.frames[2].waitForLoad();
    // await tab.puppetPage.frames[3].waitOn('frame-lifecycle', f => f.name === 'load');

    await tab.domRecorder.flush();
    await state.db.flush();
    const domChanges = state.db.domChanges.all();
    const domFrames = domChanges.filter(x => x.tagName === 'IFRAME');
    expect(domFrames).toHaveLength(3);

    const frames = state.db.frames.all();
    expect(frames).toHaveLength(4);
    const test1 = frames.find(x => x.name === 'test1');
    expect(test1).toBeTruthy();
    expect(test1.domNodeId).toBe(domFrames[0].nodeId);

    const srcTest = frames.find(x => x.name === 'srcTest');
    expect(srcTest).toBeTruthy();
    expect(srcTest.domNodeId).toBe(domFrames[1].nodeId);
    expect(srcTest.parentId).toBe(frames[0].id);

    const subframe = frames.find(x => x.name === 'subframe');
    expect(subframe).toBeTruthy();
    expect(subframe.domNodeId).toBe(domFrames[2].nodeId);
    expect(subframe.parentId).toBe(srcTest.id);

    await tab.close();
  });

  it('supports recording CSSOM', async () => {
    koaServer.get('/cssom', ctx => {
      ctx.body = `<body>
<style id="style1" type="text/css"></style>
<a onclick="clickIt()">Click this link</a>

<script>
function clickIt() {
  const style = document.querySelector('#style1');
  style.sheet.insertRule('body { color:red }');
}
</script>
</body>`;
    });

    const meta = await coreServerConnection.createSession();
    const tab = Session.getTab(meta);
    await tab.goto(`${koaServer.baseUrl}/cssom`);
    await tab.waitForLoad('DomContentLoaded');

    const state = tab.sessionState;

    const pages = tab.navigationTracker;

    await tab.waitForElement(['document', ['querySelector', 'a']]);
    await tab.interact([{ command: 'click', mousePosition: ['document', ['querySelector', 'a']] }]);

    await tab.waitForMillis(100);

    await tab.domRecorder.flush();
    const changes = await state.getMainFrameDomChanges(pages.history);
    const [key] = Object.keys(changes);

    const propChange = changes[key].find(
      x => x[1] === 'property' && !!x[2].properties['sheet.cssRules'],
    );
    expect(propChange).toBeTruthy();

    expect(propChange[2].properties['sheet.cssRules']).toStrictEqual(['body { color: red; }']);
    await tab.close();
  });

  it('supports recording closed shadow dom roots', async () => {
    koaServer.get('/test5', ctx => {
      ctx.body = `<body>
<script>
customElements.define('image-list', class extends HTMLElement {
  closedShadow;
  constructor() {
    super();
    // test with a closed one since that's harder to intercept
    this.closedShadow = this.attachShadow({mode: 'closed'});
  }

  addImage() {
    const img = document.createElement('img');
    const isClosed = !!this.shadowRoot && this.closedShadow.mode === 'closed';
    img.alt = ' new image ' + (isClosed ? 'is closed ' : '');
    this.closedShadow.appendChild(img)
  }
})
</script>
<image-list id="LI"></image-list>
<a onclick="LI.addImage()">Add image</a>

<script>
</script>
</body>`;
    });
    const meta = await coreServerConnection.createSession();
    const tab = Session.getTab(meta);
    await tab.goto(`${koaServer.baseUrl}/test5`);
    await tab.waitForLoad('DomContentLoaded');

    const state = tab.sessionState;

    const pages = tab.navigationTracker;

    await tab.waitForElement(['document', ['querySelector', 'a']]);
    await tab.interact([{ command: 'click', mousePosition: ['document', ['querySelector', 'a']] }]);

    await tab.waitForMillis(100);

    await tab.domRecorder.flush();
    const changes = await state.getMainFrameDomChanges(pages.history);
    const [key] = Object.keys(changes);
    expect(changes[key].find(x => x[1] === 'added' && x[2].nodeType === 40)).toBeTruthy();

    const shadowRoot = changes[key].find(x => x[1] === 'added' && x[2].nodeType === 40)[2];
    expect(changes[key].find(x => x[2].id === shadowRoot.parentNodeId)[2].tagName).toBe(
      'IMAGE-LIST',
    );
    const shadowImg = changes[key].find(x => x[2].parentNodeId === shadowRoot.id);

    expect(shadowImg[2].tagName).toBe('IMG');
    expect(shadowImg[2].attributes.alt).toBe(' new image is closed ');
    await tab.close();
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
    const meta = await coreServerConnection.createSession({
      humanEmulatorId: 'basic',
      viewport: {
        height: 800,
        width: 1000,
        positionY: 0,
        positionX: 0,
        screenHeight: 800,
        screenWidth: 1000,
      },
    });
    const tab = Session.getTab(meta);
    const state = tab.sessionState;

    await tab.goto(`${koaServer.baseUrl}/mouse1`);
    await tab.waitForLoad(LocationStatus.AllContentLoaded);

    await tab.interact([
      { command: 'click', mousePosition: ['document', ['querySelector', 'BUTTON']] },
    ]);

    await tab.domRecorder.flush();
    await state.db.flush();
    const mouseMoves = state.db.mouseEvents.all();

    expect(mouseMoves.filter(x => x.event === MouseEventType.MOVE)).toHaveLength(1);
    expect(mouseMoves.filter(x => x.event === MouseEventType.OVER).length).toBeGreaterThanOrEqual(
      1,
    );
    expect(mouseMoves.filter(x => x.event === MouseEventType.UP)).toHaveLength(1);

    const mouseDownEvents = mouseMoves.filter(x => x.event === MouseEventType.DOWN);
    expect(mouseDownEvents).toHaveLength(1);

    const pages = tab.navigationTracker;
    const changes = await state.getMainFrameDomChanges(pages.history);
    const [domChanges] = Object.values(changes);
    const linkNode = domChanges.find(x => x[2].tagName === 'BUTTON')[2];

    expect(mouseDownEvents[0].targetNodeId).toBe(linkNode.id);

    const scrollRecords = state.db.scrollEvents.all();
    expect(scrollRecords.length).toBeGreaterThanOrEqual(1);

    await tab.close();
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
    const meta = await coreServerConnection.createSession();
    const tab = Session.getTab(meta);
    await tab.goto(`${koaServer.baseUrl}/input`);
    await tab.waitForLoad('AllContentLoaded');
    await new Promise(resolve => setTimeout(resolve, 250));

    const state = tab.sessionState;

    await tab.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['document', ['querySelector', 'input']],
      },
      {
        command: InteractionCommand.type,
        keyboardCommands: [{ string: 'Hello world!' }],
      },
    ]);

    const textValue = await tab.execJsPath(['document', ['querySelector', 'input'], 'value']);
    expect(textValue.value).toBe('Hello world!');

    await tab.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['document', ['querySelector', 'button']],
      },
    ]);
    const textValue2 = await tab.execJsPath(['document', ['querySelector', 'input'], 'value']);
    expect(textValue2.value).toBe('test');

    await state.db.flush();
    await tab.domRecorder.flush();

    const pages = tab.navigationTracker;
    const changesAfterType = await state.getMainFrameDomChanges(pages.history);
    const [domChanges] = Object.values(changesAfterType);

    // should have a change for each keypress + one for test
    expect(domChanges.filter(x => x[1] === 'property')).toHaveLength('Hello world!'.length + 1);

    const focusRecords = state.db.focusEvents.all();
    expect(focusRecords).toHaveLength(3);
    const inputNode = domChanges.find(x => x[2].tagName === 'INPUT')[2];
    expect(focusRecords[0].targetNodeId).toBe(inputNode.id);

    await tab.close();
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
    const meta = await coreServerConnection.createSession();
    const tab = Session.getTab(meta);
    await tab.goto(`${koaServer.baseUrl}/textarea`);
    await tab.waitForLoad('AllContentLoaded');
    await new Promise(resolve => setTimeout(resolve, 250));

    const state = tab.sessionState;

    await tab.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['document', ['querySelector', 'textarea']],
      },
      {
        command: InteractionCommand.type,
        keyboardCommands: [{ string: 'Hello world!' }],
      },
    ]);

    const textValue = await tab.execJsPath(['document', ['querySelector', 'textarea'], 'value']);
    expect(textValue.value).toBe('Hello world!');

    await tab.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['document', ['querySelector', 'button']],
      },
    ]);
    const textValue2 = await tab.execJsPath(['document', ['querySelector', 'textarea'], 'value']);
    expect(textValue2.value).toBe('test');

    await tab.domRecorder.flush();
    await state.db.flush();

    const pages = tab.navigationTracker;
    const changesAfterType = await state.getMainFrameDomChanges(pages.history);
    const [domChanges] = Object.values(changesAfterType);

    // should have a change for each keypress + one for test
    expect(domChanges.filter(x => x[1] === 'property')).toHaveLength('Hello world!'.length + 1);

    const focusRecords = state.db.focusEvents.all();
    expect(focusRecords).toHaveLength(3);
    const inputNode = domChanges.find(x => x[2].tagName === 'TEXTAREA')[2];
    expect(focusRecords[0].targetNodeId).toBe(inputNode.id);

    await tab.close();
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
    const meta = await coreServerConnection.createSession();
    const tab = Session.getTab(meta);
    await tab.goto(`${koaServer.baseUrl}/cbox`);
    await tab.waitForLoad('AllContentLoaded');
    await new Promise(resolve => setTimeout(resolve, 250));

    const state = tab.sessionState;

    await tab.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['document', ['querySelector', '#cbox1']],
      },
    ]);

    await tab.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['document', ['querySelector', 'button']],
      },
    ]);
    const values = await tab.execJsPath(['document', ['querySelectorAll', ':checked']]);
    expect(Object.keys(values.value)).toHaveLength(2);

    await tab.domRecorder.flush();
    await state.db.flush();

    const pages = tab.navigationTracker;
    const changesAfterType = await state.getMainFrameDomChanges(pages.history);
    const [domChanges] = Object.values(changesAfterType);

    // should have a change for each keypress + one for test
    expect(domChanges.filter(x => x[1] === 'property')).toHaveLength(2);

    const focusRecords = state.db.focusEvents.all();
    expect(focusRecords).toHaveLength(3);
    const inputNode = domChanges.find(x => x[2].tagName === 'INPUT')[2];
    expect(focusRecords[0].targetNodeId).toBe(inputNode.id);

    await tab.close();
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
    const meta = await coreServerConnection.createSession();
    const tab = Session.getTab(meta);
    await tab.goto(`${koaServer.baseUrl}/radio`);
    await tab.waitForLoad('AllContentLoaded');
    await new Promise(resolve => setTimeout(resolve, 250));

    const state = tab.sessionState;

    await tab.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['document', ['querySelector', '#radio2']],
      },
    ]);

    await tab.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['document', ['querySelector', 'button']],
      },
    ]);
    const values = await tab.execJsPath(['document', ['querySelectorAll', ':checked']]);
    expect(Object.keys(values.value)).toHaveLength(1);

    await tab.domRecorder.flush();

    await state.db.flush();

    const pages = tab.navigationTracker;
    const changesAfterType = await state.getMainFrameDomChanges(pages.history);
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
    await tab.close();
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
    const meta = await coreServerConnection.createSession();
    const tab = Session.getTab(meta);
    await tab.goto(`${koaServer.baseUrl}/select`);
    await tab.waitForLoad('AllContentLoaded');
    await new Promise(resolve => setTimeout(resolve, 250));

    const state = tab.sessionState;

    await tab.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['document', ['querySelector', 'select']],
      },
      {
        command: InteractionCommand.click,
        mousePosition: ['document', ['querySelector', '#opt2']],
      },
    ]);

    await tab.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['document', ['querySelector', 'button']],
      },
    ]);
    const values = await tab.execJsPath(['document', ['querySelectorAll', ':checked']]);
    expect(Object.keys(values.value)).toHaveLength(1);

    await tab.domRecorder.flush();

    await state.db.flush();

    const pages = tab.navigationTracker;
    const changesAfterType = await state.getMainFrameDomChanges(pages.history);
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
    await tab.close();
  });
});

describe('Multi-tab recording', () => {
  it('should record dom separately for two pages', async () => {
    koaServer.get('/page1', ctx => {
      ctx.body = `<body>
<a href="/page2" target="_blank" onclick="addMe()">I am on page1</a>
<script>
function addMe() {
  const elem = document.createElement('A');
  elem.setAttribute('id', 'link2');
  elem.setAttribute('href', '/test2');
  document.body.append(elem);
  return true;
}
</script>
</body>
`;
    });
    koaServer.get('/page2', ctx => {
      ctx.body = `<body>
<a href="#" onclick="addMe2()">I am on page2</a>
<script>
function addMe2() {
  const elem = document.createElement('div');
  elem.setAttribute('id', 'divPage2');
  document.body.append(elem);
  return true;
}
</script>
</body>
`;
    });
    const meta = await coreServerConnection.createSession();
    const tab = Session.getTab(meta);
    await tab.goto(`${koaServer.baseUrl}/page1`);
    await tab.waitForLoad('DomContentLoaded');

    const pages = tab.navigationTracker;

    await tab.interact([{ command: 'click', mousePosition: ['document', ['querySelector', 'a']] }]);

    await tab.domRecorder.flush();

    const tab2 = await tab.waitForNewTab();
    await tab2.waitForLoad('AllContentLoaded');
    await tab2.interact([
      { command: 'click', mousePosition: ['document', ['querySelector', 'a']] },
    ]);

    await tab2.domRecorder.flush();

    const pages2 = tab2.navigationTracker;

    const tab1Changes = await tab.sessionState.getMainFrameDomChanges(pages.history);
    const tab2Changes = await tab2.sessionState.getMainFrameDomChanges(pages2.history);

    const [frameId] = Object.keys(tab1Changes);
    const frame1DomRecords = tab1Changes[frameId].map(DomChangesTable.toRecord).map(x => ({
      action: x.action,
      textContent: x.textContent,
      tagName: x.tagName,
      attributes: x.attributes,
    }));
    const [frameId2] = Object.keys(tab2Changes);
    const frame2DomRecords = tab2Changes[frameId2].map(DomChangesTable.toRecord).map(x => ({
      action: x.action,
      textContent: x.textContent,
      tagName: x.tagName,
      attributes: x.attributes,
    }));

    expect(frame1DomRecords[0]).toStrictEqual({
      action: 'newDocument',
      tagName: null,
      attributes: undefined,
      textContent: `${koaServer.baseUrl}/page1`,
    });
    expect(frame1DomRecords.filter(x => x.tagName)).toHaveLength(6);
    expect(frame1DomRecords[frame1DomRecords.length - 1]).toStrictEqual({
      action: 'added',
      tagName: 'A',
      attributes: { id: 'link2', href: '/test2' },
      textContent: null,
    });

    expect(frame2DomRecords[0]).toStrictEqual({
      action: 'newDocument',
      tagName: null,
      attributes: undefined,
      textContent: `${koaServer.baseUrl}/page2`,
    });
    expect(frame2DomRecords.filter(x => x.tagName)).toHaveLength(6);
    expect(frame2DomRecords[frame2DomRecords.length - 2]).toStrictEqual({
      action: 'added',
      tagName: 'DIV',
      attributes: { id: 'divPage2' },
      textContent: null,
    });
    await tab.close();
  });
});
