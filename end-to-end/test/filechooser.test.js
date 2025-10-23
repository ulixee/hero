"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hero_testing_1 = require("@ulixee/hero-testing");
const utils_1 = require("@ulixee/commons/lib/utils");
const Fs = require("fs");
let koaServer;
beforeAll(async () => {
    koaServer = await hero_testing_1.Helpers.runKoaServer();
});
afterAll(hero_testing_1.Helpers.afterAll);
afterEach(hero_testing_1.Helpers.afterEach);
describe('Filechooser tests', () => {
    it('can upload a file', async () => {
        const didSubmit = (0, utils_1.createPromise)();
        koaServer.post('/upload', koaServer.upload.single('file'), ctx => {
            ctx.body = 'Ok';
            expect(ctx.file).toBeTruthy();
            expect(ctx.file.originalname).toBe('test.js');
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
        const hero = new hero_testing_1.Hero();
        hero_testing_1.Helpers.needsClosing.push(hero);
        await hero.goto(`${koaServer.baseUrl}/get-upload`);
        await hero.waitForPaintingStable();
        const input = await hero.document.querySelector('#files');
        await hero.click(input);
        const chooser = await hero.waitForFileChooser();
        const buffer = await Fs.promises.readFile(`${__dirname}/html/test.js`);
        await chooser.chooseFiles({ data: buffer, name: 'test.js' });
        await expect(input.files.length).resolves.toBe(1);
        const body = await input.files.item(0).text();
        const actualText = await Fs.promises.readFile(`${__dirname}/html/test.js`, 'utf8');
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
        const hero = new hero_testing_1.Hero({
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
        hero_testing_1.Helpers.needsClosing.push(hero);
        await hero.goto(`${koaServer.baseUrl}/get-upload-profile`);
        await hero.waitForPaintingStable();
        const input = await hero.document.querySelector('#files');
        await hero.click(input);
        const chooser = await hero.waitForFileChooser();
        expect(chooser).toBeTruthy();
    });
    it('can upload multiple files', async () => {
        const didSubmit = (0, utils_1.createPromise)();
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
        const hero = new hero_testing_1.Hero();
        hero_testing_1.Helpers.needsClosing.push(hero);
        const file1 = await Fs.promises.readFile(`${__dirname}/filechooser.test.js`);
        const file2 = await Fs.promises.readFile(`${__dirname}/filechooser.test.js.map`);
        await hero.goto(`${koaServer.baseUrl}/get-upload-multi`);
        await hero.waitForPaintingStable();
        const input = await hero.document.querySelector('#sourcefiles');
        await hero.click(input);
        const chooser = await hero.waitForFileChooser();
        await chooser.chooseFiles({ data: file1, name: 'filechooser.test.js' }, { data: file2, name: 'filechooser.test.js.map' });
        await expect(input.files.length).resolves.toBe(2);
        const body = await input.files.item(0).arrayBuffer();
        expect(body).toStrictEqual(file1);
        await expect(input.files.item(0).type).resolves.toBe('text/javascript');
        await hero.click(hero.document.querySelector('input[type=submit]'));
        await didSubmit.promise;
    });
});
//# sourceMappingURL=filechooser.test.js.map