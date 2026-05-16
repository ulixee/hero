"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IInteractions_1 = require("@ulixee/unblocked-specification/agent/interact/IInteractions");
const StateMachine_1 = require("@ulixee/awaited-dom/base/StateMachine");
const IInteractions_2 = require("../interfaces/IInteractions");
const SetupAwaitedHandler_1 = require("./SetupAwaitedHandler");
const { getState } = (0, StateMachine_1.default)();
const COMMAND_POS = {
    waitForMillis: 2,
    click: 3,
    doubleclick: 4,
    clickDown: 5,
    scroll: 6,
    move: 7,
    clickUp: 8,
    keyPress: 9,
    keyDown: 10,
    type: 11,
    keyUp: 12,
};
const MAX_COMMAND_POS = Object.keys(COMMAND_POS).length;
class Interactor {
    static async run(coreFrame, interactions) {
        const interactionGroups = convertToInteractionGroups(interactions);
        await coreFrame.interact(interactionGroups);
    }
}
exports.default = Interactor;
function convertToInteractionGroups(interactions) {
    let lastPosition = [0, 0];
    const interactionGroups = [];
    interactions.forEach(interaction => {
        if (typeof interaction === 'string') {
            const interactionStep = convertCommandToInteractionStep(interaction);
            interactionStep.mousePosition = lastPosition;
            interactionGroups.push([interactionStep]);
        }
        else {
            const interactionGroup = convertInteractionToInteractionGroup(interaction);
            lastPosition = interactionGroup[interactionGroup.length - 1].mousePosition;
            interactionGroups.push(interactionGroup);
        }
    });
    return interactionGroups;
}
function convertToCoreMousePosition(mousePosition) {
    if ((0, IInteractions_1.isMousePositionXY)(mousePosition)) {
        return { mousePosition: mousePosition };
    }
    let verification;
    let element;
    if ((0, SetupAwaitedHandler_1.isAwaitedNode)(mousePosition.element)) {
        mousePosition = mousePosition;
        verification = mousePosition.verification;
        element = mousePosition.element;
    }
    else {
        element = mousePosition;
    }
    const { awaitedPath } = getState(element);
    if (!awaitedPath)
        throw new Error(`Element not found`);
    return {
        mousePosition: awaitedPath.toJSON(),
        verification,
    };
}
function convertInteractionToInteractionGroup(interaction) {
    const iGroup = [];
    Object.entries(interaction).forEach(([key, value]) => {
        switch (key) {
            case IInteractions_2.Command.scroll: {
                const command = IInteractions_1.InteractionCommand.scroll;
                const mousePosition = convertToCoreMousePosition(value);
                return iGroup.push({ command, ...mousePosition });
            }
            case IInteractions_2.Command.move: {
                const command = IInteractions_1.InteractionCommand.move;
                const mousePosition = convertToCoreMousePosition(value);
                return iGroup.push({ command, ...mousePosition });
            }
            case IInteractions_2.Command.click: {
                const command = IInteractions_1.InteractionCommand.click;
                const mousePosition = convertToCoreMousePosition(value);
                return iGroup.push({ command, ...mousePosition });
            }
            case IInteractions_2.Command.clickLeft: {
                const command = IInteractions_1.InteractionCommand.click;
                const mousePosition = convertToCoreMousePosition(value);
                return iGroup.push({ command, ...mousePosition, mouseButton: IInteractions_1.MouseButton.left });
            }
            case IInteractions_2.Command.clickMiddle: {
                const command = IInteractions_1.InteractionCommand.click;
                const mousePosition = convertToCoreMousePosition(value);
                return iGroup.push({ command, ...mousePosition, mouseButton: IInteractions_1.MouseButton.middle });
            }
            case IInteractions_2.Command.clickRight: {
                const command = IInteractions_1.InteractionCommand.click;
                const mousePosition = convertToCoreMousePosition(value);
                return iGroup.push({ command, ...mousePosition, mouseButton: IInteractions_1.MouseButton.right });
            }
            case IInteractions_2.Command.clickUp: {
                const command = IInteractions_1.InteractionCommand.clickUp;
                const mousePosition = convertToCoreMousePosition(value);
                return iGroup.push({ command, ...mousePosition });
            }
            case IInteractions_2.Command.clickUpLeft: {
                const command = IInteractions_1.InteractionCommand.clickUp;
                const mousePosition = convertToCoreMousePosition(value);
                return iGroup.push({ command, ...mousePosition, mouseButton: IInteractions_1.MouseButton.left });
            }
            case IInteractions_2.Command.clickUpMiddle: {
                const command = IInteractions_1.InteractionCommand.clickUp;
                const mousePosition = convertToCoreMousePosition(value);
                return iGroup.push({ command, ...mousePosition, mouseButton: IInteractions_1.MouseButton.middle });
            }
            case IInteractions_2.Command.clickUpRight: {
                const command = IInteractions_1.InteractionCommand.clickUp;
                const mousePosition = convertToCoreMousePosition(value);
                return iGroup.push({ command, ...mousePosition, mouseButton: IInteractions_1.MouseButton.right });
            }
            case IInteractions_2.Command.clickDown: {
                const command = IInteractions_1.InteractionCommand.clickDown;
                const mousePosition = convertToCoreMousePosition(value);
                return iGroup.push({ command, ...mousePosition });
            }
            case IInteractions_2.Command.clickDownLeft: {
                const command = IInteractions_1.InteractionCommand.clickDown;
                const mousePosition = convertToCoreMousePosition(value);
                return iGroup.push({ command, ...mousePosition, mouseButton: IInteractions_1.MouseButton.left });
            }
            case IInteractions_2.Command.clickDownMiddle: {
                const command = IInteractions_1.InteractionCommand.clickDown;
                const mousePosition = convertToCoreMousePosition(value);
                return iGroup.push({ command, ...mousePosition, mouseButton: IInteractions_1.MouseButton.middle });
            }
            case IInteractions_2.Command.clickDownRight: {
                const command = IInteractions_1.InteractionCommand.clickDown;
                const mousePosition = convertToCoreMousePosition(value);
                return iGroup.push({ command, ...mousePosition, mouseButton: IInteractions_1.MouseButton.right });
            }
            case IInteractions_2.Command.doubleclick: {
                const command = IInteractions_1.InteractionCommand.doubleclick;
                const mousePosition = convertToCoreMousePosition(value);
                return iGroup.push({ command, ...mousePosition });
            }
            case IInteractions_2.Command.doubleclickLeft: {
                const command = IInteractions_1.InteractionCommand.doubleclick;
                const mousePosition = convertToCoreMousePosition(value);
                return iGroup.push({ command, ...mousePosition, mouseButton: IInteractions_1.MouseButton.left });
            }
            case IInteractions_2.Command.doubleclickMiddle: {
                const command = IInteractions_1.InteractionCommand.doubleclick;
                const mousePosition = convertToCoreMousePosition(value);
                return iGroup.push({ command, ...mousePosition, mouseButton: IInteractions_1.MouseButton.middle });
            }
            case IInteractions_2.Command.doubleclickRight: {
                const command = IInteractions_1.InteractionCommand.doubleclick;
                const mousePosition = convertToCoreMousePosition(value);
                return iGroup.push({ command, ...mousePosition, mouseButton: IInteractions_1.MouseButton.right });
            }
            case IInteractions_2.Command.keyPress: {
                const command = IInteractions_1.InteractionCommand.type;
                return iGroup.push({ command, keyboardCommands: [{ keyCode: value }] });
            }
            case IInteractions_2.Command.keyDown: {
                const command = IInteractions_1.InteractionCommand.type;
                return iGroup.push({ command, keyboardCommands: [{ down: value }] });
            }
            case IInteractions_2.Command.keyShortcut: {
                const command = IInteractions_1.InteractionCommand.type;
                return iGroup.push({
                    command,
                    keyboardCommands: [{ shortcut: value }],
                });
            }
            case IInteractions_2.Command.keyUp: {
                const command = IInteractions_1.InteractionCommand.type;
                return iGroup.push({ command, keyboardCommands: [{ up: value }] });
            }
            case IInteractions_2.Command.type: {
                const command = IInteractions_1.InteractionCommand.type;
                const keyboardCommands = [];
                if (typeof value === 'string') {
                    keyboardCommands.push({ string: value });
                }
                else if (typeof value === 'number') {
                    keyboardCommands.push({ keyCode: value });
                }
                return iGroup.push({ command, keyboardCommands });
            }
            case IInteractions_2.Command.waitForMillis: {
                const command = IInteractions_1.InteractionCommand.waitForMillis;
                return iGroup.push({ command, delayMillis: value });
            }
        }
    });
    const sortedIGroup = iGroup.sort((a, b) => {
        const aPos = COMMAND_POS[a.command] || MAX_COMMAND_POS;
        const bPos = COMMAND_POS[b.command] || MAX_COMMAND_POS;
        if (aPos < bPos) {
            return -1;
        }
        if (aPos > bPos) {
            return 1;
        }
        return 0;
    });
    return sortedIGroup;
}
function convertCommandToInteractionStep(interaction) {
    switch (interaction) {
        case IInteractions_2.Command.move: {
            return { command: IInteractions_1.InteractionCommand.move };
            break;
        }
        case IInteractions_2.Command.scroll: {
            return { command: IInteractions_1.InteractionCommand.scroll };
            break;
        }
        case IInteractions_2.Command.click: {
            return { command: IInteractions_1.InteractionCommand.click };
            break;
        }
        case IInteractions_2.Command.clickLeft: {
            return { command: IInteractions_1.InteractionCommand.click, mouseButton: IInteractions_1.MouseButton.left };
            break;
        }
        case IInteractions_2.Command.clickMiddle: {
            return { command: IInteractions_1.InteractionCommand.click, mouseButton: IInteractions_1.MouseButton.middle };
            break;
        }
        case IInteractions_2.Command.clickRight: {
            return { command: IInteractions_1.InteractionCommand.click, mouseButton: IInteractions_1.MouseButton.right };
            break;
        }
        case IInteractions_2.Command.doubleclick: {
            return { command: IInteractions_1.InteractionCommand.doubleclick };
            break;
        }
        case IInteractions_2.Command.doubleclickLeft: {
            return { command: IInteractions_1.InteractionCommand.doubleclick, mouseButton: IInteractions_1.MouseButton.left };
            break;
        }
        case IInteractions_2.Command.doubleclickMiddle: {
            return { command: IInteractions_1.InteractionCommand.doubleclick, mouseButton: IInteractions_1.MouseButton.middle };
            break;
        }
        case IInteractions_2.Command.doubleclickRight: {
            return { command: IInteractions_1.InteractionCommand.doubleclick, mouseButton: IInteractions_1.MouseButton.right };
            break;
        }
        case IInteractions_2.Command.clickUp: {
            return { command: IInteractions_1.InteractionCommand.clickUp };
            break;
        }
        case IInteractions_2.Command.clickUpLeft: {
            return { command: IInteractions_1.InteractionCommand.clickUp, mouseButton: IInteractions_1.MouseButton.left };
            break;
        }
        case IInteractions_2.Command.clickUpMiddle: {
            return { command: IInteractions_1.InteractionCommand.clickUp, mouseButton: IInteractions_1.MouseButton.middle };
            break;
        }
        case IInteractions_2.Command.clickUpRight: {
            return { command: IInteractions_1.InteractionCommand.clickUp, mouseButton: IInteractions_1.MouseButton.right };
            break;
        }
        case IInteractions_2.Command.clickDown: {
            return { command: IInteractions_1.InteractionCommand.clickDown };
            break;
        }
        case IInteractions_2.Command.clickDownLeft: {
            return { command: IInteractions_1.InteractionCommand.clickDown, mouseButton: IInteractions_1.MouseButton.left };
            break;
        }
        case IInteractions_2.Command.clickDownMiddle: {
            return { command: IInteractions_1.InteractionCommand.clickDown, mouseButton: IInteractions_1.MouseButton.middle };
            break;
        }
        case IInteractions_2.Command.clickDownRight: {
            return { command: IInteractions_1.InteractionCommand.clickDown, mouseButton: IInteractions_1.MouseButton.right };
            break;
        }
        default: {
            throw new Error(`unsupported command string: ${interaction}`);
        }
    }
}
//# sourceMappingURL=Interactor.js.map