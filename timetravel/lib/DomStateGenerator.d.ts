import Core from '@ulixee/hero-core';
import SessionDb from '@ulixee/hero-core/dbs/SessionDb';
import { IDomRecording } from '@ulixee/hero-core/models/DomChangesTable';
import IDomStateAssertionBatch from '@ulixee/hero-interfaces/IDomStateAssertionBatch';
import BrowserContext from '@ulixee/unblocked-agent/lib/BrowserContext';
import DomStateAssertions, { IFrameAssertions } from './DomStateAssertions';
import MirrorPage from './MirrorPage';
export default class DomStateGenerator {
    readonly id: string;
    private core;
    private emulateSessionId?;
    browserContext: Promise<BrowserContext>;
    sessionsById: Map<string, IDomStateSession>;
    sessionAssertions: DomStateAssertions;
    assertsByFrameId?: IFrameAssertions;
    startingAssertsByFrameId?: IFrameAssertions;
    private pendingEvaluate;
    private isEvaluating;
    private sessionRegistry;
    constructor(id: string, core: Core, emulateSessionId?: string);
    addSession(sessionDb: SessionDb, tabId: number, loadingRange: [start: number, end: number], timelineRange?: [start: number, end: number]): void;
    close(): Promise<void>;
    import(savedState: IDomStateGeneratorAssertionBatch): Promise<void>;
    export(minValidAssertionPercent?: number): IDomStateGeneratorAssertionBatch;
    evaluate(): Promise<void>;
    private doEvaluate;
    private checkResultsInPage;
    private clearContext;
    private createMirrorPageIfNeeded;
    private processResources;
    private processStorageChanges;
    private processDomChanges;
    private recordXpath;
    private recordUrl;
    private findLastNavigation;
}
export interface IDomStateGeneratorAssertionBatch extends IDomStateAssertionBatch {
    sessions: {
        sessionId: string;
        dbLocation: string;
        tabId: number;
        timelineRange: [start: number, end: number];
        loadingRange: [start: number, end: number];
    }[];
}
export interface IDomStateSession {
    db: Promise<SessionDb>;
    dbLocation: string;
    sessionId: string;
    needsProcessing: boolean;
    mainFrameIds: Set<number>;
    domRecording?: IDomRecording;
    mirrorPage?: MirrorPage;
    tabId: number;
    timelineRange: [start: number, end: number];
    loadingRange: [start: number, end: number];
}
