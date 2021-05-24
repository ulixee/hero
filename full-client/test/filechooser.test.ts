import { Helpers } from '@secret-agent/testing';
import { createPromise } from '@secret-agent/commons/utils';
import * as Fs from 'fs';
import { Handler } from '../index';

let koaServer;
let handler: Handler;
beforeAll(async () => {
  handler = new Handler({ maxConcurrency: 1 });
  Helpers.onClose(() => handler.close(), true);
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

    const agent = await handler.createAgent({ humanEmulatorId: 'basic' });
    Helpers.needsClosing.push(agent);

    await agent.goto(`${koaServer.baseUrl}/get-upload`);
    await agent.waitForPaintingStable();
    const input = await agent.document.querySelector('#files');
    await agent.click(input);
    const chooser = await agent.waitForFileChooser();
    await chooser.chooseFiles(`${__dirname}/html/worker.js`);

    await expect(input.files.length).resolves.toBe(1);
    const body = await input.files.item(0).text();
    const actualText = await Fs.promises.readFile(`${__dirname}/html/worker.js`, 'utf8');

    expect(body).toBe(actualText);
    await expect(input.files.item(0).type).resolves.toBe('text/javascript');

    await agent.click(agent.document.querySelector('#submitter'));
    await didSubmit.promise;
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

    const agent = await handler.createAgent({ humanEmulatorId: 'basic' });
    Helpers.needsClosing.push(agent);

    const file1 = await Fs.promises.readFile(`${__dirname}/filechooser.test.js`);
    const file2 = await Fs.promises.readFile(`${__dirname}/filechooser.test.js.map`);

    await agent.goto(`${koaServer.baseUrl}/get-upload-multi`);
    await agent.waitForPaintingStable();
    const input = await agent.document.querySelector('#sourcefiles');
    await agent.click(input);
    const chooser = await agent.waitForFileChooser();
    await chooser.chooseFiles(
      { data: file1, name: 'filechooser.test.js' },
      { data: file2, name: 'filechooser.test.js.map' },
    );

    await expect(input.files.length).resolves.toBe(2);
    const body = await input.files.item(0).arrayBuffer();

    expect(body).toStrictEqual(file1);
    await expect(input.files.item(0).type).resolves.toBe('text/javascript');

    await agent.click(agent.document.querySelector('input[type=submit]'));
    await didSubmit.promise;
  });
});
