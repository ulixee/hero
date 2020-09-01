// need to import this before the awaited stuff gets imported
import '../lib/SetupAwaitedHandler';

import { getState as getElementState } from 'awaited-dom/base/official-klasses/Element';
import IExecJsPathResult from '@secret-agent/core/interfaces/IExecJsPathResult';
import getAttachedStateFnName from '@secret-agent/core-interfaces/getAttachedStateFnName';
import { Helpers } from '@secret-agent/testing';
import { SecretAgentClientGenerator } from '../index';

afterAll(Helpers.afterAll);

describe('document tests', () => {
  it('runs querySelector', async () => {
    const { SecretAgent, coreClient } = SecretAgentClientGenerator();

    coreClient.pipeOutgoingCommand = jest.fn<any, any>(async (_, command: string, args) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (command === 'createTab') {
        return {
          data: { tabId: 'tab-id', sessionId: 'session-id', sessionsDataLocation: '' },
        };
      }
      if (command === 'execJsPath') {
        const [jsPath] = args;
        const lastPath = jsPath[jsPath.length - 1];
        if (lastPath && lastPath[0] === getAttachedStateFnName) {
          return {
            data: {
              value: null,
              attachedState: { id: 1 },
            } as IExecJsPathResult,
          };
        }
      }
    });

    const browser = await SecretAgent.createBrowser();
    Helpers.needsClosing.push(browser);

    const element = browser.document.querySelector('h1');
    const jsPath = getElementState(element).awaitedPath.toJSON();
    expect(jsPath[0]).toBe('document');
    expect(jsPath[1]).toMatchObject(['querySelector', 'h1']);

    const superElement = await element;
    await superElement.tagName;

    await browser.close();
    await SecretAgent.shutdown();

    const outgoingCommands = (coreClient.pipeOutgoingCommand as any).mock.calls;
    expect(outgoingCommands).toMatchObject([
      [null, 'createTab', expect.any(Array)],
      [expect.any(Object), 'execJsPath', [[...jsPath, [getAttachedStateFnName, undefined]]]],
      [expect.any(Object), 'execJsPath', [[1, 'tagName']]],
      [expect.any(Object), 'close', []],
      [null, 'disconnect', [['tab-id'], undefined]],
    ]);
    expect(browser.sessionId).toBe('session-id');
  });
});
