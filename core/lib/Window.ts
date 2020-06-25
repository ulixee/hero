import uuid from 'uuid/v1';
import Log from '@secret-agent/shared-logger';
import puppeteer from 'puppeteer';
import IWindowOptions from '@secret-agent/core-interfaces/IWindowOptions';
import Session from './Session';
import {
  ILocationStatus,
  ILocationTrigger,
  LocationStatus,
} from '@secret-agent/core-interfaces/Location';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import SessionState from '@secret-agent/shared-session-state';
import ICommandMeta from '@secret-agent/core-interfaces/ICommandMeta';
import IDevtoolsClient from '../interfaces/IDevtoolsClient';
import { AllowedNames } from '@secret-agent/commons/AllowedNames';
import { ICookie } from '@secret-agent/core-interfaces/ICookie';
import { IInteractionGroups, IMousePositionXY } from '@secret-agent/core-interfaces/IInteractions';
import * as Url from 'url';
import IElementRect from './page-scripts/interfaces/IElementRect';
import Interactor from './Interactor';
import LocationTracker from './LocationTracker';
import IWaitForResourceFilter from '@secret-agent/core-interfaces/IWaitForResourceFilter';
import IWaitForResourceOptions from '@secret-agent/core-interfaces/IWaitForResourceOptions';
import Timer from '@secret-agent/commons/Timer';
import IResourceMeta from '@secret-agent/core-interfaces/IResourceMeta';
import { createPromise } from '@secret-agent/commons/utils';
import TimeoutError from '@secret-agent/commons/interfaces/TimeoutError';
import IWaitForElementOptions from '@secret-agent/core-interfaces/IWaitForElementOptions';
import FrameTracker from './FrameTracker';
import WindowEvents, { IWindowEventParams } from './WindowEvents';
import { EmulatorPlugin } from '@secret-agent/emulators';
import IExecJsPathResult from './page-scripts/interfaces/IExecJsPathResult';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import DomEnv from './DomEnv';

const { log } = Log(module);

export default class Window {
  public readonly id: string = uuid();
  public readonly session: Session;
  public readonly sessionState: SessionState;
  public readonly locationTracker: LocationTracker;
  public readonly frameTracker: FrameTracker;
  public readonly domEnv: DomEnv;

  public puppPage: puppeteer.Page;

  private readonly events: WindowEvents;
  private readonly interactor: Interactor;

  private isClosing: boolean = false;
  private waitTimeouts: { timeout: NodeJS.Timeout; reject: (reason?: any) => void }[] = [];

  public get lastCommandId() {
    return this.sessionState.lastCommand?.id;
  }

  public get navigationUrl(): string {
    return this.sessionState.pages.currentUrl;
  }

  public get devtoolsClient() {
    // @ts-ignore
    const devtoolsClient: IDevtoolsClient = this.puppPage._client;
    return devtoolsClient;
  }

  private get mainFrameId() {
    // @ts-ignore
    return this.puppPage.mainFrame()?._id;
  }

  constructor(sessionState: SessionState, puppPage: puppeteer.Page, session: Session) {
    this.session = session;
    this.sessionState = sessionState;
    this.puppPage = puppPage;
    this.interactor = new Interactor(this);
    this.locationTracker = new LocationTracker(this.sessionState);
    this.events = new WindowEvents(this);
    this.frameTracker = new FrameTracker(this.devtoolsClient);
    this.domEnv = new DomEnv(this.frameTracker, this.devtoolsClient);
  }

  public async start() {
    // tslint:disable-next-line:no-this-assignment
    const { devtoolsClient } = this;
    await Window.installEmulator(devtoolsClient, this.session.emulator);
    await this.frameTracker.init();
    // must be installed before window scripts
    await this.sessionState.listenForPageEvents(devtoolsClient, this.frameTracker);
    this.events.listen();
    await this.domEnv.install();
  }

  public async setBrowserOrigin(origin: string) {
    const mitmSession = this.session.requestMitmProxySession;
    const originalBlockUrls = mitmSession.blockUrls;
    const originalBlockImages = mitmSession.blockImages;
    const originalBlockResponseHandlerFn = mitmSession.blockResponseHandlerFn;
    try {
      mitmSession.blockUrls = [origin];
      mitmSession.blockImages = true;
      mitmSession.blockResponseHandlerFn = (request, response) => {
        response.end(`<html><body>Empty</body></html>`);
        return true;
      };
      await this.puppPage.goto(origin, {
        waitUntil: 'load',
      });
    } finally {
      // restore originals
      mitmSession.blockUrls = originalBlockUrls;
      mitmSession.blockResponseHandlerFn = originalBlockResponseHandlerFn;
      mitmSession.blockImages = originalBlockImages;
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

  public async config(options: IWindowOptions) {
    this.session.requestMitmProxySession.blockImages = false;
    this.session.requestMitmProxySession.blockUrls = [];
  }

  public on<K extends keyof IWindowEventParams>(
    eventType: K,
    listenerFn: (this: this, event?: IWindowEventParams[K]) => any,
  ) {
    return this.events.on(eventType, listenerFn.bind(this));
  }

  public once<K extends keyof IWindowEventParams>(
    eventType: K,
    listenerFn: (this: this, event?: IWindowEventParams[K]) => any,
  ) {
    return this.events.once(eventType, listenerFn.bind(this));
  }

  public async runCommand<T>(functionName: WindowFunctionNames, ...args: any[]) {
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

    let commandFn: () => Promise<any>;
    if (functionName in this) {
      commandFn = this[functionName].bind(this, ...args);
    } else {
      commandFn = this[functionName].bind(this, ...args);
    }
    const id = log.info('Window.runCommand', commandMeta);
    let result: T;
    try {
      result = await this.sessionState.runCommand<T>(commandFn, commandMeta);
    } finally {
      log.stats('Window.ranCommand', { result }, id);
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

    // NOTE: don't wait for goto because it waits for DOMLoaded. We want to let the user decide.
    this.puppPage.goto(formattedUrl).catch(error => {
      if (error.message !== 'Navigation failed because browser has disconnected!') {
        throw error;
      }
    });

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

  public async getPageCookies(): Promise<ICookie[]> {
    await this.waitForLoad('READY');
    return (await this.puppPage.cookies()).map(
      x =>
        ({
          ...x,
          expires: String(x.expires),
        } as ICookie),
    );
  }

  public async close() {
    if (this.isClosing) return;
    this.isClosing = true;
    log.info('WindowClosing', { windowId: this.id, sessionId: this.session.id });
    try {
      // clear any pending timeouts
      this.waitTimeouts.forEach(x => {
        clearTimeout(x.timeout);
        x.reject(new Error('Closing session'));
      });
      await this.session.close();
      const page = this.puppPage;
      delete this.puppPage;
      if (page) {
        await page.close({
          runBeforeUnload: true,
        });
      }
    } catch (error) {
      if (
        error.message.includes('Target closed') === false &&
        error.message.includes('WebSocket is not open') === false &&
        error.message.includes('Connection closed') === false
      ) {
        log.error('Error closing target', error);
      }
    }
  }

  public async waitForResource(
    filter: Pick<IWaitForResourceFilter, 'url' | 'type'>,
    opts?: IWaitForResourceOptions,
  ) {
    const timer = new Timer(opts?.timeoutMs ?? 60e3, this.waitTimeouts);

    const resourceMetas: IResourceMeta[] = [];
    const promise = createPromise();

    const onResource = async (resourceMeta: IResourceMeta) => {
      if (resourceMeta.seenAtCommandId === undefined) {
        resourceMeta.seenAtCommandId = this.lastCommandId;
        // need to set directly since passed in object is a copy
        this.sessionState.getResourceMeta(resourceMeta.id).seenAtCommandId = this.lastCommandId;
      }
      if (resourceMeta.seenAtCommandId <= opts.sinceCommandId ?? -1) return;
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
      let jsonValue: IExecJsPathResult<boolean>;
      do {
        try {
          jsonValue = await this.domEnv.isJsPathVisible(jsPath);
          if (waitForVisible && jsonValue?.value !== true) {
            jsonValue = null;
          }
        } catch (err) {
          jsonValue = null;
        }
        timer.throwIfExpired('Timeout waiting for element to be visible');
        await new Promise(setImmediate);
      } while (!jsonValue);
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
      const timeout = setTimeout(async () => {
        if (this.isClosing) return resolve();
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

  public static async create(sessionState: SessionState, session: Session) {
    const logid = log.info('CreatingWindow', { sessionId: session.id });
    const puppPage = await session.puppContext.newPage();

    await puppPage.setExtraHTTPHeaders(session.requestMitmProxySession.getTrackingHeaders());

    const window = new Window(sessionState, puppPage, session);
    log.info('CreatedWindow', null, logid);
    return window;
  }

  private static async installEmulator(devtoolsClient: IDevtoolsClient, emulator: EmulatorPlugin) {
    await devtoolsClient.send('Network.setUserAgentOverride', {
      acceptLanguage: 'en-US,en',
      userAgent: emulator.userAgent.raw,
      platform: emulator.userAgent.platform,
    });

    const pageOverrides = await emulator.generatePageOverrides();
    for (const pageOverride of pageOverrides) {
      if (pageOverride.callbackWindowName) {
        await devtoolsClient.send('Runtime.addBinding', {
          name: pageOverride.callbackWindowName,
        });
        await devtoolsClient.on('Runtime.bindingCalled', async ({ name, payload }) => {
          if (name === pageOverride.callbackWindowName) {
            pageOverride.callback(JSON.parse(payload));
          }
        });
      }
      await devtoolsClient.send('Page.addScriptToEvaluateOnNewDocument', {
        source: pageOverride.script,
      });
    }
  }
}

// tslint:disable-next-line:ban-types
type WindowFunctionNames = AllowedNames<Window, Function>;
