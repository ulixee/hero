import Core, { Session } from '@secret-agent/core';
import { Helpers } from '@secret-agent/testing';
import { LocationStatus } from '@secret-agent/interfaces/Location';
import { InteractionCommand } from '@secret-agent/interfaces/IInteractions';
import { ITestKoaServer } from '@secret-agent/testing/helpers';
import { DomActionType } from '@secret-agent/interfaces/IDomChangeEvent';
import HumanEmulatorBase from "@secret-agent/plugin-utils/lib/HumanEmulatorBase";
import ConnectionToClient from '../server/ConnectionToClient';
import { MouseEventType } from '../models/MouseEventsTable';

let koaServer: ITestKoaServer;
let connectionToClient: ConnectionToClient;
beforeAll(async () => {
  Core.use(class BasicHumanEmulator extends HumanEmulatorBase {
    static id = 'basic';
  });
  connectionToClient = Core.addConnection();
  Helpers.onClose(() => connectionToClient.disconnect(), true);
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
    const meta = await connectionToClient.createSession({
      humanEmulatorId: 'basic',
    });
    const tab = Session.getTab(meta);
    await tab.goto(`${koaServer.baseUrl}/test1`);
    await tab.waitForLoad('DomContentLoaded');

    const changesAfterLoad = await tab.getMainFrameDomChanges();

    const commandId = tab.lastCommandId;
    expect(changesAfterLoad).toHaveLength(12);
    expect(changesAfterLoad[0].textContent).toBe(`${koaServer.baseUrl}/test1`);

    await tab.interact([{ command: 'click', mousePosition: ['document', ['querySelector', 'a']] }]);

    await tab.waitForElement(['document', ['querySelector', 'a#link2']]);

    const changes = await tab.getMainFrameDomChanges(commandId);
    expect(changes).toHaveLength(2);
    expect(changes[0].action).toBe(DomActionType.added);
    expect(changes[0].tagName).toBe('A');
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
    const meta = await connectionToClient.createSession();
    const tab = Session.getTab(meta);
    Helpers.needsClosing.push(tab.session);
    await tab.goto(`${koaServer.baseUrl}/test2`);
    await tab.waitForLoad('DomContentLoaded');

    const changesAfterLoad = await tab.getMainFrameDomChanges();
    expect(changesAfterLoad).toHaveLength(12);
    expect(changesAfterLoad[0].textContent).toBe(`${koaServer.baseUrl}/test2`);
    const loadCommand = tab.lastCommandId;

    await tab.waitForElement(['document', ['querySelector', 'a']]);
    await tab.interact([{ command: 'click', mousePosition: ['document', ['querySelector', 'a']] }]);

    await tab.waitForMillis(100);

    const changes = await tab.getMainFrameDomChanges(loadCommand);
    expect(changes).toHaveLength(2);
    expect(changes[0].action).toBe(DomActionType.removed);

    await tab.session.close();
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
    const meta = await connectionToClient.createSession();
    const tab = Session.getTab(meta);
    Helpers.needsClosing.push(tab.session);
    await tab.goto(`${koaServer.baseUrl}/test3`);
    await tab.waitForLoad('DomContentLoaded');

    const changesAfterLoad = await tab.getMainFrameDomChanges();
    expect(changesAfterLoad).toHaveLength(30);
    expect(changesAfterLoad[0].textContent).toBe(`${koaServer.baseUrl}/test3`);
    const loadCommand = tab.lastCommandId;

    await tab.waitForElement(['document', ['querySelector', 'a']]);
    await tab.interact([{ command: 'click', mousePosition: ['document', ['querySelector', 'a']] }]);

    await tab.waitForMillis(100);

    const changes = await tab.getMainFrameDomChanges(loadCommand);
    // 1 remove and 1 add for each
    expect(changes).toHaveLength(9);
    expect(changes.filter(x => x.action === DomActionType.removed)).toHaveLength(4);

    const elem3 = changesAfterLoad.find(x => x.attributes?.id === 'id-3');
    const elem1 = changesAfterLoad.find(x => x.attributes?.id === 'id-1');

    const [lastChange, locationChange] = changes.slice(-2);
    expect(locationChange.action).toBe(DomActionType.location);
    expect(lastChange.action).toBe(DomActionType.added);
    expect(lastChange.nodeId).toBe(elem1.nodeId);
    expect(lastChange.previousSiblingId).toBe(elem3.nodeId);

    await tab.session.close();
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
    const meta = await connectionToClient.createSession();
    const tab = Session.getTab(meta);
    Helpers.needsClosing.push(tab.session);
    await tab.goto(`${koaServer.baseUrl}/test4`);
    await tab.waitForLoad('DomContentLoaded');

    const changesAfterLoad = await tab.getMainFrameDomChanges();
    expect(changesAfterLoad).toHaveLength(15);
    expect(changesAfterLoad[0].textContent).toBe(`${koaServer.baseUrl}/test4`);
    const loadCommand = tab.lastCommandId;

    await tab.waitForElement(['document', ['querySelector', 'a']]);
    await tab.interact([{ command: 'click', mousePosition: ['document', ['querySelector', 'a']] }]);

    await tab.waitForMillis(100);

    const changes = await tab.getMainFrameDomChanges(loadCommand);
    expect(changes).toHaveLength(2);
    expect(changes[0].action).toBe(DomActionType.attribute);
    expect(changes[0].attributes['new-attr']).toBe('1');

    await tab.session.close();
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

    const meta = await connectionToClient.createSession();
    const tab = Session.getTab(meta);
    Helpers.needsClosing.push(tab.session);
    await tab.goto(`${koaServer.baseUrl}/iframe`);
    await tab.waitForLoad(LocationStatus.AllContentLoaded);
    const state = tab.sessionState;

    expect(tab.puppetPage.frames).toHaveLength(4);
    await tab.puppetPage.frames[1].waitForLoad();
    await tab.puppetPage.frames[2].waitForLoad();
    // await tab.puppetPage.frames[3].waitOn('frame-lifecycle', f => f.name === 'load');

    await state.db.flush();
    const domChanges = state.db.domChanges.all();
    const domFrames = domChanges.filter(x => x.tagName === 'IFRAME');
    expect(domFrames).toHaveLength(3);

    await tab.puppetPage.frames[3].waitForLoad();

    await state.db.flush();
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

    await tab.session.close();
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

    const meta = await connectionToClient.createSession();
    const tab = Session.getTab(meta);
    Helpers.needsClosing.push(tab.session);
    await tab.goto(`${koaServer.baseUrl}/cssom`);
    await tab.waitForLoad('DomContentLoaded');

    await tab.waitForElement(['document', ['querySelector', 'a']]);
    await tab.interact([{ command: 'click', mousePosition: ['document', ['querySelector', 'a']] }]);

    await tab.waitForMillis(100);

    const changes = await tab.getMainFrameDomChanges();

    const propChange = changes.find(
      x => x.action === DomActionType.property && !!x.properties['sheet.cssRules'],
    );
    expect(propChange).toBeTruthy();

    expect(propChange.properties['sheet.cssRules']).toStrictEqual(['body { color: red; }']);
    await tab.session.close();
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
    const meta = await connectionToClient.createSession();
    const tab = Session.getTab(meta);
    Helpers.needsClosing.push(tab.session);
    await tab.goto(`${koaServer.baseUrl}/test5`);
    await tab.waitForLoad('DomContentLoaded');

    await tab.waitForElement(['document', ['querySelector', 'a']]);
    await tab.interact([{ command: 'click', mousePosition: ['document', ['querySelector', 'a']] }]);

    await tab.waitForMillis(100);

    const changes = await tab.getMainFrameDomChanges();
    expect(changes.find(x => x.action === DomActionType.added && x.nodeType === 40)).toBeTruthy();

    const shadowRoot = changes.find(x => x.action === DomActionType.added && x.nodeType === 40);
    expect(changes.find(x => x.nodeId === shadowRoot.parentNodeId).tagName).toBe('IMAGE-LIST');
    const shadowImg = changes.find(x => x.parentNodeId === shadowRoot.nodeId);

    expect(shadowImg.tagName).toBe('IMG');
    expect(shadowImg.attributes.alt).toBe(' new image is closed ');
    await tab.session.close();
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
    const meta = await connectionToClient.createSession({
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
    Helpers.needsClosing.push(tab.session);
    const state = tab.sessionState;

    await tab.goto(`${koaServer.baseUrl}/mouse1`);
    await tab.waitForLoad(LocationStatus.PaintingStable);

    await tab.interact([
      { command: 'click', mousePosition: ['document', ['querySelector', 'BUTTON']] },
    ]);

    await tab.getMainFrameDomChanges();
    const mouseMoves = state.db.mouseEvents.all();

    expect(mouseMoves.filter(x => x.event === MouseEventType.MOVE)).toHaveLength(1);
    expect(mouseMoves.filter(x => x.event === MouseEventType.OVER).length).toBeGreaterThanOrEqual(
      1,
    );
    expect(mouseMoves.filter(x => x.event === MouseEventType.UP)).toHaveLength(1);

    const mouseDownEvents = mouseMoves.filter(x => x.event === MouseEventType.DOWN);
    expect(mouseDownEvents).toHaveLength(1);

    const domChanges = await tab.getMainFrameDomChanges();
    const linkNode = domChanges.find(x => x.tagName === 'BUTTON');

    expect(mouseDownEvents[0].targetNodeId).toBe(linkNode.nodeId);

    const scrollRecords = state.db.scrollEvents.all();
    expect(scrollRecords.length).toBeGreaterThanOrEqual(1);

    await tab.session.close();
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
    const meta = await connectionToClient.createSession();
    const tab = Session.getTab(meta);
    await tab.goto(`${koaServer.baseUrl}/input`);
    await tab.waitForLoad('PaintingStable');
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

    const changesAfterType = await tab.getMainFrameDomChanges();

    // should have a change for each keypress + one for test
    expect(changesAfterType.filter(x => x.action === DomActionType.property)).toHaveLength(
      'Hello world!'.length + 1,
    );

    const focusRecords = state.db.focusEvents.all();
    expect(focusRecords).toHaveLength(3);
    const inputNode = changesAfterType.find(x => x.tagName === 'INPUT');
    expect(focusRecords[0].targetNodeId).toBe(inputNode.nodeId);

    await tab.session.close();
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
    const meta = await connectionToClient.createSession();
    const tab = Session.getTab(meta);
    Helpers.needsClosing.push(tab.session);
    await tab.goto(`${koaServer.baseUrl}/textarea`);
    await tab.waitForLoad('PaintingStable');
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

    await state.db.flush();

    const changesAfterType = await tab.getMainFrameDomChanges();

    // should have a change for each keypress + one for test
    expect(changesAfterType.filter(x => x.action === DomActionType.property)).toHaveLength(
      'Hello world!'.length + 1,
    );

    const focusRecords = state.db.focusEvents.all();
    expect(focusRecords).toHaveLength(3);
    const inputNode = changesAfterType.find(x => x.tagName === 'TEXTAREA');
    expect(focusRecords[0].targetNodeId).toBe(inputNode.nodeId);

    await tab.session.close();
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
    const meta = await connectionToClient.createSession();
    const tab = Session.getTab(meta);
    Helpers.needsClosing.push(tab.session);
    await tab.goto(`${koaServer.baseUrl}/cbox`);
    await tab.waitForLoad('PaintingStable');
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

    await state.db.flush();

    const changesAfterType = await tab.getMainFrameDomChanges();

    // should have a change for each keypress + one for test
    expect(changesAfterType.filter(x => x.action === DomActionType.property)).toHaveLength(2);

    const focusRecords = state.db.focusEvents.all();
    expect(focusRecords).toHaveLength(3);
    const inputNode = changesAfterType.find(x => x.tagName === 'INPUT');
    expect(focusRecords[0].targetNodeId).toBe(inputNode.nodeId);

    await tab.session.close();
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
    const meta = await connectionToClient.createSession();
    const tab = Session.getTab(meta);
    Helpers.needsClosing.push(tab.session);
    await tab.goto(`${koaServer.baseUrl}/radio`);
    await tab.waitForLoad('PaintingStable');
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

    await state.db.flush();

    const changesAfterType = await tab.getMainFrameDomChanges();

    // 2 changes per radio change
    expect(changesAfterType.filter(x => x.action === DomActionType.property)).toHaveLength(4);
    expect(
      changesAfterType.filter(
        x => x.action === DomActionType.property && x.properties.checked === true,
      ),
    ).toHaveLength(2);

    const focusRecords = state.db.focusEvents.all();
    expect(focusRecords).toHaveLength(3);
    const inputNode = changesAfterType.find(x => x.attributes?.id === 'radio2');
    expect(focusRecords[0].targetNodeId).toBe(inputNode.nodeId);
    await tab.session.close();
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
    const meta = await connectionToClient.createSession();
    const tab = Session.getTab(meta);
    Helpers.needsClosing.push(tab.session);
    await tab.goto(`${koaServer.baseUrl}/select`);
    await tab.waitForLoad('PaintingStable');
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

    await state.db.flush();

    const changesAfterType = await tab.getMainFrameDomChanges();

    const focusRecords = state.db.focusEvents.all();

    expect(focusRecords).toHaveLength(3);
    const select = changesAfterType.find(x => x.tagName === 'SELECT');
    const opt2 = changesAfterType.find(x => x.attributes?.id === 'opt2');
    expect(focusRecords[0].targetNodeId).toBe(select.nodeId);

    // 2 sets of: 1 change for each option, 1 for select
    expect(changesAfterType.filter(x => x.action === DomActionType.property)).toHaveLength(6);
    expect(
      changesAfterType.filter(
        x => x.action === DomActionType.property && x.nodeId === select.nodeId,
      ),
    ).toHaveLength(2);
    expect(
      changesAfterType.filter(x => x.action === DomActionType.property && x.nodeId === opt2.nodeId),
    ).toHaveLength(2);
    await tab.session.close();
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
    const meta = await connectionToClient.createSession();
    const tab = Session.getTab(meta);
    Helpers.needsClosing.push(tab.session);
    await tab.goto(`${koaServer.baseUrl}/page1`);
    await tab.waitForLoad('DomContentLoaded');

    await tab.interact([{ command: 'click', mousePosition: ['document', ['querySelector', 'a']] }]);

    const tab2 = await tab.waitForNewTab();
    await tab2.waitForLoad('PaintingStable');
    await tab2.interact([
      { command: 'click', mousePosition: ['document', ['querySelector', 'a']] },
    ]);

    const tab1Changes = await tab.getMainFrameDomChanges();
    const tab2Changes = await tab2.getMainFrameDomChanges();

    const frame1DomRecords = tab1Changes.map(x => ({
      action: x.action,
      textContent: x.textContent,
      tagName: x.tagName,
      attributes: x.attributes,
    }));

    const frame2DomRecords = tab2Changes.map(x => ({
      action: x.action,
      textContent: x.textContent,
      tagName: x.tagName,
      attributes: x.attributes,
    }));

    expect(frame1DomRecords[0]).toStrictEqual({
      action: DomActionType.newDocument,
      tagName: undefined,
      attributes: undefined,
      textContent: `${koaServer.baseUrl}/page1`,
    });
    expect(frame1DomRecords.filter(x => x.tagName)).toHaveLength(6);
    expect(frame1DomRecords[frame1DomRecords.length - 1]).toStrictEqual({
      action: DomActionType.added,
      tagName: 'A',
      attributes: { id: 'link2', href: '/test2' },
      textContent: undefined,
    });

    expect(frame2DomRecords[0]).toStrictEqual({
      action: DomActionType.newDocument,
      tagName: undefined,
      attributes: undefined,
      textContent: `${koaServer.baseUrl}/page2`,
    });
    expect(frame2DomRecords.filter(x => x.tagName)).toHaveLength(6);
    expect(frame2DomRecords[frame2DomRecords.length - 2]).toStrictEqual({
      action: DomActionType.added,
      tagName: 'DIV',
      attributes: { id: 'divPage2' },
      textContent: undefined,
    });
    await tab.session.close();
  });
});
