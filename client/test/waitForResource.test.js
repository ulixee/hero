"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("@ulixee/hero-testing/index");
const index_2 = require("../index");
const _MockConnectionToCore_1 = require("./_MockConnectionToCore");
let payloadHandler = () => null;
function createConnection() {
    return new _MockConnectionToCore_1.default(payload => {
        const { command, messageId: responseId } = payload;
        const response = payloadHandler(payload);
        if (response)
            return { responseId, ...response };
        if (command === 'Core.createSession') {
            return {
                responseId,
                data: { tabId: 'tab-id', sessionId: 'session-id' },
            };
        }
        if (command === 'Events.addEventListener') {
            return { responseId, data: { listenerId: 1 } };
        }
        return {
            responseId,
            data: {},
        };
    });
}
beforeAll(() => { });
afterEach(index_1.Helpers.afterEach);
afterAll(index_1.Helpers.afterAll);
describe('waitForResource', () => {
    it('should break after finding one resource', async () => {
        payloadHandler = ({ command }) => {
            if (command === 'Tab.waitForResources') {
                return { data: [{ id: 1, url: '/test.js' }] };
            }
        };
        const hero = new index_2.default({ connectionToCore: createConnection() });
        index_1.Helpers.needsClosing.push(hero);
        const resources = await hero.waitForResources({ url: '/test.js' });
        expect(resources).toHaveLength(1);
        await hero.close();
    });
    it('should try more than once to get files', async () => {
        let attempts = 0;
        payloadHandler = ({ command }) => {
            if (command === 'Tab.waitForResources') {
                attempts += 1;
                if (attempts === 3) {
                    return { data: [{ id: 1, url: '/test2.js' }] };
                }
                return { data: [] };
            }
        };
        const hero = new index_2.default({ connectionToCore: createConnection() });
        index_1.Helpers.needsClosing.push(hero);
        const resources = await hero.waitForResources({ url: '/test2.js' });
        expect(resources).toHaveLength(1);
        expect(attempts).toBe(3);
        await hero.close();
    });
    it('should return multiple files if many match on one round trip', async () => {
        payloadHandler = ({ command }) => {
            if (command === 'Tab.waitForResources') {
                return {
                    data: [
                        { id: 1, url: '/test3.js', type: 'XHR' },
                        { id: 2, url: '/test4.js', type: 'XHR' },
                    ],
                };
            }
        };
        const hero = new index_2.default({ connectionToCore: createConnection() });
        index_1.Helpers.needsClosing.push(hero);
        const resources = await hero.waitForResources({ type: 'XHR' });
        expect(resources).toHaveLength(2);
        await hero.close();
    });
    it('should match multiple files by url', async () => {
        payloadHandler = ({ command }) => {
            if (command === 'Tab.waitForResources') {
                return {
                    data: [
                        { id: 1, url: '/test3.js' },
                        { id: 2, url: '/test4.js' },
                    ],
                };
            }
        };
        const hero = new index_2.default({ connectionToCore: createConnection() });
        index_1.Helpers.needsClosing.push(hero);
        const resources = await hero.waitForResources({ url: '/test3.js' });
        expect(resources).toHaveLength(2);
        await hero.close();
    });
    it('should allow a user to specify a match function', async () => {
        payloadHandler = ({ command }) => {
            if (command === 'Tab.waitForResources') {
                return {
                    data: [
                        { id: 1, url: '/test1.js' },
                        { id: 2, url: '/test2.js' },
                        { id: 3, url: '/test3.js' },
                        { id: 4, url: '/test4.js' },
                    ],
                };
            }
        };
        const hero = new index_2.default({ connectionToCore: createConnection() });
        index_1.Helpers.needsClosing.push(hero);
        const resource = await hero.waitForResource({
            filterFn: x => x.url === '/test1.js',
        });
        expect(resource.url).toBe('/test1.js');
        await hero.close();
    });
    it('should run multiple batches when a match function is provided', async () => {
        let counter = 0;
        payloadHandler = ({ command }) => {
            if (command === 'Tab.waitForResources') {
                counter += 1;
                if (counter === 1) {
                    return {
                        data: [
                            { id: 1, url: '/test1.js' },
                            { id: 2, url: '/test2.js' },
                            { id: 3, url: '/test3.js' },
                            { id: 4, url: '/test4.js' },
                        ],
                    };
                }
                if (counter === 2 || counter === 3) {
                    return { data: [] };
                }
                if (counter === 4) {
                    return { data: [{ id: 5, url: '/test5.js' }] };
                }
            }
        };
        const hero = new index_2.default({ connectionToCore: createConnection() });
        index_1.Helpers.needsClosing.push(hero);
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
//# sourceMappingURL=waitForResource.test.js.map