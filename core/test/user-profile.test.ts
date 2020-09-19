import { Helpers } from '@secret-agent/testing';
import { InteractionCommand } from '@secret-agent/core-interfaces/IInteractions';
import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';
import HttpRequestHandler from '@secret-agent/mitm/handlers/HttpRequestHandler';
import Safari13 from '@secret-agent/emulate-safari-13';
import Core from '../index';

let koaServer;
beforeAll(async () => {
  await Core.start();
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('UserProfile cookie tests', () => {
  it('should be able to save and restore cookies', async () => {
    const meta = await Core.createTab();
    const core = Core.byTabId[meta.tabId];

    koaServer.get('/cookie', ctx => {
      ctx.cookies.set('cookietest', 'Is Set');
      ctx.body = `<body><h1>cookie page</h1></body>`;
    });

    let cookie = 'not set';
    koaServer.get('/cookie2', ctx => {
      cookie = ctx.cookies.get('cookietest');
      ctx.body = `<body><h1>cookie page 2</h1></body>`;
    });

    await core.goto(`${koaServer.baseUrl}/cookie`);
    await core.waitForLoad('AllContentLoaded');

    const profile = await core.exportUserProfile();
    expect(profile.cookies).toHaveLength(1);
    expect(profile.cookies[0].name).toBe('cookietest');
    expect(profile.cookies[0].value).toBe('Is Set');

    // try loading an empty session now to confirm cookies are gone without reloading
    const meta2 = await Core.createTab();
    const core2 = Core.byTabId[meta2.tabId];
    const core2Cookies = await core2.getUserCookies();
    expect(core2Cookies).toHaveLength(0);

    await core2.goto(`${koaServer.baseUrl}/cookie2`);
    await core2.waitForLoad('AllContentLoaded');
    expect(cookie).not.toBeTruthy();

    const meta3 = await Core.createTab({
      userProfile: profile,
    });
    const core3 = Core.byTabId[meta3.tabId];
    const cookiesBefore = await core3.getUserCookies();
    expect(cookiesBefore).toHaveLength(1);

    await core3.goto(`${koaServer.baseUrl}/cookie2`);
    await core3.waitForLoad('AllContentLoaded');
    expect(cookie).toBe('Is Set');

    await core.close();
    await core2.close();
    await core3.close();
  });

  it('should track cookies from other domains', async () => {
    let profile: IUserProfile;
    {
      const meta = await Core.createTab();
      const core = Core.byTabId[meta.tabId];
      // @ts-ignore
      const session = core.session;
      session.mitmRequestSession.blockedResources = {
        urls: ['https://dataliberationfoundation.org/cookie'],
        types: [],
        handlerFn(request, response) {
          response.setHeader('Set-Cookie', [
            'cross1=1; SameSite=None; Secure; HttpOnly',
            'cross2=2; SameSite=None; Secure; HttpOnly',
          ]);
          response.end(`<html><p>frame body</p></html>`);
          return true;
        },
      };
      koaServer.get('/cross-cookie', ctx => {
        ctx.cookies.set('cookietest', 'mainsite');
        ctx.body = `<body><h1>cross cookies page</h1><iframe src="https://dataliberationfoundation.org/cookie"/></body>`;
      });

      await core.goto(`${koaServer.baseUrl}/cross-cookie`);
      await core.waitForLoad('AllContentLoaded');

      profile = await core.exportUserProfile();
      expect(profile.cookies).toHaveLength(3);
      expect(profile.cookies[0].name).toBe('cookietest');
      expect(profile.cookies[0].value).toBe('mainsite');
      expect(profile.cookies[1].name).toBe('cross1');
      expect(profile.cookies[1].value).toBe('1');
      await core.close();
    }
    {
      const meta = await Core.createTab({
        userProfile: profile,
      });
      const core = Core.byTabId[meta.tabId];
      // @ts-ignore
      const session = core.session;

      session.mitmRequestSession.blockedResources = {
        urls: ['https://dataliberationfoundation.org/cookie2'],
        types: [],
        handlerFn: (request, response) => {
          dlfCookies = request.headers.cookie;
          response.end(`<html><p>frame body</p></html>`);
          return true;
        },
      };
      let dlfCookies = '';
      let sameCookies = '';
      koaServer.get('/cross-cookie2', ctx => {
        sameCookies = ctx.cookies.get('cookietest');
        ctx.body = `<body><h1>cross cookies page</h1><iframe src="https://dataliberationfoundation.org/cookie2"/></body>`;
      });
      await core.goto(`${koaServer.baseUrl}/cross-cookie2`);
      await core.waitForLoad('AllContentLoaded');

      expect(dlfCookies).toBe('cross1=1; cross2=2');
      expect(sameCookies).toBe('mainsite');
      await core.close();
    }
  });

  it('restores cookies for safari', async () => {
    let profile: IUserProfile;
    {
      const meta = await Core.createTab({
        emulatorId: Safari13.emulatorId,
      });
      const core = Core.byTabId[meta.tabId];
      koaServer.get('/safari-cookie', ctx => {
        ctx.cookies.set('safari', 'cookie');
        ctx.body = `<body><h1>safari page</h1></body>`;
      });

      await core.goto(`${koaServer.baseUrl}/safari-cookie`);
      await core.waitForLoad('AllContentLoaded');
      profile = await core.exportUserProfile();
      expect(profile.cookies).toHaveLength(1);
      await core.close();
    }
    {
      const meta = await Core.createTab({
        userProfile: profile,
        emulatorId: Safari13.emulatorId,
      });
      const core = Core.byTabId[meta.tabId];

      let cookie = '';
      koaServer.get('/safari-cookie2', ctx => {
        cookie = ctx.cookies.get('safari');
        ctx.body = `<body><h1>safari cookies page 2</h1></body>`;
      });
      await core.goto(`${koaServer.baseUrl}/safari-cookie2`);
      await core.waitForLoad('AllContentLoaded');

      expect(cookie).toBe('cookie');
      await core.close();
    }
  });
});

describe('UserProfile Dom storage tests', () => {
  it('should be able to save and restore local/session storage', async () => {
    const meta = await Core.createTab();
    const core = Core.byTabId[meta.tabId];

    koaServer.get('/local', ctx => {
      ctx.body = `<body>
<h1>storage page</h1>
<script>
localStorage.setItem('Test1', 'value1');
localStorage.setItem('Test2', 'value2');
localStorage.setItem('Test3', 'value3');
localStorage.removeItem('Test2');

sessionStorage.setItem('STest1', 'value1');
sessionStorage.setItem('STest2', 'value2');
sessionStorage.setItem('STest3', 'value3');
sessionStorage.removeItem('STest3');
</script>
</body>`;
    });

    koaServer.get('/localrestore', ctx => {
      ctx.body = `<body>
<div id="local"></div>
<div id="session"></div>
<script>
const local1 = localStorage.getItem('Test1');
const local2 = localStorage.getItem('Test2');
const local3 = localStorage.getItem('Test3');
document.querySelector('#local').innerHTML = [local1,local2,local3].join(',');

const session1 = sessionStorage.getItem('STest1');
const session2 = sessionStorage.getItem('STest2');
const session3 = sessionStorage.getItem('STest3');
document.querySelector('#session').innerHTML = [session1,session2,session3].join(',');
</script>
</body>`;
    });

    await core.goto(`${koaServer.baseUrl}/local`);
    await core.waitForLoad('AllContentLoaded');

    const profile = await core.exportUserProfile();
    expect(profile.cookies).toHaveLength(0);
    expect(profile.storage[koaServer.baseUrl]?.localStorage).toHaveLength(2);
    expect(profile.storage[koaServer.baseUrl]?.sessionStorage).toHaveLength(2);

    const meta2 = await Core.createTab({
      userProfile: profile,
    });
    const core2 = Core.byTabId[meta2.tabId];

    await core2.goto(`${koaServer.baseUrl}/localrestore`);
    await core2.waitForLoad('AllContentLoaded');

    const localContent = await core2.execJsPath([
      'document',
      ['querySelector', '#local'],
      'textContent',
    ]);
    expect(localContent.value).toBe('value1,,value3');
    const sessionContent = await core2.execJsPath([
      'document',
      ['querySelector', '#session'],
      'textContent',
    ]);
    expect(sessionContent.value).toBe('value1,value2,');

    await core.close();
    await core2.close();
  });

  it('should not make requests to end sites during profile "install"', async () => {
    const mitmSpy = jest.spyOn(HttpRequestHandler, 'onRequest');
    await Core.createTab({
      userProfile: {
        cookies: [],
        storage: {
          'https://site1.org': {
            indexedDB: [],
            localStorage: [['test', 'site1.org']],
            sessionStorage: [],
          },
          'https://site2.org': {
            indexedDB: [],
            localStorage: [['test2', 'site2.org']],
            sessionStorage: [],
          },
        },
      },
    });
    expect(mitmSpy).toHaveBeenCalledTimes(0);
  });

  it('should not override changed variables on a second page load in a domain', async () => {
    const meta = await Core.createTab({
      userProfile: {
        storage: {
          [koaServer.baseUrl]: {
            indexedDB: [],
            localStorage: [['test', 'beforeChange']],
            sessionStorage: [],
          },
        },
        cookies: [],
      },
    });
    const core = Core.byTabId[meta.tabId];

    koaServer.get('/local-change-pre', ctx => {
      ctx.body = `<body>
<h1>storage page</h1>
<a href="/local-change-post">Click</a>
<script>
  localStorage.setItem('test', 'changed');
</script>
</body>`;
    });

    koaServer.get('/local-change-post', ctx => {
      ctx.body = `<body>
<div id="local"></div>
<script>
document.querySelector('#local').innerHTML = localStorage.getItem('test');
</script>
</body>`;
    });

    await core.goto(`${koaServer.baseUrl}/local-change-pre`);
    await core.waitForLoad('AllContentLoaded');

    const profile = await core.exportUserProfile();
    expect(profile.storage[koaServer.baseUrl]?.localStorage).toHaveLength(1);
    expect(profile.storage[koaServer.baseUrl]?.localStorage[0][1]).toBe('changed');

    await core.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['window', 'document', ['querySelector', 'a']],
      },
    ]);

    const localContent = await core.execJsPath([
      'document',
      ['querySelector', '#local'],
      'textContent',
    ]);
    expect(localContent.value).toBe('changed');

    await core.close();
  });

  it('should store cross domain domStorage items', async () => {
    let profile: IUserProfile;
    {
      const meta = await Core.createTab();
      const core = Core.byTabId[meta.tabId];
      // @ts-ignore
      const session = core.session;
      session.mitmRequestSession.blockedResources = {
        urls: ['http://dataliberationfoundation.org/storage'],
        types: [],
        handlerFn: (request, response) => {
          response.end(`<html><body><p>frame body</p>
<script>
localStorage.setItem('cross', '1');
</script>
</body>
</html>`);
          return true;
        },
      };

      koaServer.get('/cross-storage', ctx => {
        ctx.body = `<body>
<iframe src="http://dataliberationfoundation.org/storage"></iframe>
<script>
  localStorage.setItem('local', '2');
</script>
</body>`;
      });

      await core.goto(`${koaServer.baseUrl}/cross-storage`);
      await core.waitForLoad('AllContentLoaded');
      profile = await core.exportUserProfile();
      expect(profile.storage[koaServer.baseUrl]?.localStorage).toHaveLength(1);
      expect(profile.storage['http://dataliberationfoundation.org']?.localStorage).toHaveLength(1);
      await core.close();
    }
    {
      const meta = await Core.createTab({
        userProfile: profile,
      });
      const core = Core.byTabId[meta.tabId];
      // @ts-ignore
      const session = core.session;

      session.mitmRequestSession.blockedResources = {
        urls: ['http://dataliberationfoundation.org/storage2'],
        types: [],
        handlerFn: (request, response) => {
          response.end(`<html>
<body>
<script>
window.parent.postMessage({message: localStorage.getItem('cross')}, "${koaServer.baseUrl}");
</script>
</body>
</html>`);
          return true;
        },
      };
      koaServer.get('/cross-storage2', ctx => {
        ctx.body = `<body>
<div id="local"></div>
<div id="cross"></div>
<iframe src="http://dataliberationfoundation.org/storage2"></iframe>
<script>
window.addEventListener('message', function(event) {
    document.querySelector('#cross').innerHTML = event.data.message;
    document.querySelector('#cross').classList.add('ready');
});
document.querySelector('#local').innerHTML = localStorage.getItem('local');
</script>
</body>`;
      });
      await core.goto(`${koaServer.baseUrl}/cross-storage2`);
      await core.waitForLoad('AllContentLoaded');
      const localContent = await core.execJsPath([
        'document',
        ['querySelector', '#local'],
        'textContent',
      ]);
      expect(localContent.value).toBe('2');

      await core.waitForElement(['document', ['querySelector', '#cross.ready']]);
      const crossContent = await core.execJsPath([
        'document',
        ['querySelector', '#cross'],
        'textContent',
      ]);
      expect(crossContent.value).toBe('1');
      await core.close();

      // @ts-ignore
      const history = core.tab.navigationTracker.history;
      expect(history).toHaveLength(1);
      expect(history[0].finalUrl).toBe(`${koaServer.baseUrl}/cross-storage2`);
    }
  });
});

describe('UserProfile IndexedDb tests', () => {
  it('should be able to save and restore an indexed db', async () => {
    const meta = await Core.createTab();
    const core = Core.byTabId[meta.tabId];

    koaServer.get('/db', ctx => {
      ctx.body = `<body>
<h1>db page</h1>
<script>
    const openDBRequest = indexedDB.open('db1', 1);
    openDBRequest.onupgradeneeded = function(ev) {
      const db = ev.target.result;
      const store1 = db.createObjectStore('store1', {
        keyPath: 'id',
        autoIncrement: false
      });
      store1.createIndex('store1_index1', ['child','name'], {
        unique: false,
      });
      store1.createIndex('store1_index2', 'id', {
        unique: true,
      });
      
      
      db.createObjectStore('store2');
      function createStore2() {
        const insertStore = db
          .transaction('store2', 'readwrite')
          .objectStore('store2');
        insertStore.add(new Date(), '1');
        insertStore.transaction.oncomplete = () => { 
         document.body.classList.add('ready');
        }
      }
      
      store1.transaction.oncomplete = function() {
        const insertStore = db
          .transaction('store1', 'readwrite')
          .objectStore('store1');
        insertStore.add({ id: 1, child: { name: 'Richard', age: new Date() }});
        insertStore.add({ id: 2, child: { name: 'Jill' } });
        insertStore.transaction.oncomplete = () => {
          createStore2();
        }
      };
      
    }
</script>
</body>`;
    });

    koaServer.get('/dbrestore', ctx => {
      ctx.body = `<body>
<div id="records"></div>
<div id="richard"></div>
<div id="date-type"></div>
<script>
  function ready(){
    document.body.classList.add('ready');
  }
  const openDBRequest = indexedDB.open('db1', 1);
  openDBRequest.onsuccess = function(ev) {
    const db = ev.target.result;
    const tx = db.transaction('store1', 'readonly').objectStore('store1');
    
    const recordQuery = tx.getAll();
    
    let doneCounter = 0;
    recordQuery.onsuccess = function({ target }) {
      document.querySelector('#records').innerHTML = JSON.stringify(target.result);
      doneCounter +=1;
      if (doneCounter === 2) {
        ready();
      }
    };
    
    const indexQuery = tx.index('store1_index2').get(1);
    indexQuery.onsuccess = function({ target }) {
      document.querySelector('#richard').innerHTML = JSON.stringify(target.result);
      document.querySelector('#date-type').innerHTML = target.result.child.age.constructor.name;
      doneCounter +=1;
      if (doneCounter === 2) {
        ready();
      }
    };
  }
</script>
</body>`;
    });

    await core.goto(`${koaServer.baseUrl}/db`);
    await core.waitForLoad('AllContentLoaded');
    await core.waitForElement(['document', ['querySelector', 'body.ready']]);

    const profile = await core.exportUserProfile();
    expect(profile.storage[koaServer.baseUrl]?.indexedDB).toHaveLength(1);
    const db = profile.storage[koaServer.baseUrl]?.indexedDB[0];
    expect(db.name).toBe('db1');
    expect(db.version).toBe(1);
    expect(db.objectStores).toHaveLength(2);
    expect(db.objectStores[0].name).toBe('store1');
    expect(db.objectStores[0].keyPath).toBe('id');
    expect(db.objectStores[0].indexes).toHaveLength(2);
    expect(db.objectStores[0].indexes[0].keyPath).toStrictEqual(['child', 'name']);
    expect(db.objectStores[1].name).toBe('store2');
    expect(db.objectStores[1].keyPath).not.toBeTruthy();

    expect(db.data.store1).toHaveLength(2);
    const meta2 = await Core.createTab({
      userProfile: profile,
    });
    const core2 = Core.byTabId[meta2.tabId];

    await core2.goto(`${koaServer.baseUrl}/dbrestore`);
    await core2.waitForLoad('AllContentLoaded');
    await core.waitForElement(['document', ['querySelector', 'body.ready']]);

    const recordsJson = await core2.execJsPath([
      'document',
      ['querySelector', '#records'],
      'textContent',
    ]);
    const records = JSON.parse(recordsJson.value);
    expect(records).toHaveLength(2);
    expect(records[0].child.name).toBe('Richard');

    const indexLookupJson = await core2.execJsPath([
      'document',
      ['querySelector', '#richard'],
      'textContent',
    ]);
    const indexLookup = JSON.parse(indexLookupJson.value);
    expect(indexLookup.id).toBe(1);

    const typePreservation = await core2.execJsPath([
      'document',
      ['querySelector', '#date-type'],
      'textContent',
    ]);
    expect(typePreservation.value).toBe('Date');

    await core.close();
    await core2.close();
  });
});
