"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hero_testing_1 = require("@ulixee/hero-testing");
let koaServer;
beforeAll(async () => {
    koaServer = await hero_testing_1.Helpers.runKoaServer();
});
afterAll(hero_testing_1.Helpers.afterAll);
afterEach(hero_testing_1.Helpers.afterEach);
describe('Fetch tests', () => {
    it('should be able to fetch from top level', async () => {
        const hero = new hero_testing_1.Hero();
        hero_testing_1.Helpers.needsClosing.push(hero);
        await expect(hero.fetch('https://ulixee.org')).rejects.toThrow('need to use a "goto"');
    });
    it('should be able to run a fetch from the browser', async () => {
        koaServer.get('/fetch', ctx => {
            ctx.body = { got: 'it' };
        });
        const hero = new hero_testing_1.Hero();
        hero_testing_1.Helpers.needsClosing.push(hero);
        await hero.goto(`${koaServer.baseUrl}/`);
        await hero.waitForPaintingStable();
        const result = await hero.fetch('/fetch');
        const json = await result.json();
        expect(json).toStrictEqual({ got: 'it' });
    });
    it('should be able to do an http post', async () => {
        let posted;
        koaServer.post('/post', async (ctx) => {
            let body = '';
            for await (const chunk of ctx.req) {
                body += chunk.toString();
            }
            posted = body;
            ctx.body = { got: '2' };
        });
        const hero = new hero_testing_1.Hero();
        await hero.goto(`${koaServer.baseUrl}/`);
        await hero.waitForPaintingStable();
        const response = await hero.fetch(`${koaServer.baseUrl}/post`, {
            method: 'post',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sent: 'it' }),
        });
        expect(await response.json()).toStrictEqual({ got: '2' });
        expect(posted).toStrictEqual(JSON.stringify({ sent: 'it' }));
    });
    it('should be able to create a request object', async () => {
        let header1;
        koaServer.get('/request', ctx => {
            header1 = ctx.headers.header1;
            ctx.body = { got: 'request' };
        });
        const hero = new hero_testing_1.Hero();
        await hero.goto(`${koaServer.baseUrl}/`);
        await hero.waitForPaintingStable();
        const { Request, fetch } = hero;
        const request = new Request(`${koaServer.baseUrl}/request`, {
            headers: {
                header1: 'sent',
            },
        });
        const response = await fetch(request);
        expect(await response.json()).toStrictEqual({ got: 'request' });
        expect(header1).toBe('sent');
    });
    it('should be able to get a byte array back', async () => {
        koaServer.get('/buffer', ctx => {
            ctx.body = Buffer.from('This is a test');
        });
        const hero = new hero_testing_1.Hero();
        await hero.goto(`${koaServer.baseUrl}/`);
        await hero.waitForPaintingStable();
        const response = await hero.fetch(`${koaServer.baseUrl}/buffer`);
        const buff = await response.arrayBuffer();
        expect(Buffer.from(buff)).toStrictEqual(Buffer.from('This is a test'));
    });
    it.todo('should be able to get a blob back');
});
//# sourceMappingURL=fetch.test.js.map