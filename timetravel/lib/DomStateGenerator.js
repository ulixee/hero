"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const Session_1 = require("@ulixee/hero-core/lib/Session");
const DomChangesTable_1 = require("@ulixee/hero-core/models/DomChangesTable");
const IDomChangeEvent_1 = require("@ulixee/hero-interfaces/IDomChangeEvent");
const Path = require("path");
const DomNode_1 = require("./DomNode");
const DomRebuilder_1 = require("./DomRebuilder");
const DomStateAssertions_1 = require("./DomStateAssertions");
const MirrorContext_1 = require("./MirrorContext");
const MirrorNetwork_1 = require("./MirrorNetwork");
const MirrorPage_1 = require("./MirrorPage");
const XPathGenerator_1 = require("./XPathGenerator");
const { log } = (0, Logger_1.default)(module);
class DomStateGenerator {
    constructor(id, core, emulateSessionId) {
        this.id = id;
        this.core = core;
        this.emulateSessionId = emulateSessionId;
        this.sessionsById = new Map();
        this.sessionAssertions = new DomStateAssertions_1.default();
        this.isEvaluating = false;
        this.sessionRegistry = core.sessionRegistry;
    }
    addSession(sessionDb, tabId, loadingRange, timelineRange) {
        const sessionId = sessionDb.sessionId;
        const db = this.sessionRegistry.retain(sessionId).catch(() => null);
        this.sessionsById.set(sessionId, {
            tabId,
            sessionId,
            needsProcessing: true,
            mainFrameIds: sessionDb.frames.mainFrameIds(),
            db,
            dbLocation: Path.dirname(sessionDb.path),
            loadingRange: [...loadingRange],
            timelineRange: timelineRange ? [...timelineRange] : undefined,
        });
    }
    async close() {
        if (this.browserContext) {
            const browserContext = this.browserContext;
            this.browserContext = null;
            const context = await browserContext;
            if (!context || context instanceof Error)
                return;
            await context.close();
        }
        for (const session of this.sessionsById.values()) {
            session.mirrorPage = null;
        }
        this.core = null;
    }
    async import(savedState) {
        this.startingAssertsByFrameId = {};
        const startingAssertions = this.startingAssertsByFrameId;
        for (const [frameId, type, args, comparison, result] of savedState.assertions) {
            startingAssertions[frameId] ??= {};
            const key = DomStateAssertions_1.default.generateKey(type, args);
            startingAssertions[frameId][key] = {
                key,
                type,
                args,
                comparison,
                result,
            };
        }
        for (const session of savedState.sessions) {
            const sessionId = session.sessionId;
            const db = await this.sessionRegistry.retain(sessionId).catch(() => null);
            this.sessionsById.set(sessionId, {
                ...session,
                db: Promise.resolve(db),
                needsProcessing: !!db,
                mainFrameIds: db?.frames.mainFrameIds(session.tabId),
            });
        }
    }
    export(minValidAssertionPercent = 80) {
        const exported = {
            id: this.id,
            sessions: [],
            assertions: [],
        };
        for (const session of this.sessionsById.values()) {
            exported.sessions.push({
                sessionId: session.sessionId,
                dbLocation: session.dbLocation,
                loadingRange: session.loadingRange,
                timelineRange: session.timelineRange,
                tabId: session.tabId,
            });
        }
        for (const [frameId, assertions] of Object.entries(this.assertsByFrameId)) {
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
        const stringifyCache = new Map();
        exported.assertions.sort((a, b) => {
            if (a[0] !== b[0])
                return a[0] - b[0];
            if (a[1] !== b[1])
                return a[1].localeCompare(b[1]);
            if (!stringifyCache.has(a[2]))
                stringifyCache.set(a[2], JSON.stringify(a[2]));
            if (!stringifyCache.has(b[2]))
                stringifyCache.set(b[2], JSON.stringify(b[2]));
            return stringifyCache.get(a[2]).localeCompare(stringifyCache.get(b[2]));
        });
        exported.minValidAssertions = Math.round(exported.assertions.length * (minValidAssertionPercent / 100));
        if (exported.minValidAssertions > exported.assertions.length ||
            exported.minValidAssertions <= 0) {
            exported.minValidAssertions = exported.assertions.length;
        }
        return exported;
    }
    async evaluate() {
        if (this.isEvaluating) {
            this.pendingEvaluate ??= new Resolvable_1.default();
            return await this.pendingEvaluate.promise;
        }
        this.isEvaluating = true;
        try {
            await this.doEvaluate();
        }
        catch (error) {
            if (error instanceof IPendingWaitEvent_1.CanceledPromiseError)
                return;
            throw error;
        }
        finally {
            this.isEvaluating = false;
            if (this.pendingEvaluate) {
                const evaluate = this.pendingEvaluate;
                this.pendingEvaluate = null;
                this.evaluate().then(evaluate.resolve).catch(evaluate.reject);
            }
        }
    }
    async doEvaluate() {
        for (const session of this.sessionsById.values()) {
            const { db: dbPromise, loadingRange, tabId, sessionId, needsProcessing } = session;
            const db = await dbPromise;
            if (!needsProcessing || !db)
                continue;
            this.sessionAssertions.clearSessionAssertions(sessionId);
            const [start, end] = loadingRange;
            const timeoutMs = end - Date.now();
            // wait for end point
            if (timeoutMs > 0)
                await new Promise(resolve => setTimeout(resolve, timeoutMs));
            const liveSession = Session_1.default.get(sessionId);
            if (liveSession && liveSession.db?.isOpen && !liveSession.db?.readonly) {
                liveSession.db.flush();
            }
            session.mainFrameIds = db.frames.mainFrameIds(tabId);
            const lastNavigation = await this.findLastNavigation(session);
            if (!lastNavigation) {
                continue;
            }
            // get all dom changes since the last navigation
            const domChangeRecords = db.domChanges.getChangesSinceNavigation(lastNavigation.id);
            session.domRecording = DomChangesTable_1.default.toDomRecording(domChangeRecords, session.mainFrameIds, db.frames.frameDomNodePathsById);
            session.domRecording.paintEvents = session.domRecording.paintEvents.filter(x => x.timestamp <= end);
            const domRebuilder = new DomRebuilder_1.default(session.mainFrameIds);
            for (const paintEvent of session.domRecording.paintEvents) {
                domRebuilder.apply(paintEvent);
                // apply all changes before start, but don't use as page state
                if (paintEvent.timestamp < start) {
                    continue;
                }
                if (paintEvent.timestamp > end)
                    break;
                this.processDomChanges(domRebuilder, session, paintEvent.changeEvents);
            }
            const resources = db.resources.withResponseTimeInRange(tabId, start, end);
            this.processResources(resources, sessionId);
            const storage = db.storageChanges.withTimeInRange(tabId, start, end);
            this.processStorageChanges(storage, sessionId, session.mainFrameIds.values().next().value);
        }
        await this.checkResultsInPage();
        // only use loaded sessions
        const validSessionIds = [...this.sessionsById.values()].filter(x => x.db).map(x => x.sessionId);
        this.assertsByFrameId = this.sessionAssertions.getCommonSessionAssertions(validSessionIds, this.startingAssertsByFrameId);
    }
    async checkResultsInPage() {
        for (const session of this.sessionsById.values()) {
            if (!session.domRecording || !session.needsProcessing)
                continue;
            const paintEvents = session.domRecording?.paintEvents;
            if (!paintEvents.length) {
                // no paint events for page!
                log.warn('No paint events for session!!', { sessionId: session.sessionId });
                continue;
            }
            await this.createMirrorPageIfNeeded(session);
            // create at "loaded" state
            const mirrorPage = session.mirrorPage;
            if (!mirrorPage)
                continue;
            await mirrorPage.load();
            // only need to do this once?
            session.needsProcessing = false;
            for (const [, assertions] of this.sessionAssertions.iterateSessionAssertionsByFrameId(session.sessionId)) {
                const xpathAsserts = Object.values(assertions).filter(x => x.type === 'xpath');
                const queries = xpathAsserts.map(x => x.args[0]);
                const refreshedResults = await mirrorPage.page.evaluate(XPathGenerator_1.default.createEvaluateExpression(queries));
                for (let i = 0; i < xpathAsserts.length; i += 1) {
                    const domResult = refreshedResults[i];
                    const xpathAssert = xpathAsserts[i];
                    if (domResult !== xpathAssert.result) {
                        // there can be more results in dom because we're only counting this small range of changes
                        if (typeof domResult === 'number' && domResult !== xpathAssert.result) {
                            xpathAssert.result = domResult;
                        }
                        else {
                            delete assertions[xpathAssert.key];
                        }
                    }
                }
            }
        }
    }
    clearContext() {
        this.browserContext = null;
    }
    async createMirrorPageIfNeeded(session) {
        if (session.mirrorPage?.isReady) {
            await session.mirrorPage.replaceDomRecording(session.domRecording);
            await session.mirrorPage.isReady;
            if (session.mirrorPage.page)
                return;
        }
        const networkInterceptor = MirrorNetwork_1.default.createFromSessionDb(await session.db, session.tabId, {
            hasResponse: true,
            isGetOrDocument: true,
            ignoreJavascriptRequests: true,
            useResourcesOnce: true,
        });
        session.mirrorPage = new MirrorPage_1.default(networkInterceptor, session.domRecording, false);
        const fromSessionId = this.emulateSessionId ?? session.sessionId;
        this.browserContext ??= MirrorContext_1.default.createFromSessionDb(fromSessionId, this.core, false)
            .then(context => context.once('close', this.clearContext.bind(this)))
            .catch(err => err);
        const context = await this.browserContext;
        if (context instanceof Error)
            throw context;
        const sessionRecord = (await session.db).session.get();
        await session.mirrorPage?.openInContext(context, session.sessionId, sessionRecord.viewport, page => {
            return page.devtoolsSession
                .send('Emulation.setLocaleOverride', {
                locale: sessionRecord.locale,
            })
                .catch(error => {
                // All pages in the same renderer share locale. All such pages belong to the same
                // context and if locale is overridden for one of them its value is the same as
                // we are trying to set so it's not a problem.
                if (error.message.includes('Another locale override is already in effect'))
                    return;
                throw error;
            });
        });
    }
    processResources(resources, sessionId) {
        for (const resource of resources) {
            const { frameId } = resource;
            if (!frameId)
                continue;
            if (typeof resource.url !== 'string')
                console.log(resource); // eslint-disable-line no-console
            this.sessionAssertions.recordAssertion(sessionId, frameId, {
                type: 'resource',
                args: [
                    {
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
    processStorageChanges(changes, sessionId, frameId) {
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
    processDomChanges(dom, session, changes) {
        const sessionId = session.sessionId;
        for (const change of changes) {
            const { frameId, nodeId, action, nodeType } = change;
            // TODO: don't know how to get to subframes quite yet...
            if (!session.mainFrameIds.has(Number(frameId)))
                continue;
            if (change.action === IDomChangeEvent_1.DomActionType.location || change.action === IDomChangeEvent_1.DomActionType.newDocument) {
                this.recordUrl(sessionId, change.frameId, change.textContent);
                continue;
            }
            const domNode = dom.getNode(frameId, nodeId);
            const xpathGenerator = dom.getXpathGenerator(frameId);
            const isElement = nodeType === DomNode_1.NodeType.Element || domNode?.nodeType === DomNode_1.NodeType.Element;
            const isTextnode = nodeType === DomNode_1.NodeType.Text || domNode?.nodeType === DomNode_1.NodeType.Text;
            const isRemoved = action === IDomChangeEvent_1.DomActionType.removed;
            const isAdded = action === IDomChangeEvent_1.DomActionType.added;
            const isAttributeChange = action === IDomChangeEvent_1.DomActionType.attribute;
            if (isElement && (isAdded || isRemoved)) {
                const tagPath = xpathGenerator.getTagPath(domNode, false);
                const countWithTagPath = xpathGenerator.count(tagPath);
                const existing = this.sessionAssertions.getSessionAssertionWithQuery(sessionId, frameId, countWithTagPath);
                let count = existing?.result ?? 0;
                if (isAdded)
                    count += 1;
                else if (count > 0)
                    count -= 1;
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
            if (isTextnode &&
                (isAdded || isRemoved) &&
                // don't compare long strings
                change.textContent?.length < 30) {
                const containingElement = domNode.parentElement;
                if (containingElement && containingElement.children.length === 1) {
                    this.recordXpath(sessionId, frameId, xpathGenerator.textContent(xpathGenerator.getTagPath(containingElement)), change.textContent);
                    // count total nodes with this text
                    this.recordXpath(sessionId, frameId, xpathGenerator.countTagsWithText(containingElement.tagName, change.textContent), 1);
                }
            }
        }
    }
    recordXpath(sessionId, frameId, path, result) {
        this.sessionAssertions.recordAssertion(sessionId, frameId, {
            type: 'xpath',
            args: [path],
            comparison: '===',
            result,
        });
    }
    recordUrl(sessionId, frameId, url) {
        this.sessionAssertions.recordAssertion(sessionId, frameId, {
            type: 'url',
            args: [],
            comparison: '===',
            result: url,
        });
    }
    async findLastNavigation(session) {
        let lastNavigation;
        const { tabId, db, loadingRange, sessionId } = session;
        const [, endTime] = loadingRange;
        const { frameNavigations } = await db;
        // going in descending order
        for (const nav of frameNavigations.getMostRecentTabNavigations(tabId, session.mainFrameIds)) {
            if (nav.httpRespondedTime && !nav.httpRedirectedTime) {
                lastNavigation = nav;
                // if this was requested before the end time, use it
                if (nav.httpRequestedTime && nav.httpRequestedTime < endTime)
                    break;
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
exports.default = DomStateGenerator;
//# sourceMappingURL=DomStateGenerator.js.map