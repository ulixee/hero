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

const { log } = Log(module);

export default class PageStateGenerator {
  public browserContext: Promise<IPuppetContext>;
  public sessionsById = new Map<string, IPageStateSession>();
  public sessionAssertions = new PageStateAssertions();

  public get states(): string[] {
    return [...this.statesByName.keys()];
  }

  public statesByName = new Map<string, IPageStateByName>();

  constructor(readonly id: string) {}

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
      needsResultsVerification: true,
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
      this.statesByName.set(name, { sessionIds: new Set<string>(), assertsByFrameId: {} });
    }
    for (const id of addSessionIds) {
      for (const [stateName, { sessionIds }] of this.statesByName) {
        if (stateName === name) sessionIds.add(id);
        else sessionIds.delete(id);
      }
    }
  }

  public import(savedState: IPageStateGeneratorAssertionBatch): void {
    this.addState(savedState.state, ...savedState.sessions.map(x => x.sessionId));
    const state = this.statesByName.get(savedState.state);
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
      const db = SessionDb.getCached(session.sessionId, false);
      // store flag to indicate this session should not be refreshed
      this.sessionsById.set(session.sessionId, {
        ...session,
        db,
        needsResultsVerification: false,
        mainFrameIds: db?.frames.mainFrameIds(session.tabId),
      });
    }
  }

  public export(stateName: string): IPageStateGeneratorAssertionBatch {
    const exported = <IPageStateGeneratorAssertionBatch>{
      id: `${this.id}-${stateName}`,
      sessions: [],
      assertions: [],
      state: stateName,
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
    return exported;
  }

  public async evaluate(): Promise<void> {
    for (const session of this.sessionsById.values()) {
      const { db, loadingRange, tabId, sessionId, needsResultsVerification } = session;

      if (!needsResultsVerification) continue;

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

        this.processDomChanges(domRebuilder, sessionId, paintEvent.changeEvents);
      }

      const resources = db.resources.withResponseTimeInRange(tabId, start, end);
      this.processResources(resources, sessionId);
    }

    await this.checkResultsInPage();

    const states = [...this.statesByName.values()];
    // 1. Only keep assert results common to all sessions in a state
    for (const state of states) {
      state.assertsByFrameId = this.sessionAssertions.getCommonSessionAssertions(
        state.sessionIds,
        state.startingAssertsByFrameId,
      );
    }

    // 2. Only keep "unique" assertions per state
    PageStateAssertions.removeAssertsSharedBetweenStates(states.map(x => x.assertsByFrameId));
  }

  public createBrowserContext(fromSessionId: string): void {
    this.browserContext ??= MirrorContext.createFromSessionDb(fromSessionId, false)
      .then(context => context.once('close', () => (this.browserContext = null)))
      .catch(err => err);
  }

  private async checkResultsInPage(): Promise<void> {
    for (const session of this.sessionsById.values()) {
      if (!session.domRecording || !session.needsResultsVerification) continue;
      const paintEvents = session.domRecording?.paintEvents;
      if (!paintEvents.length) {
        // no paint events for page!
        log.warn('No paint events for session!!', { sessionId: session.sessionId });
        continue;
      }

      await this.createMirrorPageIfNeeded(session);
      // create at "loaded" state
      const mirrorPage = session.mirrorPage;
      await mirrorPage.load();
      // only need to do this once?
      session.needsResultsVerification = false;

      for (const [frameId, assertions] of this.sessionAssertions.iterateSessionAssertionsByFrameId(
        session.sessionId,
      )) {
        // TODO: don't know how to get to subframes quite yet...
        if (!session.mainFrameIds.has(Number(frameId))) continue;

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
            if (typeof domResult === 'number' && domResult > xpathAssert.result) {
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
      await session.mirrorPage.isReady;
      if (session.mirrorPage.page) return;
    }

    const networkInterceptor = MirrorNetwork.createFromSessionDb(session.db, session.tabId, {
      hasResponse: true,
      isGetOrDocument: true,
    });
    networkInterceptor.useResourcesOnce = true;

    session.mirrorPage = new MirrorPage(networkInterceptor, session.domRecording, false);
    await this.createBrowserContext(session.sessionId);

    const context = await this.browserContext;
    if (context instanceof Error) throw context;

    const sessionRecord = session.db.session.get();
    await session.mirrorPage.open(context, session.sessionId, sessionRecord.viewport, page => {
      return page.devtoolsSession.send('Emulation.setLocaleOverride', {
        locale: sessionRecord.locale,
      });
    });
  }

  private processResources(resources: IResourceSummary[], sessionId: string): void {
    for (const resource of resources) {
      const { frameId } = resource;
      if (!frameId) continue;

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
        comparison: '!==',
        result: null,
      });
    }
  }

  private processDomChanges(
    dom: DomRebuilder,
    sessionId: string,
    changes: IDomChangeRecord[],
  ): void {
    for (const change of changes) {
      const { frameId, nodeId, action, nodeType } = change;

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
        change.textContent?.length < 200
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

    for (const nav of db.frameNavigations.getMostRecentTabNavigations(
      tabId,
      session.mainFrameIds,
    )) {
      if (nav.httpRespondedTime && !nav.httpRedirectedTime) {
        lastNavigation = nav;
        if (nav.httpRespondedTime < endTime) break;
      }
      if (nav.httpRequestedTime && nav.httpRequestedTime < endTime) break;
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
  state: string;
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
  needsResultsVerification: boolean;
  mainFrameIds: Set<number>;
  domRecording?: IDomRecording;
  mirrorPage?: MirrorPage;
  tabId: number;
  timelineRange: [start: number, end: number];
  loadingRange: [start: number, end: number];
}

interface IPageStateByName {
  sessionIds: Set<string>;
  assertsByFrameId?: IFrameAssertions;
  startingAssertsByFrameId?: IFrameAssertions;
}
