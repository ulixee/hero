import { DomActionType } from '@ulixee/hero-interfaces/IDomChangeEvent';
import Log from '@ulixee/commons/lib/Logger';
import IPuppetContext from '@ulixee/hero-interfaces/IPuppetContext';
import { inspect } from 'util';
import { IFrameNavigationRecord } from '@ulixee/hero-core/models/FrameNavigationsTable';
import DomChangesTable, {
  IDomChangeRecord,
  IDomRecording,
} from '@ulixee/hero-core/models/DomChangesTable';
import SessionDb from '@ulixee/hero-core/dbs/SessionDb';
import IResourceSummary from '@ulixee/hero-interfaces/IResourceSummary';
import { NodeType } from './DomNode';
import DomRebuilder from './DomRebuilder';
import MirrorPage from './MirrorPage';
import MirrorNetwork from './MirrorNetwork';
import MirrorContext from './MirrorContext';
import PageStateAssertions, { IAssertionAndResult, IFrameAssertions } from './PageStateAssertions';
import XPathGenerator from './XPathGenerator';

inspect.defaultOptions.depth = 10;

const { log } = Log(module);

export default class PageStateGenerator {
  public locationId: string;
  public browserContext: Promise<IPuppetContext>;
  public sessionsById = new Map<string, IPageStateSession>();
  public sessionAssertions = new PageStateAssertions();

  public statesByName = new Map<string, IPageStateByName>();

  constructor(locationId?: string) {
    this.locationId = locationId;
  }

  public addSession(
    sessionDb: SessionDb,
    tabId: number,
    timeRange?: [start: number, end: number],
  ): void {
    const sessionId = sessionDb.sessionId;
    this.sessionsById.set(sessionId, {
      tabId,
      sessionId,
      needsResultsVerification: true,
      mainFrameIds: sessionDb.frames.mainFrameIds(),
      db: sessionDb,
      dbLocation: SessionDb.databaseDir,
      timeRange,
    });
    this.browserContext ??= MirrorContext.createFromSessionDb(sessionId, false).catch(err => err);
  }

  public async close(): Promise<void> {
    const context = await this.browserContext;
    if (!context || context instanceof Error) return;
    await context.close();
  }

  public addState(name: string, ...sessionIds: string[]): void {
    if (!this.statesByName.has(name)) {
      this.statesByName.set(name, { sessionIds: new Set<string>() });
    }
    for (const id of sessionIds) {
      this.statesByName.get(name).sessionIds.add(id);
    }
  }

  public updateSessionTimes(sessionId: string, timeRange: [start: number, end: number]): void {
    this.sessionsById.get(sessionId).timeRange = timeRange;
  }

  public import(savedState: IExportedPageState): void {
    this.addState(savedState.state, ...savedState.sessions.map(x => x.sessionId));
    const state = this.statesByName.get(savedState.state);
    state.startingAssertsByFrameId = {};
    const startingAssertions = state.startingAssertsByFrameId;
    for (const [frameId, command, args, comparison, result] of savedState.assertions) {
      startingAssertions[frameId] ??= {};
      const key = PageStateAssertions.generateKey(command, args);
      startingAssertions[frameId][key] = {
        key,
        command,
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

  public export(stateName: string): IExportedPageState {
    const exported = <IExportedPageState>{
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
        timeRange: session.timeRange,
        tabId: session.tabId,
      });
    }
    for (const [frameId, assertions] of Object.entries(state.assertsByFrameId)) {
      for (const assertion of Object.values(assertions)) {
        exported.assertions.push([
          Number(frameId),
          assertion.command,
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
      const { db, timeRange, tabId, sessionId, needsResultsVerification } = session;

      if (!needsResultsVerification) continue;

      const [start, end] = timeRange;
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

  private async checkResultsInPage(): Promise<void> {
    const context = await this.browserContext;
    if (context instanceof Error) throw context;

    for (const session of this.sessionsById.values()) {
      if (!session.domRecording || !session.needsResultsVerification) continue;
      const paintEvents = session.domRecording?.paintEvents;
      if (!paintEvents.length) {
        // no paint events for page!
        log.warn('No paint events for session!!', { sessionId: session.sessionId });
        continue;
      }

      await this.createMirrorPageIfNeeded(context, session);
      // create at "loaded" state
      const { mirrorPage } = session;
      await mirrorPage.load();
      // only need to do this once?
      session.needsResultsVerification = false;

      for (const [frameId, assertions] of this.sessionAssertions.iterateSessionAssertionsByFrameId(
        session.sessionId,
      )) {
        // TODO: don't know how to get to subframes quite yet...
        if (!session.mainFrameIds.has(Number(frameId))) continue;

        const xpathAsserts = Object.values(assertions).filter(
          x => x.command === 'FrameEnvironment.execXPath',
        );
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

  private async createMirrorPageIfNeeded(
    context: IPuppetContext,
    session: IPageStateSession,
  ): Promise<void> {
    if (session.mirrorPage) return;
    const networkInterceptor = MirrorNetwork.createFromSessionDb(session.db, session.tabId, {
      hasResponse: true,
      isGetOrDocument: true,
    });
    networkInterceptor.useResourcesOnce = true;

    session.mirrorPage = new MirrorPage(networkInterceptor, session.domRecording, false);

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
        command: 'Tab.findResource',
        args: [
          {
            url: resource.url,
            status: resource.statusCode,
            method: resource.method,
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
      command: 'FrameEnvironment.execXPath',
      args: [path, typeof result],
      comparison: '===',
      result,
    });
  }

  private recordUrl(sessionId: string, frameId: number, url: string): void {
    this.sessionAssertions.recordAssertion(sessionId, frameId, {
      command: 'FrameEnvironment.getUrl',
      args: [],
      comparison: '===',
      result: url,
    });
  }

  private findLastNavigation(session: IPageStateSession): IFrameNavigationRecord {
    let lastNavigation: IFrameNavigationRecord;
    const { tabId, db, timeRange, sessionId } = session;
    const [, endTime] = timeRange;

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
        timeRange,
        tabId,
      });
    }
    return lastNavigation;
  }
}

interface IPageStateSession {
  db: SessionDb;
  dbLocation: string;
  sessionId: string;
  needsResultsVerification: boolean;
  mainFrameIds: Set<number>;
  domRecording?: IDomRecording;
  mirrorPage?: MirrorPage;
  tabId: number;
  timeRange: [start: number, end: number];
}

interface IPageStateByName {
  sessionIds: Set<string>;
  assertsByFrameId?: IFrameAssertions;
  startingAssertsByFrameId?: IFrameAssertions;
}

export interface IExportedPageState {
  state: string;
  sessions: {
    sessionId: string;
    dbLocation: string; // could be on another machine
    tabId: number;
    timeRange: [start: number, end: number];
  }[];
  assertions: [
    frameId: number,
    command: IAssertionAndResult['command'],
    args: IAssertionAndResult['args'],
    comparison: IAssertionAndResult['comparison'],
    result: IAssertionAndResult['result'],
  ][];
}
