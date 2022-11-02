import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import {
  IElementInteractVerification,
  IInteractionCommand,
  IInteractionStep,
  IKeyboardCommand,
  isMousePositionXY,
} from '@ulixee/unblocked-specification/agent/interact/IInteractions';

export default class InteractionStepsTable extends SqliteTable<IInteractionStepRecord> {
  constructor(db: SqliteDatabase) {
    super(db, 'InteractionSteps', [
      ['tabId', 'INTEGER'],
      ['frameId', 'INTEGER'],
      ['commandId', 'INTEGER'],
      ['command', 'TEXT'],
      ['mousePositionX', 'INTEGER'],
      ['mousePositionY', 'INTEGER'],
      ['mousePositionJsPath', 'TEXT'],
      ['mouseButton', 'TEXT'],
      ['simulateOptionClickOnNodeId', 'INTEGER'],
      ['keyboardCommands', 'TEXT'],
      ['keyboardDelayBetween', 'INTEGER'],
      ['keyboardKeyupDelay', 'INTEGER'],
      ['delayMillis', 'INTEGER'],
      ['verification', 'TEXT'],
      ['relativeToScrollOffsetX', 'INTEGER'],
      ['relativeToScrollOffsetY', 'INTEGER'],
      ['startTimestamp', 'DATETIME'],
      ['endTimestamp', 'DATETIME'],
    ]);
  }

  public insert(
    tabId: number,
    frameId: number,
    commandId: number,
    step: IInteractionStep,
    startTimestamp: number,
    endTimestamp: number,
  ): void {
    const isMouseXY = step.mousePosition && isMousePositionXY(step.mousePosition);
    super.queuePendingInsert([
      tabId,
      frameId,
      commandId,
      step.command,
      isMouseXY ? (step.mousePosition[0] as number) : null,
      isMouseXY ? (step.mousePosition[1] as number) : null,
      !isMouseXY ? JSON.stringify(step.mousePosition) : null,
      step.mouseButton,
      step.simulateOptionClickOnNodeId,
      step.keyboardCommands ? JSON.stringify(step.keyboardCommands) : null,
      step.keyboardDelayBetween,
      step.keyboardKeyupDelay,
      step.delayMillis,
      step.verification,
      step.relativeToScrollOffset?.x,
      step.relativeToScrollOffset?.y,
      startTimestamp,
      endTimestamp,
    ]);
  }
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
