import { SecretAgentClientGenerator } from '../index';
import IResourceMeta from '@secret-agent/core-interfaces/IResourceMeta';

describe('waitForResource', () => {
  it('should break after finding one resource', async () => {
    const { SecretAgent, coreClient } = SecretAgentClientGenerator();

    coreClient.pipeOutgoingCommand = jest.fn<any, any>(async (_, command: string) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (command === 'waitForResource') {
        return { data: [{ id: 1, url: '/test.js' } as IResourceMeta] };
      }
      if (command === 'createSession') {
        return {
          data: { windowId: 'window-id', sessionId: 'session-id', sessionsDataLocation: '' },
        };
      }
    });

    const browser = await SecretAgent.createBrowser();
    const resources = await browser.waitForResource({ url: '/test.js' });
    expect(resources).toHaveLength(1);
    await browser.close();
    await SecretAgent.shutdown();
  });

  it('should try more than once to get files', async () => {
    const { SecretAgent, coreClient } = SecretAgentClientGenerator();

    let attempts = 0;

    coreClient.pipeOutgoingCommand = jest.fn<any, any>(async (_, command: string) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (command === 'waitForResource') {
        attempts += 1;
        if (attempts === 3) {
          return { data: [{ id: 1, url: '/test2.js' } as IResourceMeta] };
        }
        return { data: [] };
      }
      if (command === 'createSession') {
        return {
          data: { windowId: 'window-id', sessionId: 'session-id', sessionsDataLocation: '' },
        };
      }
    });

    const browser = await SecretAgent.createBrowser();
    const resources = await browser.waitForResource({ url: '/test2.js' });
    expect(resources).toHaveLength(1);
    expect(attempts).toBe(3);

    await browser.close();
    await SecretAgent.shutdown();
  });

  it('should return multiple files if many match on one round trip', async () => {
    const { SecretAgent, coreClient } = SecretAgentClientGenerator();

    coreClient.pipeOutgoingCommand = jest.fn<any, any>(async (_, command: string) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (command === 'waitForResource') {
        return {
          data: [
            { id: 1, url: '/test3.js', type: 'Xhr' } as IResourceMeta,
            { id: 2, url: '/test4.js', type: 'Xhr' } as IResourceMeta,
          ],
        };
      }
      if (command === 'createSession') {
        return {
          data: { windowId: 'window-id', sessionId: 'session-id', sessionsDataLocation: '' },
        };
      }
    });

    const browser = await SecretAgent.createBrowser();
    const resources = await browser.waitForResource({ type: 'Xhr' });
    expect(resources).toHaveLength(2);

    await browser.close();
    await SecretAgent.shutdown();
  });

  it('should return multiple files if many match on one round trip', async () => {
    const { SecretAgent, coreClient } = SecretAgentClientGenerator();

    coreClient.pipeOutgoingCommand = jest.fn<any, any>(async (_, command: string) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (command === 'waitForResource') {
        return {
          data: [
            { id: 1, url: '/test3.js' } as IResourceMeta,
            { id: 2, url: '/test4.js' } as IResourceMeta,
          ],
        };
      }
      if (command === 'createSession') {
        return {
          data: { windowId: 'window-id', sessionId: 'session-id', sessionsDataLocation: '' },
        };
      }
    });

    const browser = await SecretAgent.createBrowser();
    const resources = await browser.waitForResource({ url: '/test3.js' });
    expect(resources).toHaveLength(2);

    await browser.close();
    await SecretAgent.shutdown();
  });

  it('should allow a user to specify a match function', async () => {
    const { SecretAgent, coreClient } = SecretAgentClientGenerator();

    coreClient.pipeOutgoingCommand = jest.fn<any, any>(async (_, command: string) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (command === 'waitForResource') {
        return {
          data: [
            { id: 1, url: '/test1.js' } as IResourceMeta,
            { id: 2, url: '/test2.js' } as IResourceMeta,
            { id: 3, url: '/test3.js' } as IResourceMeta,
            { id: 4, url: '/test4.js' } as IResourceMeta,
          ],
        };
      }
      if (command === 'createSession') {
        return {
          data: { windowId: 'window-id', sessionId: 'session-id', sessionsDataLocation: '' },
        };
      }
    });

    const browser = await SecretAgent.createBrowser();
    const resources = await browser.waitForResource({
      filterFn(resource, done) {
        if (resource.url === '/test1.js') {
          done();
          return true;
        }
      },
    });
    expect(resources).toHaveLength(1);
    expect(resources[0].url).toBe('/test1.js');

    await browser.close();
    await SecretAgent.shutdown();
  });

  it('should run multiple batches when a match function is provided', async () => {
    const { SecretAgent, coreClient } = SecretAgentClientGenerator();

    let counter = 0;
    coreClient.pipeOutgoingCommand = jest.fn<any, any>(async (_, command: string) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (command === 'waitForResource') {
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
      if (command === 'createSession') {
        return {
          data: { windowId: 'window-id', sessionId: 'session-id', sessionsDataLocation: '' },
        };
      }
    });

    const browser = await SecretAgent.createBrowser();
    const resources = await browser.waitForResource({
      filterFn(resource, done) {
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

    await browser.close();
    await SecretAgent.shutdown();
  });
});
