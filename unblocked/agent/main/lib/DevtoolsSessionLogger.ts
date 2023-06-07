import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import { Protocol } from '@ulixee/unblocked-specification/agent/browser/IDevtoolsSession';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import DevtoolsSession from './DevtoolsSession';
import Frame from './Frame';
import BrowserContext from './BrowserContext';
import TargetInfo = Protocol.Target.TargetInfo;

interface IMessageDetails {
  sessionType: IDevtoolsLogEvents['devtools-message']['sessionType'];
  workerTargetId?: string;
  pageTargetId?: string;
  iframeTargetId?: string;
}

export default class DevtoolsSessionLogger extends TypedEventEmitter<IDevtoolsLogEvents> {
  public static defaultTruncateMessageResponses: DevtoolsSessionLogger['truncateMessageResponses'] =
    new Set(['Page.captureScreenshot', 'Network.getResponseBody']);

  public static defaultTruncateParams: DevtoolsSessionLogger['truncateParams'] = new Map([
    ['Fetch.fulfillRequest', [{ maxLength: 50, path: 'body' }]],
    ['Page.screencastFrame', [{ maxLength: 0, path: 'data' }]],
    ['Page.addScriptToEvaluateOnNewDocument', [{ maxLength: 50, path: 'source' }]],
    ['Runtime.bindingCalled', [{ maxLength: 250, path: 'payload' }]],
    ['Runtime.evaluate', [{ maxLength: 250, path: 'expression' }]],
    [
      'Network.requestWillBeSent',
      [
        { maxLength: 100, path: ['request', 'postData'] },
        { maxLength: 0, path: ['request', 'postDataEntries'] },
      ],
    ],
  ]);

  public readonly truncateMessageResponses: Set<string>;
  public readonly truncateParams: Map<string, { maxLength: number; path: string | string[] }[]>;

  private logger: IBoundLog;
  private events = new EventSubscriber();
  private fetchRequestIdToNetworkId = new Map<string, string>();
  private devtoolsSessions = new WeakSet<DevtoolsSession>();
  private browserContextInitiatedMessageIds = new Set<number>();
  private sentMessagesById: {
    [id: number]: {
      method: string;
      frameId?: string;
      requestId?: string;
    };
  } = {};

  constructor(private browserContext: BrowserContext) {
    super();
    this.truncateMessageResponses = DevtoolsSessionLogger.defaultTruncateMessageResponses;
    this.truncateParams = DevtoolsSessionLogger.defaultTruncateParams;
    this.logger = browserContext.logger.createChild(module);
    this.storeEventsWithoutListeners = true;
  }

  public close(): void {
    this.events.close();
    this.browserContextInitiatedMessageIds.clear();
    this.sentMessagesById = {};
    this.browserContext = null;
  }

  public subscribeToDevtoolsMessages(
    devtoolsSession: DevtoolsSession,
    details: IMessageDetails,
  ): void {
    if (this.devtoolsSessions.has(devtoolsSession)) return;

    this.devtoolsSessions.add(devtoolsSession);

    this.events.on(
      devtoolsSession.messageEvents,
      'receive',
      this.onEventReceive.bind(this, details),
      true,
    );
    this.events.on(devtoolsSession.messageEvents, 'send', this.onEventSend.bind(this, details), true);
  }

  private onEventSend(
    details: IMessageDetails,
    event: DevtoolsSession['messageEvents']['EventTypes']['send'],
    initiator: any,
  ): void {
    // if sent from browser, only include when matching context id
    if (details.sessionType === 'browser') {
      // don't include other browser context messages
      if (initiator && initiator instanceof BrowserContext && initiator !== this.browserContext) {
        return;
      }
      this.browserContextInitiatedMessageIds.add(event.id);
    }
    if (initiator && initiator instanceof Frame) {
      (event as any).frameId = initiator.id;
    }
    this.filterAndSendMessage({
      direction: 'send',
      ...details,
      ...event,
    });
  }

  private onEventReceive(
    details: IMessageDetails,
    event: DevtoolsSession['messageEvents']['EventTypes']['receive'],
  ): void {
    if (details.sessionType === 'browser') {
      // see if this was initiated by this browser context
      if ('id' in event && !this.browserContextInitiatedMessageIds.has(event.id)) return;

      if ('params' in event) {
        const isOtherContext = this.isOtherBrowserContextTarget(event.params.targetInfo);
        if (isOtherContext) return;
      }
    }
    this.filterAndSendMessage({
      direction: 'receive',
      ...details,
      ...event,
    });
  }

  private isOtherBrowserContextTarget(target: TargetInfo): boolean {
    if (!target?.browserContextId) return false;
    return target.browserContextId !== this.browserContext.id;
  }

  private filterAndSendMessage(event: IDevtoolsLogEvents['devtools-message']): void {
    const params = event.params;
    let frameId = event.frameId;
    let requestId: string;
    let pageId = event.pageTargetId;
    if (params) {
      frameId = frameId ?? params.frame?.id ?? params.frameId ?? params.context?.auxData?.frameId;

      // translate Fetch.requestPaused networkId (which is what we use in other parts of the app
      requestId =
        this.fetchRequestIdToNetworkId.get(params.requestId) ??
        params.networkId ??
        params.requestId;
      if (params.networkId) this.fetchRequestIdToNetworkId.set(params.requestId, params.networkId);

      if (!pageId && params.targetInfo && params.targetInfo?.type === 'page') {
        pageId = params.targetInfo.targetId;
        event.pageTargetId = pageId;
      }

      if (!frameId && params.targetInfo && params.targetInfo?.type === 'iframe') {
        frameId = params.targetInfo.targetId;
      }
    }

    if (event.direction === 'send') {
      this.sentMessagesById[event.id] = {
        method: event.method,
        frameId,
        requestId,
      };
    } else if (event.id) {
      const sentMessage = this.sentMessagesById[event.id];
      delete this.sentMessagesById[event.id];
      if (sentMessage) {
        event.method = sentMessage.method;
        frameId ??= sentMessage.frameId;
        requestId ??= sentMessage.requestId;
      }
    }

    event.frameId = frameId;
    event.requestId = requestId;

    const method = event.method;
    const result = event.result;
    if (result) {
      if (this.truncateMessageResponses.has(method)) {
        let extras = '';
        if ('data' in result) {
          extras = ` ${result.data.length} chars`;
        }
        event.result = { ...result, data: `[truncated${extras}]` };
      }
    }

    if (params) {
      const tuncaters = this.truncateParams.get(method);
      if (tuncaters) {
        event.params = { ...params };
        for (const truncPath of tuncaters) {
          const { maxLength, path } = truncPath;
          let value: any = params;
          let propName = path as string;
          let eventParent = event.params;
          if (typeof path === 'string') {
            value = value[path];
          } else {
            for (let i = 0; i < path.length; i += 1) {
              const part = path[i];
              eventParent = value;
              value = value[part];
              propName = part;
            }
          }

          if (value && typeof value === 'string' && value.length > maxLength) {
            eventParent[propName] = `${value.substr(0, maxLength)}... [truncated ${
              value.length - maxLength
            } chars]`;
          } else if (value && typeof value !== 'string') {
            eventParent[propName] = 'REMOVED FOR LOGS';
          }
        }
      }
    }
    this.emit('devtools-message', event);

    this.logger.stats(`${event.direction}:${event.method}`, {
      pageId: event.pageTargetId,
      frameId: event.frameId,
      requestId: event.requestId,
      messageId: event.id,
      params: event.params,
      result: event.result,
      error: event.error,
      devtoolsSessionId: event.sessionId,
    });
  }
}

interface IDevtoolsLogEvents {
  'devtools-message': {
    direction: 'send' | 'receive';
    timestamp: Date;
    pageTargetId?: string;
    workerTargetId?: string;
    frameId?: string;
    requestId?: string;
    sessionType: 'page' | 'worker' | 'browser' | 'iframe';
    sessionId: string;
    method?: string;
    id?: number;
    params?: any;
    error?: any;
    result?: any;
  };
}
