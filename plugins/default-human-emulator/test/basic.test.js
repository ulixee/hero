"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IInteractions_1 = require("@ulixee/unblocked-specification/agent/interact/IInteractions");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const rectUtils = require("@ulixee/unblocked-agent/lib/rectUtils");
const unblocked_agent_testing_1 = require("@ulixee/unblocked-agent-testing");
const index_1 = require("../index");
const { log } = (0, Logger_1.default)(module);
const logger = unblocked_agent_testing_1.TestLogger.forTest(module);
beforeEach(unblocked_agent_testing_1.Helpers.beforeEach);
beforeAll(() => {
    index_1.default.maxDelayBetweenInteractions = 0;
    index_1.default.maxScrollDelayMillis = 0;
});
describe('typing', () => {
    test('should spread out characters based on a wpm range', async () => {
        index_1.default.wordsPerMinuteRange = [34, 34];
        const humanEmulator = new index_1.default({
            logger,
        });
        const groups = [
            [
                {
                    command: IInteractions_1.InteractionCommand.type,
                    keyboardCommands: [{ string: 'Test typing sentence' }],
                },
            ],
        ];
        // @ts-ignore
        const millisPerCharacter = humanEmulator.calculateMillisPerChar(groups);
        expect(millisPerCharacter).toBe(353);
        let count = 0;
        let totalMillis = 0;
        await humanEmulator.playInteractions(groups, async (interactionStep) => {
            expect(interactionStep.keyboardKeyupDelay).toBeGreaterThanOrEqual(10);
            expect(interactionStep.keyboardKeyupDelay).toBeLessThanOrEqual(60);
            expect(interactionStep.keyboardDelayBetween).toBeGreaterThanOrEqual(353 - 60 - 353 / 2);
            totalMillis += interactionStep.keyboardDelayBetween + interactionStep.keyboardKeyupDelay;
            count += 1;
            return null;
        }, null);
        const chars = 'Test typing sentence'.length;
        expect(count).toBe(chars);
        const charsPerSecond = totalMillis / 1000 / chars;
        const charsPerMinute = 60 / charsPerSecond;
        const wpm = Math.round(charsPerMinute / 5);
        // should be close to 34 wpm
        expect(Math.abs(34 - wpm)).toBeLessThanOrEqual(10);
    });
});
describe('move', () => {
    test('should break a move into a series of moves', async () => {
        const humanEmulator = new index_1.default({
            logger: log,
        });
        const commands = [];
        // @ts-ignore
        await humanEmulator.scroll({
            command: 'move',
            mousePosition: [['document', 'querySelector', 'x']],
        }, async (step) => {
            commands.push(step);
        }, createInteractHelper({
            async lookupBoundingRect() {
                return {
                    elementTag: 'div',
                    height: 10,
                    width: 100,
                    x: 0,
                    y: 800,
                };
            },
        }));
        expect(commands.length).toBeGreaterThanOrEqual(2);
    });
});
describe('scroll', () => {
    test('should break a scroll into a curve', async () => {
        const humanEmulator = new index_1.default({ logger });
        const commands = [];
        // @ts-ignore
        await humanEmulator.scroll({
            command: 'scroll',
            mousePosition: [['document', 'querySelector', 'x']],
        }, async (step) => {
            commands.push(step);
        }, createInteractHelper({
            async lookupBoundingRect() {
                return {
                    elementTag: 'div',
                    height: 10,
                    width: 100,
                    x: 0,
                    y: 800,
                };
            },
        }));
        expect(commands.length).toBeGreaterThan(1);
    });
    test('should not scroll if over half in screen', async () => {
        const humanEmulator = new index_1.default({ logger });
        const commands = [];
        // @ts-ignore
        await humanEmulator.scroll({
            command: 'scroll',
            mousePosition: [['document', 'querySelector', 'x']],
        }, async (step) => {
            commands.push(step);
        }, createInteractHelper({
            async lookupBoundingRect() {
                return {
                    elementTag: 'div',
                    height: 200,
                    width: 100,
                    x: 50,
                    y: 499,
                };
            },
        }));
        expect(commands).toHaveLength(0);
    });
    test('should not exceed max pixels per scroll', async () => {
        const humanEmulator = new index_1.default({ logger });
        const commands = [];
        // @ts-ignore
        await humanEmulator.scroll({
            command: 'scroll',
            mousePosition: [['document', 'querySelector', 'x']],
        }, async (step) => {
            commands.push(step);
        }, createInteractHelper({
            async lookupBoundingRect() {
                return {
                    elementTag: 'div',
                    height: 200,
                    width: 100,
                    x: 50,
                    y: 50000,
                };
            },
        }));
        expect(commands.length).toBeGreaterThan(2);
        const scrolls = commands.filter((x) => x.command === 'scroll');
        for (let i = 0; i < scrolls.length; i += 1) {
            const current = scrolls[i];
            const next = scrolls[i + 1];
            if (current && next) {
                const diff = Math.round(Math.abs(next.mousePosition[1] - current.mousePosition[1]));
                expect(diff).toBeLessThanOrEqual(500);
            }
        }
    });
});
function createInteractHelper(extras) {
    return {
        mousePosition: { x: 25, y: 25 },
        viewportSize: {
            height: 600,
            width: 800,
        },
        async lookupBoundingRect() {
            return {
                elementTag: 'div',
                height: 200,
                width: 100,
                x: 50,
                y: 50000,
            };
        },
        doesBrowserAnimateScrolling: true,
        scrollOffset: Promise.resolve({ x: 0, y: 0 }),
        logger,
        createMousedownTrigger() {
            return Promise.resolve({
                nodeVisibility: { isVisible: true, isClickable: true },
                didTrigger: () => Promise.resolve({ didClickLocation: true }),
            });
        },
        reloadJsPath: () => Promise.resolve(null),
        ...rectUtils,
        ...extras,
    };
}
//# sourceMappingURL=basic.test.js.map