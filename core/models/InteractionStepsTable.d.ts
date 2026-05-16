import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import { IElementInteractVerification, IInteractionCommand, IInteractionStep, IKeyboardCommand } from '@ulixee/unblocked-specification/agent/interact/IInteractions';
export default class InteractionStepsTable extends SqliteTable<IInteractionStepRecord> {
    constructor(db: SqliteDatabase);
    insert(tabId: number, frameId: number, commandId: number, step: IInteractionStep, startTimestamp: number, endTimestamp: number): void;
}
export interface IInteractionStepRecord {
    tabId: number;
    frameId: number;
    commandId: number;
    command: IInteractionCommand;
    mousePositionX: number;
    mousePositionY: number;
    mousePositionJsPath: string;
    mouseButton: string;
    simulateOptionClickOnNodeId?: number;
    keyboardCommands?: IKeyboardCommand[];
    keyboardDelayBetween?: number;
    keyboardKeyupDelay?: number;
    delayMillis?: number;
    verification?: IElementInteractVerification;
    relativeToScrollOffsetX: number;
    relativeToScrollOffsetY: number;
    startTimestamp: number;
    endTimestamp: number;
}
