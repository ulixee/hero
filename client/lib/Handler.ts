import { createPromise, pickRandom } from '@secret-agent/commons/utils';
import Log from '@secret-agent/commons/Logger';
import IAgentCreateOptions from '../interfaces/IAgentCreateOptions';
import ICoreConnectionOptions from '../interfaces/ICoreConnectionOptions';
import CoreClient from './CoreClient';
import Agent from './Agent';
import CoreClientConnection from './CoreClientConnection';
import RemoteCoreConnection from './RemoteCoreConnection';
import Signals = NodeJS.Signals;

const { log } = Log(module);

export default class Handler {
  public defaultAgentOptions: IAgentCreateOptions = {};
  private readonly coreClients: CoreClient[] = [];
  private readonly dispatches: Promise<Error | void>[] = [];

  constructor(...connectionOptions: (ICoreConnectionOptions | CoreClientConnection)[]) {
    if (!connectionOptions.length) {
      connectionOptions.push({});
    }

    let needsHandlers = false;
    for (const options of connectionOptions) {
      const coreClient = this.createCoreClient(options);
      this.coreClients.push(coreClient);

      if (coreClient.hasRemoteConnection()) needsHandlers = true;
    }

    if (needsHandlers) {
      this.registerShutdownHandlers();
      this.registerUnhandledExceptionHandlers();
    }
  }

  public dispatchAgent<T>(
    runFn: (agent: Agent, args?: T) => Promise<void>,
    args?: T,
    createAgentOptions?: IAgentCreateOptions,
  ): void {
    const options = {
      ...this.defaultAgentOptions,
      ...createAgentOptions,
    };
    const coreClient = pickRandom(this.coreClients);

    // NOTE: keep await to ensure dispatch stays in stack trace
    const promise = coreClient
      .useAgent(options, async agent => {
        try {
          return await runFn(agent, args);
        } finally {
          await agent.close();
        }
      })
      .catch((err: Error) => err);
    this.dispatches.push(promise);
  }

  public async createAgent(createAgentOptions: IAgentCreateOptions = {}): Promise<Agent> {
    const options = {
      ...this.defaultAgentOptions,
      ...createAgentOptions,
    };
    const promise = createPromise<Agent>();

    const coreClient = pickRandom(this.coreClients);

    coreClient
      .useAgent(options, agent => {
        // don't return until agent is closed
        const onClose = new Promise<void>(resolve => agent.on('close', resolve));
        promise.resolve(agent);
        return onClose;
      })
      .catch(promise.reject);

    // NOTE: keep await to ensure createAgent stays in stack trace
    return await promise.promise;
  }

  public async waitForAllDispatches(): Promise<void> {
    const dispatches = [...this.dispatches];
    this.dispatches.length = 0;
    await Promise.all(
      dispatches.map(async dispatch => {
        const err = await dispatch;
        if (err) throw err;
      }),
    );
    // keep going if there are new things queued
    if (this.dispatches.length) return this.waitForAllDispatches();
  }

  public async close(error?: Error): Promise<void> {
    // eslint-disable-next-line promise/no-promise-in-callback
    await Promise.all(this.coreClients.map(x => x.disconnect(error)));
  }

  public registerShutdownHandlers(): void {
    for (const signal of ['exit', 'SIGTERM', 'SIGINT', 'SIGQUIT']) {
      process.once(signal as Signals, this.close.bind(this));
    }
  }

  public registerUnhandledExceptionHandlers(): void {
    process.on('uncaughtExceptionMonitor', this.close.bind(this));
    process.on('unhandledRejection', this.logUnhandledError.bind(this));
  }

  private async logUnhandledError(error: Error): Promise<void> {
    // eslint-disable-next-line promise/no-promise-in-callback
    await Promise.all(this.coreClients.map(x => x.logUnhandledError(error)));
  }

  private createCoreClient(options: ICoreConnectionOptions | CoreClientConnection): CoreClient {
    if (options instanceof CoreClientConnection) {
      // NOTE: don't run connect on an instance
      return new CoreClient(options);
    }

    let connection: CoreClientConnection;
    if (options.host) {
      connection = new RemoteCoreConnection(options);
    } else {
      if (!CoreClient.LocalCoreConnectionCreator) {
        throw new Error(
          `You need to install the full "npm i secret-agent" installation to use local connections.

If you meant to connect to a remote host, include the "host" parameter for your connection`,
        );
      }
      connection = CoreClient.LocalCoreConnectionCreator(options);
    }
    connection.connect().catch(error =>
      log.error('Error connecting to core', {
        error,
        sessionId: null,
      }),
    );
    return new CoreClient(connection);
  }
}
