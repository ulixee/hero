// Currently this only used to support communication from chrome (injected scripts) to unblocked agent
import Resolvable from '@ulixee/commons/lib/Resolvable';
import TypedEventEmitter from '@ulixee/commons/lib/TypedEventEmitter';
import { Server } from 'net';
import DevtoolsSession from './DevtoolsSession';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import Protocol from 'devtools-protocol';
import { IConsoleEvents } from '@ulixee/unblocked-specification/agent/browser/IConsole';

const SCRIPT_PLACEHOLDER = '';

export class Console extends TypedEventEmitter<IConsoleEvents> {
  isReady: Resolvable<void>;

  private readonly events = new EventSubscriber();
  // We store resolvable when we received websocket message before, receiving
  // targetId, this way we can await this, and still trigger to get proper ids.
  private clientIdToTargetId = new Map<string, Resolvable<string> | string>();

  private server: Server;
  private intervals = new Set<NodeJS.Timeout>();

  constructor(
    public devtoolsSession: DevtoolsSession,
    public secretKey?: string,
  ) {
    super();
  }

  async initialize(): Promise<void> {
    if (this.isReady) return this.isReady.promise;
    this.isReady = new Resolvable();

    await this.devtoolsSession.send('Console.enable');
    this.events.on(
      this.devtoolsSession,
      'Console.messageAdded',
      this.handleConsoleMessage.bind(this),
    );

    this.isReady.resolve();
    return this.isReady.promise;
  }

  isConsoleRegisterUrl(url: string): boolean {
    return url.includes(
      `/heroInternalUrl?secretKey=${this.secretKey}&action=registerConsoleClientId&clientId=`,
    );
  }

  registerFrameId(url: string, frameId: string): void {
    const parsed = new URL(url);
    const clientId = parsed.searchParams.get('clientId');
    if (!clientId) return;

    const targetId = this.clientIdToTargetId.get(clientId);
    if (targetId instanceof Resolvable) {
      targetId.resolve(frameId);
    }
    this.clientIdToTargetId.set(clientId, frameId);
  }

  injectCallbackIntoScript(script: string): string {
    // We could do this as a simple template script but this logic might get
    // complex over time and we want typescript to be able to check proxyScript();
    const scriptFn = injectedScript
      .toString()
      // eslint-disable-next-line no-template-curly-in-string
      .replaceAll('${this.secretKey}', this.secretKey)
      // Use function otherwise replace will try todo some magic
      .replace('SCRIPT_PLACEHOLDER', () => script);

    const wsScript = `(${scriptFn})();`;
    return wsScript;
  }

  private async handleConsoleMessage(msgAdded: Protocol.Console.MessageAddedEvent): Promise<void> {
    if (msgAdded.message.source !== 'console-api' || msgAdded.message.level !== 'debug') return;

    let clientId: string;
    let name: string;
    let payload: any;

    try {
      // Doing this is much much cheaper than json parse on everything logged in console debug
      const [secret, maybeClientId, serializedData] = msgAdded.message.text.split(' """ ');
      if (secret !== this.secretKey) return;

      const data = JSON.parse(serializedData);
      name = data.name;
      payload = data.payload;
      clientId = maybeClientId;
    } catch {
      return;
    }

    let frameId = this.clientIdToTargetId.get(clientId);
    if (!frameId) {
      const resolvable = new Resolvable<string>();
      this.clientIdToTargetId.set(clientId, resolvable);
      frameId = await resolvable.promise;
    } else if (frameId instanceof Resolvable) {
      frameId = await frameId.promise;
    }

    this.emit('callback-received', { id: frameId, name, payload });
  }
}

/** This function will be stringified and inserted as a wrapper script so all injected
 * scripts have access to a callback function (over a websocket). This function takes
 * care of setting up that websocket and all other logic it needs as glue to make it all work.
 * */
function injectedScript(): void {
  const clientId = Math.random();

  // By using document.url.origin we avoid all content security problems
  const url = `${new URL(document.URL).origin}/heroInternalUrl?secretKey=${this.secretKey}&action=registerConsoleClientId&clientId=${clientId}`;

  // This will signal to network manager we are trying to make websocket connection
  // This is needed later to map clientId to frameId
  void fetch(url, { mode: 'no-cors' }).catch(() => undefined);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const callback = (name, payload): void => {
    const serializedData = JSON.stringify({ name, payload });
    // eslint-disable-next-line no-console
    console.debug(`${this.secretKey} """ ${clientId} """ ${serializedData}`);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  SCRIPT_PLACEHOLDER;
}
