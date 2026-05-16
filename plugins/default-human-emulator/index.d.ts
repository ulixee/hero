import { IInteractionGroups, IInteractionStep, IKeyboardCommand } from '@ulixee/unblocked-specification/agent/interact/IInteractions';
import IInteractionsHelper from '@ulixee/unblocked-specification/agent/interact/IInteractionsHelper';
import IPoint from '@ulixee/unblocked-specification/agent/browser/IPoint';
import IUnblockedPlugin from '@ulixee/unblocked-specification/plugin/IUnblockedPlugin';
import IEmulationProfile from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
export default class DefaultHumanEmulator implements IUnblockedPlugin {
    static id: string;
    static overshootSpread: number;
    static overshootRadius: number;
    static overshootThreshold: number;
    static boxPaddingPercent: {
        width: number;
        height: number;
    };
    static minMoveVectorPoints: number;
    static maxMoveVectorPoints: number;
    static minScrollVectorPoints: number;
    static maxScrollVectorPoints: number;
    static maxScrollIncrement: number;
    static maxScrollDelayMillis: number;
    static maxDelayBetweenInteractions: number;
    static wordsPerMinuteRange: number[];
    private millisPerCharacter;
    private readonly logger;
    constructor(options?: IEmulationProfile);
    getStartingMousePoint(helper: IInteractionsHelper): Promise<IPoint>;
    playInteractions(interactionGroups: IInteractionGroups, runFn: (interactionStep: IInteractionStep) => Promise<void>, helper: IInteractionsHelper): Promise<void>;
    protected scroll(interactionStep: IInteractionStep, run: (interactionStep: IInteractionStep) => Promise<void>, helper: IInteractionsHelper): Promise<void>;
    protected moveMouseAndClick(interactionStep: IInteractionStep, runFn: (interactionStep: IInteractionStep) => Promise<void>, helper: IInteractionsHelper): Promise<void>;
    protected moveMouse(interactionStep: IInteractionStep, run: (interactionStep: IInteractionStep) => Promise<void>, helper: IInteractionsHelper): Promise<IPoint>;
    protected moveMouseToPoint(interactionStep: IInteractionStep, runFn: (interactionStep: IInteractionStep) => Promise<void>, helper: IInteractionsHelper, targetPoint: IPoint, targetWidth: number): Promise<boolean>;
    protected jitterMouse(helper: IInteractionsHelper, runFn: (interactionStep: IInteractionStep) => Promise<void>): Promise<void>;
    protected getKeyboardCommandWithDelay(keyboardCommand: IKeyboardCommand, millisPerChar: number): IInteractionStep;
    protected calculateMillisPerChar(): number;
    private getScrollVector;
    private resolveMoveAndClickForInvisibleNode;
}
