import { DomActionType } from '@ulixee/hero-interfaces/IDomChangeEvent';
import Log from '@ulixee/commons/lib/Logger';
import IPuppetContext from '@ulixee/hero-interfaces/IPuppetContext';
import { IFrameNavigationRecord } from '@ulixee/hero-core/models/FrameNavigationsTable';
import DomChangesTable, {
  IDomChangeRecord,
  IDomRecording,
} from '@ulixee/hero-core/models/DomChangesTable';
import SessionDb from '@ulixee/hero-core/dbs/SessionDb';
import IResourceSummary from '@ulixee/hero-interfaces/IResourceSummary';
import IPageStateAssertionBatch from '@ulixee/hero-interfaces/IPageStateAssertionBatch';
import IResourceFilterProperties from '@ulixee/hero-core/interfaces/IResourceFilterProperties';
import { NodeType } from './DomNode';
import DomRebuilder from './DomRebuilder';
import MirrorPage from './MirrorPage';
import MirrorNetwork from './MirrorNetwork';
import MirrorContext from './MirrorContext';
import PageStateAssertions, { IFrameAssertions } from './PageStateAssertions';
import XPathGenerator from './XPathGenerator';
import { nanoid } from 'nanoid';
import { IStorageChangesEntry } from '@ulixee/hero-core/models/StorageChangesTable';
import Resolvable from '@ulixee/commons/lib/Resolvable';

const { log } = Log(module);

export default class PageStateGenerator {
  public browserContext: Promise<IPuppetContext>;
  public sessionsById = new Map<string, IPageStateSession>();
  public sessionAssertions = new PageStateAssertions();

  public get states(): string[] {
    return [...this.statesByName.keys()];
  }

  public statesByName = new Map<string, IPageStateByName>();
  public unresolvedSessionIds = new Set<string>();

  private pendingEvaluate: Resolvable<void>;
  private isEvaluating = false;

  constructor(readonly id: string, private emulateSessionId?: string) {}

  public addSession(
    sessionDb: SessionDb,
    tabId: number,
    loadingRange: [start: number, end: number],
    timelineRange?: [start: number, end: number],
  ): void {
    const sessionId = sessionDb.sessionId;
    this.sessionsById.set(sessionId, {
      tabId,
      sessionId,
      needsProcessing: true,
      mainFrameIds: sessionDb.frames.mainFrameIds(),
      db: sessionDb,
      dbLocation: SessionDb.databaseDir,
      loadingRange: [...loadingRange],
      timelineRange: timelineRange ? [...timelineRange] : undefined,
    });
  }

  public getStateForSessionId(sessionId: string): string {
    for (const [state, details] of this.statesByName) {
      if (details.sessionIds.has(sessionId)) return state;
    }
  }

  public async close(): Promise<void> {
    if (this.browserContext) {
      const browserContext = this.browserContext;
      this.browserContext = null;
      const context = await browserContext;
      if (!context || context instanceof Error) return;
      await context.close();
    }
    for (const session of this.sessionsById.values()) {
      session.mirrorPage = null;
    }
  }

  public addState(name: string, ...addSessionIds: string[]): void {
    if (!this.statesByName.has(name)) {
      this.statesByName.set(name, {
        sessionIds: new Set<string>(),
        assertsByFrameId: {},
        id: nanoid(),
      });
    }
    for (const id of addSessionIds) {
      this.unresolvedSessionIds.delete(id);
      for (const [stateName, { sessionIds }] of this.statesByName) {
        if (stateName === name) sessionIds.add(id);
        else sessionIds.delete(id);
      }
    }
  }

  public deleteState(name: string): void {
    const existing = this.statesByName.get(name);
    this.statesByName.delete(name);
    for (const id of existing.sessionIds) {
      this.unresolvedSessionIds.add(id);
    }
  }

  public import(stateName: string, savedState: IPageStateGeneratorAssertionBatch): void {
    if (!this.statesByName.has(stateName)) {
      this.statesByName.set(stateName, {
        sessionIds: new Set<string>(),
        assertsByFrameId: {},
        id: savedState.id,
      });
    }
    this.addState(stateName, ...savedState.sessions.map(x => x.sessionId));
    const state = this.statesByName.get(stateName);
    state.startingAssertsByFrameId = {};
    const startingAssertions = state.startingAssertsByFrameId;
    for (const [frameId, type, args, comparison, result] of savedState.assertions) {
      startingAssertions[frameId] ??= {};
      const key = PageStateAssertions.generateKey(type, args);
      startingAssertions[frameId][key] = {
        key,
        type,
        args,
        comparison,
        result,
      };
    }
    for (const session of savedState.sessions) {
      let db: SessionDb;
      try {
        db = SessionDb.getCached(session.sessionId, false);
      } catch (err) {
        // couldn't load
      }
      this.sessionsById.set(session.sessionId, {
        ...session,
        db,
        needsProcessing: !!db,
        mainFrameIds: db?.frames.mainFrameIds(session.tabId),
      });
    }
  }

  public export(
    stateName: string,
    minValidAssertionPercent = 80,
  ): IPageStateGeneratorAssertionBatch {
    const exported = <IPageStateGeneratorAssertionBatch>{
      id: this.statesByName.get(stateName).id,
      sessions: [],
      assertions: [],
    };
    const state = this.statesByName.get(stateName);
    for (const sessionId of state.sessionIds) {
      const session = this.sessionsById.get(sessionId);
      exported.sessions.push({
        sessionId: session.sessionId,
        dbLocation: session.dbLocation,
        loadingRange: session.loadingRange,
        timelineRange: session.timelineRange,
        tabId: session.tabId,
      });
    }
    for (const [frameId, assertions] of Object.entries(state.assertsByFrameId)) {
      for (const assertion of Object.values(assertions)) {
        exported.assertions.push([
          Number(frameId),
          assertion.type,
          assertion.args,
          assertion.comparison,
          assertion.result,
        ]);
      }
    }

    exported.sessions.sort((a, b) => {
      const aTime = a.timelineRange ? a.timelineRange[0] : a.loadingRange[0];
      const bTime = b.timelineRange ? b.timelineRange[0] : b.loadingRange[0];
      return aTime - bTime;
    });

    const stringifyCache = new Map<any, string>();
    exported.assertions.sort((a, b) => {
      if (a[0] !== b[0]) return a[0] - b[0];
      if (a[1] !== b[1]) return a[1].localeCompare(b[1]);
      if (!stringifyCache.has(a[2])) stringifyCache.set(a[2], JSON.stringify(a[2]));
      if (!stringifyCache.has(b[2])) stringifyCache.set(b[2], JSON.stringify(b[2]));
      return stringifyCache.get(a[2]).localeCompare(stringifyCache.get(b[2]));
    });

    exported.minValidAssertions = Math.round(
      exported.assertions.length * (minValidAssertionPercent / 100),
    );
    if (
      exported.minValidAssertions > exported.assertions.length ||
      exported.minValidAssertions <= 0
    ) {
      exported.minValidAssertions = exported.assertions.length;
    }

    return exported;
  }

  public async evaluate(): Promise<void> {
    if (this.isEvaluating) {
      this.pendingEvaluate ??= new Resolvable<void>();
      return await this.pendingEvaluate.promise;
    }

    this.isEvaluating = true;
    try {
      await this.doEvaluate();
    } finally {
      this.isEvaluating = false;

      if (this.pendingEvaluate) {
        const evaluate = this.pendingEvaluate;
        this.pendingEvaluate = null;
        this.evaluate().then(evaluate.resolve).catch(evaluate.reject);
      }
    }
  }

  private async doEvaluate(): Promise<void> {
    for (const session of this.sessionsById.values()) {
      const { db, loadingRange, tabId, sessionId, needsProcessing } = session;

      if (!needsProcessing || !db) continue;

      this.sessionAssertions.clearSessionAssertions(sessionId);
      const [start, end] = loadingRange;
      const timeoutMs = end - Date.now();

      // wait for end point
      if (timeoutMs > 0) await new Promise(resolve => setTimeout(resolve, timeoutMs));
      if (!db.readonly) db.flush();

      session.mainFrameIds = db.frames.mainFrameIds(tabId);

      const lastNavigation = this.findLastNavigation(session);
      if (!lastNavigation) {
        continue;
      }

      // get all dom changes since the last navigation
      const domChangeRecords = db.domChanges.getChangesSinceNavigation(lastNavigation.id);
      session.domRecording = DomChangesTable.toDomRecording(
        domChangeRecords,
        session.mainFrameIds,
        session.db.frames.frameDomNodePathsById,
      );

      session.domRecording.paintEvents = session.domRecording.paintEvents.filter(
        x => x.timestamp <= end,
      );

      const domRebuilder = new DomRebuilder(session.mainFrameIds);

      for (const paintEvent of session.domRecording.paintEvents) {
        domRebuilder.apply(paintEvent);
        // apply all changes before start, but don't use as page state
        if (paintEvent.timestamp < start) {
          continue;
        }
        if (paintEvent.timestamp > end) break;

        this.processDomChanges(domRebuilder, session, paintEvent.changeEvents);
      }

      const resources = db.resources.withResponseTimeInRange(tabId, start, end);
      this.processResources(resources, sessionId);

      const storage = db.storageChanges.withTimeInRange(tabId, start, end);
      this.processStorageChanges(storage, sessionId, session.mainFrameIds.values().next().value);
    }

    await this.checkResultsInPage();

    const states = [...this.statesByName.values()];
    // 1. Only keep assert results common to all sessions in a state
    for (const state of states) {
      // only use loaded sessions
      const validSessionIds = [...state.sessionIds].filter(x => !!this.sessionsById.get(x)?.db);
      state.assertsByFrameId = this.sessionAssertions.getCommonSessionAssertions(
        validSessionIds,
        state.startingAssertsByFrameId,
      );
    }

    // 2. Only keep "unique" assertions per state
    PageStateAssertions.removeAssertsSharedBetweenStates(states.map(x => x.assertsByFrameId));
  }

  private async checkResultsInPage(): Promise<void> {
    for (const session of this.sessionsById.values()) {
      if (!session.domRecording || !session.needsProcessing) continue;
      const paintEvents = session.domRecording?.paintEvents;
      if (!paintEvents.length) {
        // no paint events for page!
        log.warn('No paint events for session!!', { sessionId: session.sessionId });
        continue;
      }

      await this.createMirrorPageIfNeeded(session);
      // create at "loaded" state
      const mirrorPage = session.mirrorPage;
      if (!mirrorPage) continue;
      await mirrorPage.load();
      // only need to do this once?
      session.needsProcessing = false;

      for (const [, assertions] of this.sessionAssertions.iterateSessionAssertionsByFrameId(
        session.sessionId,
      )) {
        const xpathAsserts = Object.values(assertions).filter(x => x.type === 'xpath');
        const queries = xpathAsserts.map(x => x.args[0]);
        const refreshedResults = await mirrorPage.page.evaluate(
          XPathGenerator.createEvaluateExpression(queries),
        );
        for (let i = 0; i < xpathAsserts.length; i += 1) {
          const domResult = refreshedResults[i];
          const xpathAssert = xpathAsserts[i];
          if (domResult !== xpathAssert.result) {
            // there can be more results in dom because we're only counting this small range of changes
            if (typeof domResult === 'number' && domResult !== xpathAssert.result) {
              xpathAssert.result = domResult;
            } else {
              delete assertions[xpathAssert.key];
            }
          }
        }
      }
    }
  }

  private async createMirrorPageIfNeeded(session: IPageStateSession): Promise<void> {
    if (session.mirrorPage?.isReady) {
      await session.mirrorPage.replaceDomRecording(session.domRecording);
      await session.mirrorPage.isReady;
      if (session.mirrorPage.page) return;
    }

    const networkInterceptor = MirrorNetwork.createFromSessionDb(session.db, session.tabId, {
      hasResponse: true,
      isGetOrDocument: true,
      ignoreJavascriptRequests: true,
      useResourcesOnce: true,
    });

    session.mirrorPage = new MirrorPage(networkInterceptor, session.domRecording, false);

    const fromSessionId = this.emulateSessionId ?? session.sessionId;
    this.browserContext ??= MirrorContext.createFromSessionDb(fromSessionId, false)
      .then(context => context.once('close', () => (this.browserContext = null)))
      .catch(err => err);

    const context = await this.browserContext;
    if (context instanceof Error) throw context;

    const sessionRecord = session.db.session.get();
    await session.mirrorPage?.open(context, session.sessionId, sessionRecord.viewport, page => {
      return page.devtoolsSession
        .send('Emulation.setLocaleOverride', {
          locale: sessionRecord.locale,
        })
        .catch(error => {
          // All pages in the same renderer share locale. All such pages belong to the same
          // context and if locale is overridden for one of them its value is the same as
          // we are trying to set so it's not a problem.
          if (error.message.includes('Another locale override is already in effect')) return;
          throw error;
        });
    });
  }

  private processResources(resources: IResourceSummary[], sessionId: string): void {
    for (const resource of resources) {
      const { frameId } = resource;
      if (!frameId) continue;
      if (typeof resource.url !== 'string') console.log(resource);

      this.sessionAssertions.recordAssertion(sessionId, frameId, {
        type: 'resource',
        args: [
          <IResourceFilterProperties>{
            url: resource.url,
            httpRequest: {
              statusCode: resource.statusCode,
              method: resource.method,
            },
          },
        ],
        comparison: '!!',
        result: null,
      });
    }
  }

  private processStorageChanges(
    changes: IStorageChangesEntry[],
    sessionId: string,
    frameId: number,
  ): void {
    for (const change of changes) {
      const entry = {
        securityOrigin: change.securityOrigin,
        type: change.type,
        action: change.action,
        key: change.key,
      };
      this.sessionAssertions.recordAssertion(sessionId, frameId, {
        type: 'storage',
        args: [entry],
        comparison: '!!',
        result: null,
      });

      if (change.type !== 'indexedDB' && change.action !== 'remove') {
        this.sessionAssertions.recordAssertion(sessionId, frameId, {
          type: 'storage',
          args: [entry, 'value'],
          comparison: '===',
          result: change.value,
        });
      }
    }
  }

  private processDomChanges(
    dom: DomRebuilder,
    session: IPageStateSession,
    changes: IDomChangeRecord[],
  ): void {
    const sessionId = session.sessionId;

    for (const change of changes) {
      const { frameId, nodeId, action, nodeType } = change;
      // TODO: don't know how to get to subframes quite yet...
      if (!session.mainFrameIds.has(Number(frameId))) continue;

      if (change.action === DomActionType.location || change.action === DomActionType.newDocument) {
        this.recordUrl(sessionId, change.frameId, change.textContent);
        continue;
      }

      const domNode = dom.getNode(frameId, nodeId);

      const xpathGenerator = dom.getXpathGenerator(frameId);
      const isElement = nodeType === NodeType.Element || domNode?.nodeType === NodeType.Element;
      const isTextnode = nodeType === NodeType.Text || domNode?.nodeType === NodeType.Text;

      const isRemoved = action === DomActionType.removed;
      const isAdded = action === DomActionType.added;
      const isAttributeChange = action === DomActionType.attribute;

      if (isElement && (isAdded || isRemoved)) {
        const tagPath = xpathGenerator.getTagPath(domNode, false);
        const countWithTagPath = xpathGenerator.count(tagPath);
        const existing = this.sessionAssertions.getSessionAssertionWithQuery(
          sessionId,
          frameId,
          countWithTagPath,
        );

        let count = (existing?.result as number) ?? 0;

        if (isAdded) count += 1;
        else if (count > 0) count -= 1;

        this.recordXpath(sessionId, frameId, countWithTagPath, count);

        if (domNode.id) {
          const idCount = isAdded ? 1 : 0;
          const idPath = xpathGenerator.getIdPath(domNode);
          const countWithId = xpathGenerator.count(idPath);
          this.recordXpath(sessionId, frameId, countWithId, idCount);
        }
      }

      if (isElement && isAttributeChange) {
        const tagPath = xpathGenerator.getTagPath(domNode, false);
        const attributeSelector = xpathGenerator.attributeSelector(tagPath, domNode);
        this.recordXpath(sessionId, frameId, xpathGenerator.count(attributeSelector), 1);
      }

      if (
        isTextnode &&
        (isAdded || isRemoved) &&
        // don't compare long strings
        change.textContent?.length < 30
      ) {
        const containingElement = domNode.parentElement;
        if (containingElement && containingElement.children.length === 1) {
          this.recordXpath(
            sessionId,
            frameId,
            xpathGenerator.textContent(xpathGenerator.getTagPath(containingElement)),
            change.textContent,
          );
          // count total nodes with this text
          this.recordXpath(
            sessionId,
            frameId,
            xpathGenerator.countTagsWithText(containingElement.tagName, change.textContent),
            1,
          );
        }
      }
    }
  }

  private recordXpath(
    sessionId: string,
    frameId: number,
    path: string,
    result: string | number | boolean,
  ): void {
    this.sessionAssertions.recordAssertion(sessionId, frameId, {
      type: 'xpath',
      args: [path],
      comparison: '===',
      result,
    });
  }

  private recordUrl(sessionId: string, frameId: number, url: string): void {
    this.sessionAssertions.recordAssertion(sessionId, frameId, {
      type: 'url',
      args: [],
      comparison: '===',
      result: url,
    });
  }

  private findLastNavigation(session: IPageStateSession): IFrameNavigationRecord {
    let lastNavigation: IFrameNavigationRecord;
    const { tabId, db, loadingRange, sessionId } = session;
    const [, endTime] = loadingRange;

    // going in descending order
    for (const nav of db.frameNavigations.getMostRecentTabNavigations(
      tabId,
      session.mainFrameIds,
    )) {
      if (nav.httpRespondedTime && !nav.httpRedirectedTime) {
        lastNavigation = nav;
        // if this was requested before the end time, use it
        if (nav.httpRequestedTime && nav.httpRequestedTime < endTime) break;
      }
    }

    if (!lastNavigation) {
      log.error('No navigation found for session during page state generation', {
        sessionId,
        mainFrameIds: [...session.mainFrameIds],
        loadingRange,
        tabId,
      });
    }
    return lastNavigation;
  }
}

export interface IPageStateGeneratorAssertionBatch extends IPageStateAssertionBatch {
  sessions: {
    sessionId: string;
    dbLocation: string; // could be on another machine
    tabId: number;
    timelineRange: [start: number, end: number];
    loadingRange: [start: number, end: number];
  }[];
}

export interface IPageStateSession {
  db: SessionDb;
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

interface IPageStateByName {
  sessionIds: Set<string>;
  id: string;
  assertsByFrameId?: IFrameAssertions;
  startingAssertsByFrameId?: IFrameAssertions;
}
