"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// need to import this before the awaited stuff gets imported
require("../lib/SetupAwaitedHandler");
const Element_1 = require("@ulixee/awaited-dom/base/official-klasses/Element");
const IJsPathFunctions_1 = require("@ulixee/unblocked-specification/agent/browser/IJsPathFunctions");
const hero_testing_1 = require("@ulixee/hero-testing");
const index_1 = require("../index");
const _MockConnectionToCore_1 = require("./_MockConnectionToCore");
afterAll(hero_testing_1.Helpers.afterAll);
describe('document tests', () => {
    it('runs querySelector', async () => {
        const connectionToCore = new _MockConnectionToCore_1.default(async (payload) => {
            const { command, args, messageId: responseId } = payload;
            await new Promise(resolve => setTimeout(resolve, 5));
            if (command === 'Core.createSession') {
                return {
                    responseId,
                    data: { tabId: 'tab-id', sessionId: 'session-id' },
                };
            }
            if (command === 'FrameEnvironment.execJsPath') {
                const [jsPath] = args;
                const lastPath = jsPath[jsPath.length - 1];
                if (lastPath && lastPath[0] === IJsPathFunctions_1.getNodePointerFnName) {
                    return {
                        responseId,
                        data: {
                            value: null,
                            nodePointer: { id: 1 },
                        },
                    };
                }
            }
            return {
                responseId,
                data: {},
            };
        });
        const hero = new index_1.default({ connectionToCore });
        hero_testing_1.Helpers.needsClosing.push(hero);
        const element = hero.document.querySelector('h1');
        const jsPath = (0, Element_1.getState)(element).awaitedPath.toJSON();
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
        expect(outgoingCommands[2][0].args).toMatchObject([[...jsPath, [IJsPathFunctions_1.getNodePointerFnName]]]);
        expect(outgoingCommands[3][0].args).toMatchObject([[1, 'tagName']]);
    });
});
//# sourceMappingURL=document.test.js.map