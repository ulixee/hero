import { Helpers } from '@ulixee/hero-testing';
import { createPromise } from '@ulixee/commons/lib/utils';
import HumanEmulator from '@bureau/default-human-emulator';
import * as Fs from 'fs';
import Hero, { Core } from '../index';

let koaServer;
beforeAll(async () => {
  Core.use(
    class BasicHumanEmulator extends HumanEmulator {
      static id = 'basic';
    },
  );
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('Filechooser tests', () => {
  it('can upload a file by path', async () => {
    const didSubmit = createPromise<void>();
    koaServer.post('/upload', koaServer.upload.single('file'), ctx => {
      ctx.body = 'Ok';
      expect(ctx.file).toBeTruthy();
      expect(ctx.file.originalname).toBe('worker.js');
      expect(ctx.file.mimetype).toBe('text/javascript');
      didSubmit.resolve();
    });
    koaServer.get('/get-upload', ctx => {
      ctx.body = `<html>
<body>
<h1>Upload form</h1>
<form name="upload" action="/upload" method="post" enctype="multipart/form-data">
  <input type="file" name="file" id="files"  />
  <input type="submit" name="Go" id="submitter">
</body>
</html>`;
    });

    const hero = new Hero({ humanEmulatorId: 'basic' });
    Helpers.needsClosing.push(hero);

    await hero.goto(`${koaServer.baseUrl}/get-upload`);
    await hero.waitForPaintingStable();
    const input = await hero.document.querySelector('#files');
    await hero.click(input);
    const chooser = await hero.waitForFileChooser();
    await chooser.chooseFiles(`${__dirname}/html/worker.js`);

    await expect(input.files.length).resolves.toBe(1);
    const body = await input.files.item(0).text();
    const actualText = await Fs.promises.readFile(`${__dirname}/html/worker.js`, 'utf8');

    expect(body).toBe(actualText);
    await expect(input.files.item(0).type).resolves.toBe('text/javascript');

    await hero.click(hero.document.querySelector('#submitter'));
    await didSubmit.promise;
  });

  it('can trigger file upload when a user profile is set', async () => {
    koaServer.get('/get-upload-profile', ctx => {
      ctx.body = `<html>
<body>
<h1>Upload form</h1>
<form name="upload" action="/upload" method="post" enctype="multipart/form-data">
  <input type="file" name="file" id="files"  />
  <input type="submit" name="Go" id="submitter">
</body>
</html>`;
    });

    const hero = new Hero({
      humanEmulatorId: 'basic',
      userProfile: {
        cookies: [],
        storage: {
          'https://domain1.com': {
            indexedDB: [],
            localStorage: [],
            sessionStorage: [['2', '1']],
          },
          'https://domain2.com': {
            indexedDB: [],
            localStorage: [],
            sessionStorage: [['1', '2']],
          },
        },
      },
    });
    Helpers.needsClosing.push(hero);

    await hero.goto(`${koaServer.baseUrl}/get-upload-profile`);
    await hero.waitForPaintingStable();
    const input = await hero.document.querySelector('#files');
    await hero.click(input);
    const chooser = await hero.waitForFileChooser();
    expect(chooser).toBeTruthy();
  });

  it('can upload multiple files', async () => {
    const didSubmit = createPromise<void>();
    koaServer.post('/upload-multi', koaServer.upload.array('sourcefiles'), ctx => {
      ctx.body = 'Ok';
      expect(ctx.files).toHaveLength(2);
      expect(ctx.files[0].originalname).toBe('filechooser.test.js');
      expect(ctx.files[0].mimetype).toBe('text/javascript');
      didSubmit.resolve();
    });
    koaServer.get('/get-upload-multi', ctx => {
      ctx.body = `<html>
<body>
<h1>Upload form</h1>
<form name="upload" action="/upload-multi" method="post" enctype="multipart/form-data">
  <input type="file" name="sourcefiles" id="sourcefiles" multiple="multiple"  />
  <input type="submit" >
</body>
</html>`;
    });

    const hero = new Hero({
      humanEmulatorId: 'basic',
    });
    Helpers.needsClosing.push(hero);

    const file1 = await Fs.promises.readFile(`${__dirname}/filechooser.test.js`);
    const file2 = await Fs.promises.readFile(`${__dirname}/filechooser.test.js.map`);

    await hero.goto(`${koaServer.baseUrl}/get-upload-multi`);
    await hero.waitForPaintingStable();
    const input = await hero.document.querySelector('#sourcefiles');
    await hero.click(input);
    const chooser = await hero.waitForFileChooser();
    await chooser.chooseFiles(
      { data: file1, name: 'filechooser.test.js' },
      { data: file2, name: 'filechooser.test.js.map' },
    );

    await expect(input.files.length).resolves.toBe(2);
    const body = await input.files.item(0).arrayBuffer();

    expect(body).toStrictEqual(file1);
    await expect(input.files.item(0).type).resolves.toBe('text/javascript');

    await hero.click(hero.document.querySelector('input[type=submit]'));
    await didSubmit.promise;
  });
});
