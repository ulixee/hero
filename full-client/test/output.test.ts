import { Helpers } from '@ulixee/testing';
import { ITestKoaServer } from '@ulixee/testing/helpers';
import Core from '@ulixee/hero-core';
import SessionDb from '@ulixee/hero-core/dbs/SessionDb';
import GlobalPool from '@ulixee/hero-core/lib/GlobalPool';
import { Handler, Observable } from '../index';

let koaServer: ITestKoaServer;
let handler: Handler;
beforeAll(async () => {
  await Core.start();
  handler = new Handler({ host: await Core.server.address });
  Helpers.onClose(() => handler.close(), true);
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('Output tests', () => {
  test('records object changes', async () => {
    const hero = await openBrowser('/');
    const output = hero.output;
    output.started = new Date();
    const url = await hero.url;
    const title = await hero.document.title;
    output.page = {
      url,
      title,
    };
    output.page.data = Buffer.from('I am buffer');
    const sessionId = await hero.sessionId;
    await hero.close();

    const db = new SessionDb(GlobalPool.sessionsDir, sessionId, { readonly: true });
    const outputs = db.output.all();
    expect(outputs).toHaveLength(3);
    expect(outputs[0]).toEqual({
      type: 'insert',
      value: expect.any(String),
      timestamp: expect.any(Number),
      lastCommandId: expect.any(Number),
      path: '["started"]',
    });
    expect(outputs[1]).toEqual({
      type: 'insert',
      value: JSON.stringify({ url: `${koaServer.baseUrl}/`, title: 'Example Domain' }),
      timestamp: expect.any(Number),
      lastCommandId: 4,
      path: '["page"]',
    });
    expect(outputs[2]).toEqual({
      type: 'insert',
      value: JSON.stringify(Buffer.from('I am buffer').toString('base64')),
      timestamp: expect.any(Number),
      lastCommandId: 4,
      path: '["page","data"]',
    });
    expect(JSON.stringify(output)).toEqual(
      JSON.stringify({
        started: output.started,
        page: {
          url,
          title,
          data: Buffer.from('I am buffer').toString('base64'),
        },
      }),
    );
  });

  test('can add array-ish items to the main object', async () => {
    const hero = await openBrowser('/');
    const output = hero.output;
    const date = new Date();
    output.push({
      url: 'https://url.com',
      title: 'Page',
      date,
      buffer: Buffer.from('whatever'),
    });
    const sessionId = await hero.sessionId;
    await hero.close();

    const db = new SessionDb(GlobalPool.sessionsDir, sessionId, { readonly: true });
    const outputs = db.output.all();
    expect(outputs).toHaveLength(1);
    expect(outputs[0]).toEqual({
      type: 'insert',
      value: JSON.stringify({
        url: 'https://url.com',
        title: 'Page',
        date,
        buffer: Buffer.from('whatever').toString('base64'),
      }),
      timestamp: expect.any(Number),
      lastCommandId: 2,
      path: '[0]',
    });
    expect(JSON.stringify(output)).toEqual(
      JSON.stringify([
        {
          url: 'https://url.com',
          title: 'Page',
          date,
          buffer: Buffer.from('whatever').toString('base64'),
        },
      ]),
    );
  });

  test('can add observables directly', async () => {
    const hero = await openBrowser('/');
    const output = hero.output;
    const record = Observable({} as any);
    output.push(record);
    record.test = 1;
    record.watch = 2;
    record.any = { more: true };
    const sessionId = await hero.sessionId;
    await hero.close();

    const db = new SessionDb(GlobalPool.sessionsDir, sessionId, { readonly: true });
    const outputs = db.output.all();
    expect(outputs).toHaveLength(4);
    expect(outputs[0]).toEqual({
      type: 'insert',
      value: JSON.stringify({}),
      timestamp: expect.any(Number),
      lastCommandId: 2,
      path: '[0]',
    });
    expect(JSON.stringify(output)).toEqual(
      JSON.stringify([
        {
          test: 1,
          watch: 2,
          any: { more: true },
        },
      ]),
    );
  });

  test('can replace the main object', async () => {
    const hero = await openBrowser('/');
    hero.output.test = 'true';
    hero.output = {
      try: true,
      another: false,
    };
    const sessionId = await hero.sessionId;
    await hero.close();

    const db = new SessionDb(GlobalPool.sessionsDir, sessionId, { readonly: true });
    const outputs = db.output.all();
    expect(outputs).toHaveLength(4);
    expect(outputs[0]).toEqual({
      type: 'insert',
      value: JSON.stringify('true'),
      timestamp: expect.any(Number),
      lastCommandId: 2,
      path: '["test"]',
    });
    expect(outputs[1]).toEqual({
      type: 'delete',
      value: null,
      timestamp: expect.any(Number),
      lastCommandId: 2,
      path: '["test"]',
    });
    expect(outputs[2]).toEqual({
      type: 'insert',
      value: JSON.stringify(true),
      timestamp: expect.any(Number),
      lastCommandId: 2,
      path: '["try"]',
    });
    expect(JSON.stringify(hero.output)).toEqual(
      JSON.stringify({
        try: true,
        another: false,
      }),
    );
  });
});

async function openBrowser(path: string) {
  const hero = await handler.createHero();
  Helpers.needsClosing.push(hero);
  await hero.goto(`${koaServer.baseUrl}${path}`);
  await hero.waitForPaintingStable();
  return hero;
}
