import { v1 as uuidv1 } from 'uuid';
import Log from '@secret-agent/commons/Logger';
import ITabOptions from '@secret-agent/core-interfaces/ITabOptions';
import {
  ILocationStatus,
  ILocationTrigger,
  LocationStatus,
} from '@secret-agent/core-interfaces/Location';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import ICommandMeta from '@secret-agent/core-interfaces/ICommandMeta';
import { AllowedNames } from '@secret-agent/commons/AllowedNames';
import { ICookie } from '@secret-agent/core-interfaces/ICookie';
import { IInteractionGroups, IMousePositionXY } from '@secret-agent/core-interfaces/IInteractions';
import * as Url from 'url';
import IElementRect from '@secret-agent/injected-scripts/interfaces/IElementRect';
import IWaitForResourceOptions from '@secret-agent/core-interfaces/IWaitForResourceOptions';
import Timer from '@secret-agent/commons/Timer';
import IResourceMeta from '@secret-agent/core-interfaces/IResourceMeta';
import { createPromise } from '@secret-agent/commons/utils';
import TimeoutError from '@secret-agent/commons/interfaces/TimeoutError';
import IWaitForElementOptions from '@secret-agent/core-interfaces/IWaitForElementOptions';
import IExecJsPathResult from '@secret-agent/injected-scripts/interfaces/IExecJsPathResult';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import { Page } from '@secret-agent/puppet-chrome/lib/Page';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import TabEvents, { ITabEventParams } from './TabEvents';
import LocationTracker from './LocationTracker';
import Interactor from './Interactor';
import Session from './Session';
import DomEnv from './DomEnv';
import IResourceFilterProperties from '../interfaces/IResourceFilterProperties';
import UserProfile from './UserProfile';
import DomRecorder from './DomRecorder';

const { log } = Log(module);

export default class Tab extends TypedEventEmitter<ITabEventParams> {
  public readonly id = uuidv1();
  public readonly session: Session;
  public readonly locationTracker: LocationTracker;
  public readonly domRecorder: DomRecorder;
  public readonly domEnv: DomEnv;
  public get sessionState() {
    return this.session.sessionState;
  }

  public puppetPage: Page;

  private readonly events: TabEvents;
  private readonly interactor: Interactor;

  private isClosing = false;
  private waitTimeouts: { timeout: NodeJS.Timeout; reject: (reason?: any) => void }[] = [];

  public get lastCommandId() {
    return this.sessionState.lastCommand?.id;
  }

  public get sessionId() {
    return this.session.id;
  }

  public get navigationUrl(): string {
    return this.sessionState.pages.currentUrl;
  }

  public get mainFrameId() {
    return this.puppetPage.mainFrameId;
  }

  constructor(session: Session, puppetPage: Page) {
    super();
    this.session = session;
    this.puppetPage = puppetPage;
    this.interactor = new Interactor(this);
    this.locationTracker = new LocationTracker(this.sessionState);
    this.events = new TabEvents(this);
    this.domEnv = new DomEnv(this.sessionId, this.puppetPage.frames);
    this.puppetPage.frames.on('frameCreated', ({ frame }) => {
      this.sessionState.captureFrameCreated(frame.id, frame.parentId);
    });
    this.domRecorder = new DomRecorder(
      session.id,
      puppetPage,
      this.sessionState.onPageEvents.bind(this.sessionState),
    );
    session.beforeClose = () => this.close();
  }

  public async setBrowserOrigin(origin: string) {
    const mitmSession = this.session.requestMitmProxySession;
    const originalBlockUrls = mitmSession.blockUrls;
    const originalBlockResourceTypes = [...mitmSession.blockResourceTypes];
    const originalBlockResponseHandlerFn = mitmSession.blockResponseHandlerFn;
    try {
      mitmSession.blockUrls = [origin];
      mitmSession.blockResourceTypes = ['Image'];
      mitmSession.blockResponseHandlerFn = (request, response) => {
        response.end(`<html lang="en"><body>Empty</body></html>`);
        return true;
      };
      await this.puppetPage.navigate(origin);
    } finally {
      // restore originals
      mitmSession.blockUrls = originalBlockUrls;
      mitmSession.blockResponseHandlerFn = originalBlockResponseHandlerFn;
      mitmSession.blockResourceTypes = originalBlockResourceTypes;
    }
  }

  public async installEmulator() {
    const puppetPage = this.puppetPage;
    const emulator = this.session.emulator;
    await puppetPage.setUserAgent({
      acceptLanguage: 'en-US,en',
      userAgent: emulator.userAgent.raw,
      platform: emulator.userAgent.platform,
    });

    const pageOverrides = await emulator.generatePageOverrides();
    for (const pageOverride of pageOverrides) {
      if (pageOverride.callbackWindowName) {
        await puppetPage.frames.addPageCallback(pageOverride.callbackWindowName, payload => {
          pageOverride.callback(JSON.parse(payload));
        });
      }
      // overrides happen in main frame
      await puppetPage.frames.addNewDocumentScript(pageOverride.script, false);
    }
  }

  public async getResourceProperty(resourceid: number, propertyPath: string) {
    let finalResourceId = resourceid;
    // if no resource id, this is a request for the default resource (page)
    if (!resourceid) {
      await this.waitForLoad('READY');
      finalResourceId = await this.locationTracker.waitForLocationResourceId();
    }

    if (propertyPath === 'data' || propertyPath === 'response.data') {
      return await this.sessionState.getResourceData(finalResourceId);
    }

    const resource = this.sessionState.getResourceMeta(finalResourceId);

    const pathParts = propertyPath.split('.');

    let propertyParent: any = resource;
    if (pathParts.length > 1) {
      const parentProp = pathParts.shift();
      if (parentProp === 'request' || parentProp === 'response') {
        propertyParent = propertyParent[parentProp];
      }
    }
    const property = pathParts.shift();
    return propertyParent[property];
  }

  public async config(options: ITabOptions) {
    const mitmSession = this.session.requestMitmProxySession;
    const blockedResources = mitmSession.blockResourceTypes;
    const renderingOptions = options?.renderingOptions ?? [];
    let enableJs = true;

    if (renderingOptions.includes('All')) {
      blockedResources.length = 0;
    } else if (renderingOptions.includes('None')) {
      blockedResources.push('Image', 'Stylesheet', 'Script', 'Font', 'Ico', 'Media');
      enableJs = false;
    } else {
      if (!renderingOptions.includes('LoadImages')) {
        blockedResources.push('Image');
      }
      if (!renderingOptions.includes('LoadCssResources')) {
        blockedResources.push('Stylesheet');
      }
      if (!renderingOptions.includes('LoadJsResources')) {
        blockedResources.push('Script');
      }
      if (!renderingOptions.includes('JsRuntime')) {
        enableJs = false;
      }
    }
    await this.puppetPage.setJavaScriptEnabled(enableJs);
    mitmSession.blockUrls = [];
  }

  public async runCommand<T>(functionName: TabFunctionNames, ...args: any[]) {
    const commandHistory = this.sessionState.commands;

    const commandMeta = {
      id: commandHistory.length + 1,
      frameId: this.mainFrameId,
      name: functionName,
      args: args.length ? JSON.stringify(args) : undefined,
    } as ICommandMeta;

    const previousCommand = commandHistory.length
      ? commandHistory[commandHistory.length - 1]
      : null;

    this.locationTracker.willRunCommand(commandMeta, previousCommand);
    if (functionName !== 'goto') {
      await this.domRecorder.setCommandIdForPage(commandMeta.id);
    }
    const id = log.info('Tab.runCommand', { ...commandMeta, sessionId: this.sessionId });
    let result: T;
    try {
      const commandFn = this[functionName].bind(this, ...args);
      result = await this.sessionState.runCommand<T>(commandFn, commandMeta);
    } finally {
      log.stats('Tab.ranCommand', { sessionId: this.sessionId, result, parentLogId: id });
    }
    return result;
  }

  public async goto(url: string) {
    const formattedUrl = Url.format(url);
    this.session.proxy.start(formattedUrl);
    this.recordUserActivity(formattedUrl);

    this.sessionState.pages.navigationRequested(
      'goto',
      formattedUrl,
      this.mainFrameId,
      this.lastCommandId,
    );

    await this.puppetPage.navigate(formattedUrl);

    return this.locationTracker
      .waitForLocationResourceId()
      .then(x => this.sessionState.getResourceMeta(x));
  }

  public async scrollJsPathIntoView(jsPath: IJsPath) {
    await this.locationTracker.waitFor(LocationStatus.DomContentLoaded);
    await this.domEnv.scrollJsPathIntoView(jsPath);
  }

  public async scrollCoordinatesIntoView(coordinates: IMousePositionXY) {
    await this.locationTracker.waitFor(LocationStatus.DomContentLoaded);
    await this.domEnv.scrollCoordinatesIntoView(coordinates);
  }

  public async getElementRectToViewport(jsPath: IJsPath): Promise<IElementRect> {
    // NOT using waitFor(LocationStatus) since not expecting this method to be called externally
    return this.domEnv.getJsPathClientRect(jsPath);
  }

  public async simulateOptionClick(jsPath: IJsPath): Promise<boolean> {
    // NOT using waitFor(LocationStatus) since not expecting this method to be called externally
    return this.domEnv.simulateOptionClick(jsPath);
  }

  public async interact(interactionGroups: IInteractionGroups) {
    await this.locationTracker.waitFor('READY');
    await this.interactor.play(interactionGroups);
  }

  public async getJsValue<T>(path: string) {
    return this.domEnv.execNonIsolatedExpression<T>(path);
  }

  public async execJsPath<T>(
    jsPath: IJsPath,
    propertiesToExtract?: string[],
  ): Promise<IExecJsPathResult<T>> {
    // if nothing loaded yet, return immediately
    if (!this.sessionState.pages.top) return null;
    await this.waitForLoad('READY');
    return this.domEnv.execJsPath<T>(jsPath, propertiesToExtract);
  }

  public createRequest(input: string | number, init?: IRequestInit) {
    return this.domEnv.createFetchRequest(input, init);
  }

  public fetch(input: string | number, init?: IRequestInit) {
    return this.domEnv.execFetch(input, init);
  }

  public recordUserActivity(documentUrl: string) {
    this.session.requestMitmProxySession?.recordDocumentUserActivity(documentUrl);
  }

  public async getLocationHref() {
    await this.waitForLoad('READY');
    return this.domEnv.locationHref();
  }

  public async getPageCookies(): Promise<ICookie[]> {
    await this.waitForLoad('READY');
    return await this.puppetPage.getPageCookies();
  }

  public async focus() {
    await this.puppetPage.bringToFront();
  }

  public async close() {
    if (this.isClosing) return;
    this.isClosing = true;
    await this.domRecorder.flush(true);
    this.domEnv.close();

    const logid = log.info('TabClosing', {
      tabId: this.id,
      sessionId: this.session.id,
    });
    try {
      // clear any pending timeouts
      this.waitTimeouts.forEach(x => {
        clearTimeout(x.timeout);
        x.reject(new Error('Terminated command because session closing'));
      });
      await this.puppetPage.close();
    } catch (error) {
      if (
        error.message.includes('Target closed') === false &&
        error.message.includes('WebSocket is not open') === false &&
        error.message.includes('Connection closed') === false
      ) {
        log.error('TabCloseError', { sessionId: this.sessionId, error });
      }
    } finally {
      log.stats('TabClosed', { sessionId: this.sessionId, parentLogId: logid });
    }
  }

  public async waitForResource(filter: IResourceFilterProperties, opts?: IWaitForResourceOptions) {
    const timer = new Timer(opts?.timeoutMs ?? 60e3, this.waitTimeouts);

    const resourceMetas: IResourceMeta[] = [];
    const promise = createPromise();

    const onResource = async (resourceMeta: IResourceMeta) => {
      if (resourceMeta.seenAtCommandId === undefined) {
        resourceMeta.seenAtCommandId = this.lastCommandId;
        // need to set directly since passed in object is a copy
        this.sessionState.getResourceMeta(resourceMeta.id).seenAtCommandId = this.lastCommandId;
      }
      if (resourceMeta.seenAtCommandId <= opts?.sinceCommandId ?? -1) return;
      if (filter.type && resourceMeta.type !== filter.type) return;
      if (resourceMeta.url && !resourceMeta.url.match(filter.url)) return;
      // if already included, skip
      if (resourceMetas.some(x => x.id === resourceMeta.id)) return;

      resourceMetas.push(resourceMeta);
      // resolve if any match
      promise.resolve();
    };

    try {
      this.sessionState.emitter.on('resource', onResource);
      await this.sessionState.forEachResource(r => onResource(r));
      await timer.waitForPromise(promise.promise, 'Timeout waiting for DomContentLoaded');
    } catch (err) {
      const isTimeout = err instanceof TimeoutError;
      if (isTimeout && opts?.throwIfTimeout === false) {
        return resourceMetas;
      }
      throw err;
    } finally {
      this.sessionState.emitter.off('resource', onResource);
      timer.clear();
    }

    return resourceMetas;
  }

  public async waitForElement(jsPath: IJsPath, options?: IWaitForElementOptions) {
    const waitForVisible = options?.waitForVisible ?? false;

    const timer = new Timer(options?.timeoutMs ?? 30e3, this.waitTimeouts);
    await timer.waitForPromise(
      this.locationTracker.waitFor('READY'),
      'Timeout waiting for DomContentLoaded',
    );

    try {
      let isFound = false;
      do {
        try {
          const jsonValue = await this.domEnv.isJsPathVisible(jsPath);
          if (jsonValue) {
            if (waitForVisible) {
              isFound = jsonValue.value;
            } else {
              isFound = jsonValue.attachedState !== null;
            }
          }
        } catch (err) {
          isFound = false;
        }
        timer.throwIfExpired(`Timeout waiting for element ${jsPath} to be visible`);
        await new Promise(resolve => setTimeout(resolve, 50));
      } while (!isFound);
    } finally {
      timer.clear();
    }
  }

  public async waitForLoad(status: ILocationStatus | 'READY') {
    return await this.locationTracker.waitFor(status);
  }

  public async waitForLocation(trigger: ILocationTrigger) {
    return await this.locationTracker.waitFor(trigger);
  }

  public async waitForMillis(millis: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        this.removeWaitTimeout(timeout);
        resolve();
      }, millis);
      this.waitTimeouts.push({ timeout, reject });
    });
  }

  public async waitForNode(pathToNode: IJsPath) {
    return await this.waitForElement(pathToNode);
  }

  // Private ////////////

  private removeWaitTimeout(timeout: NodeJS.Timer) {
    const index = this.waitTimeouts.findIndex(x => x.timeout === timeout);
    if (index >= 0) this.waitTimeouts.splice(index, 1);
  }

  // CREATE

  public static async create(session: Session) {
    const logid = log.info('CreatingTab', { sessionId: session.id });
    const puppetPage = await session.newPage();

    const tab = new Tab(session, puppetPage);
    // this responds to auth requests
    await puppetPage.authenticate({
      username: tab.id,
      password: session.id,
    });

    // install user profile before page boots up
    await tab.domEnv.install();
    await UserProfile.install(session.options.userProfile, tab);
    await tab.installEmulator();
    await tab.domRecorder.listen();
    await tab.events.listen();

    log.info('Tab.create', { sessionId: session.id, parentLogId: logid });
    return tab;
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
type TabFunctionNames = AllowedNames<Tab, Function>;
