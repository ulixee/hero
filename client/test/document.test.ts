// need to import this before the awaited stuff gets imported
import '../lib/SetupAwaitedHandler';

import { getState as getElementState } from 'awaited-dom/base/official-klasses/Element';
import IExecJsPathResult from '@ulixee/unblocked-specification/agent/browser/IExecJsPathResult';
import { getNodePointerFnName } from '@ulixee/unblocked-specification/agent/browser/IJsPathFunctions';
import { Helpers } from '@ulixee/hero-testing';
import Hero from '../index';
import MockConnectionToCore from './_MockConnectionToCore';

afterAll(Helpers.afterAll);

describe('document tests', () => {
  it('runs querySelector', async () => {
    const connectionToCore = new MockConnectionToCore(async payload => {
      const { command, args, messageId: responseId } = payload;
      await new Promise(resolve => setTimeout(resolve, 5));
      if (command === 'Core.createSession') {
        return {
          responseId,
          data: { tabId: 'tab-id', sessionId: 'session-id' },
        };
      }
      if (command === 'FrameEnvironment.execJsPath') {
        const [jsPath] = args as any;
        const lastPath = jsPath[jsPath.length - 1];
        if (lastPath && lastPath[0] === getNodePointerFnName) {
          return {
            responseId,
            data: {
              value: null,
              nodePointer: { id: 1 },
            } as IExecJsPathResult,
          };
        }
      }
      return {
        responseId,
        data: {},
      };
    });

    const hero = new Hero({ connectionToCore });
    Helpers.needsClosing.push(hero);

    const element = hero.document.querySelector('h1');
    const jsPath = getElementState(element).awaitedPath.toJSON();
    expect(jsPath[0]).toBe('document');
    expect(jsPath[1]).toMatchObject(['querySelector', 'h1']);

    const superElement = await element;
    await superElement.tagName;

    await hero.close();

    const outgoingCommands = connectionToCore.outgoingSpy.mock.calls;
    expect(outgoingCommands.map(x => x[0].command)).toMatchObject([
      'Core.connect',
      'Core.createSession',
      'FrameEnvironment.execJsPath',
      'FrameEnvironment.execJsPath',
      'Session.close',
    ]);
    expect(outgoingCommands[2][0].args).toMatchObject([[...jsPath, [getNodePointerFnName]]]);
    expect(outgoingCommands[3][0].args).toMatchObject([[1, 'tagName']]);
  });
});
