import IResourceMeta from '@bureau/interfaces/IResourceMeta';
import { Helpers } from '@ulixee/hero-testing/index';
import ICoreRequestPayload from '@ulixee/hero-interfaces/ICoreRequestPayload';
import ICoreResponsePayload from '@ulixee/hero-interfaces/ICoreResponsePayload';
import Hero from '../index';
import ConnectionToCore from '../connections/ConnectionToCore';

let payloadHandler: (payload: ICoreRequestPayload) => ICoreResponsePayload = () => null;
const outgoing = jest.fn(async (payload: ICoreRequestPayload): Promise<ICoreResponsePayload> => {
  const { command } = payload;
  const response = payloadHandler(payload);
  if (response) return response;
  if (command === 'Core.createSession') {
    return {
      data: { tabId: 'tab-id', sessionId: 'session-id' },
    };
  }
  if (command === 'Events.addEventListener') {
    return {
      data: { listenerId: 1 },
    };
  }
});
class Piper extends ConnectionToCore {
  async internalSendRequest(payload: ICoreRequestPayload): Promise<void> {
    const responsePayload = await outgoing(payload);
    const response = <ICoreResponsePayload>{
      responseId: payload.messageId,
      ...(responsePayload ?? {}),
    };
    this.onMessage(response);
  }

  protected createConnection = () => Promise.resolve(null);
  protected destroyConnection = () => Promise.resolve(null);
}

beforeAll(() => {});

afterEach(Helpers.afterEach);
afterAll(Helpers.afterAll);

describe('waitForResource', () => {
  it('should break after finding one resource', async () => {
    payloadHandler = ({ command }: ICoreRequestPayload): ICoreResponsePayload => {
      if (command === 'Tab.waitForResources') {
        return { data: [{ id: 1, url: '/test.js' } as IResourceMeta] };
      }
    };

    const hero = new Hero({ connectionToCore: new Piper() });
    Helpers.needsClosing.push(hero);
    const resources = await hero.waitForResources({ url: '/test.js' });
    expect(resources).toHaveLength(1);
    await hero.close();
  });

  it('should try more than once to get files', async () => {
    let attempts = 0;
    payloadHandler = ({ command }: ICoreRequestPayload): ICoreResponsePayload => {
      if (command === 'Tab.waitForResources') {
        attempts += 1;
        if (attempts === 3) {
          return { data: [{ id: 1, url: '/test2.js' } as IResourceMeta] };
        }
        return { data: [] };
      }
    };

    const hero = new Hero({ connectionToCore: new Piper() });
    Helpers.needsClosing.push(hero);
    const resources = await hero.waitForResources({ url: '/test2.js' });
    expect(resources).toHaveLength(1);
    expect(attempts).toBe(3);

    await hero.close();
  });

  it('should return multiple files if many match on one round trip', async () => {
    payloadHandler = ({ command }: ICoreRequestPayload): ICoreResponsePayload => {
      if (command === 'Tab.waitForResources') {
        return {
          data: [
            { id: 1, url: '/test3.js', type: 'XHR' } as IResourceMeta,
            { id: 2, url: '/test4.js', type: 'XHR' } as IResourceMeta,
          ],
        };
      }
    };

    const hero = new Hero({ connectionToCore: new Piper() });
    Helpers.needsClosing.push(hero);
    const resources = await hero.waitForResources({ type: 'XHR' });
    expect(resources).toHaveLength(2);

    await hero.close();
  });

  it('should match multiple files by url', async () => {
    payloadHandler = ({ command }: ICoreRequestPayload): ICoreResponsePayload => {
      if (command === 'Tab.waitForResources') {
        return {
          data: [
            { id: 1, url: '/test3.js' } as IResourceMeta,
            { id: 2, url: '/test4.js' } as IResourceMeta,
          ],
        };
      }
    };

    const hero = new Hero({ connectionToCore: new Piper() });
    Helpers.needsClosing.push(hero);
    const resources = await hero.waitForResources({ url: '/test3.js' });
    expect(resources).toHaveLength(2);

    await hero.close();
  });

  it('should allow a user to specify a match function', async () => {
    payloadHandler = ({ command }: ICoreRequestPayload): ICoreResponsePayload => {
      if (command === 'Tab.waitForResources') {
        return {
          data: [
            { id: 1, url: '/test1.js' } as IResourceMeta,
            { id: 2, url: '/test2.js' } as IResourceMeta,
            { id: 3, url: '/test3.js' } as IResourceMeta,
            { id: 4, url: '/test4.js' } as IResourceMeta,
          ],
        };
      }
    };

    const hero = new Hero({ connectionToCore: new Piper() });
    Helpers.needsClosing.push(hero);
    const resource = await hero.waitForResource({
      filterFn: x => x.url === '/test1.js',
    });
    expect(resource.url).toBe('/test1.js');

    await hero.close();
  });

  it('should run multiple batches when a match function is provided', async () => {
    let counter = 0;
    payloadHandler = ({ command }: ICoreRequestPayload): ICoreResponsePayload => {
      if (command === 'Tab.waitForResources') {
        counter += 1;
        if (counter === 1) {
          return {
            data: [
              { id: 1, url: '/test1.js' } as IResourceMeta,
              { id: 2, url: '/test2.js' } as IResourceMeta,
              { id: 3, url: '/test3.js' } as IResourceMeta,
              { id: 4, url: '/test4.js' } as IResourceMeta,
            ],
          };
        }
        if (counter === 2 || counter === 3) {
          return { data: [] };
        }
        if (counter === 4) {
          return { data: [{ id: 5, url: '/test5.js' } as IResourceMeta] };
        }
      }
    };

    const hero = new Hero({ connectionToCore: new Piper() });
    Helpers.needsClosing.push(hero);
    let calls = 0;
    const resources = await hero.waitForResources({
      filterFn(resource, done) {
        calls += 1;
        if (resource.url === '/test5.js') {
          done();
        }
        if (resource.url === '/test2.js') {
          return false;
        }
        return true;
      },
    });
    expect(resources).toHaveLength(4);
    expect(calls).toBe(5);

    await hero.close();
  });
});
