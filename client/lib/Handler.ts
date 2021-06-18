import { createPromise, pickRandom } from '@secret-agent/commons/utils';
import ShutdownHandler from '@secret-agent/commons/ShutdownHandler';
import Log, { hasBeenLoggedSymbol } from '@secret-agent/commons/Logger';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import IAgentCreateOptions from '../interfaces/IAgentCreateOptions';
import IConnectionToCoreOptions from '../interfaces/IConnectionToCoreOptions';
import Agent from './Agent';
import ConnectionToCore from '../connections/ConnectionToCore';
import ConnectionFactory from '../connections/ConnectionFactory';
import DisconnectedFromCoreError from '../connections/DisconnectedFromCoreError';

type SettledDispatch = {
  sessionId: string;
  name: string;
  error?: Error;
  output: any;
  input: any;
  options: IAgentCreateOptions;
  retries: number;
};

type PendingDispatch = {
  resolution: Promise<Error | any>;
  sessionId?: string;
  options: IAgentCreateOptions;
  retries: number;
};

const { log } = Log(module);

export default class Handler {
  public disconnectedDispatchRetries = 3;
  public defaultAgentOptions: IAgentCreateOptions = {};
  public get coreHosts(): Promise<string[]> {
    return Promise.all(this.connections.map(x => x.hostOrError)).then(x => {
      const hosts: string[] = [];
      for (const host of x) {
        if (host instanceof Error) continue;
        hosts.push(host);
      }
      return hosts;
    });
  }

  private readonly connections: ConnectionToCore[] = [];
  private readonly dispatches: PendingDispatch[] = [];

  private isClosing = false;

  constructor(...connectionOptions: (IConnectionToCoreOptions | ConnectionToCore)[]) {
    if (!connectionOptions.length) {
      connectionOptions.push({});
    }

    for (const options of connectionOptions) {
      const connection = ConnectionFactory.createConnection(options);
      this.connections.push(connection);
      connection.on('disconnected', this.onDisconnected.bind(this, connection));
    }

    ShutdownHandler.register(() => this.close());
    this.registerUnhandledExceptionHandlers();
  }

  public async addConnectionToCore(
    options: IConnectionToCoreOptions | ConnectionToCore,
  ): Promise<void> {
    const connection = ConnectionFactory.createConnection(options);
    const error = await connection.connect();
    if (error) throw error;
    this.connections.push(connection);
  }

  public async removeConnectionToCore(host: string): Promise<void> {
    const wsHost = host.startsWith('ws') ? host : `ws://${host}`;
    for (const connection of this.connections) {
      const coreHost = await connection.hostOrError;
      if (typeof coreHost === 'string' && coreHost === wsHost) {
        await connection.disconnect();
      }
    }
  }

  public dispatchAgent(
    runFn: (agent: Agent) => Promise<void>,
    createAgentOptions?: IAgentCreateOptions,
  ): void {
    const options = {
      ...this.defaultAgentOptions,
      ...createAgentOptions,
    };

    this.internalDispatchAgent(runFn, options, {
      options,
      resolution: null,
      retries: 0,
    });
  }

  public async createAgent(createAgentOptions: IAgentCreateOptions = {}): Promise<Agent> {
    const options = {
      ...this.defaultAgentOptions,
      ...createAgentOptions,
    };
    const promise = createPromise<Agent>();

    const connection = this.getConnection();

    connection
      .useAgent(options, agent => {
        return agent
          .then(() => {
            // don't return until agent is closed
            const onClose = new Promise<void>(resolve => agent.once('close', resolve));
            promise.resolve(agent);
            return onClose;
          })
          .catch(promise.reject);
      })
      .catch(promise.reject);

    // NOTE: keep await to ensure createAgent stays in stack trace
    return await promise.promise;
  }

  public async waitForAllDispatches(): Promise<SettledDispatch[]> {
    const settledDispatches = new Map<PendingDispatch, Promise<SettledDispatch>>();
    const startStack = new Error('').stack.slice(8); // "Error: \n" is 8 chars

    do {
      // clear out dispatches everytime you check it
      const dispatches = this.dispatches.splice(0);

      // put in request order
      for (const dispatch of dispatches) {
        settledDispatches.set(
          dispatch,
          this.resolveDispatch(startStack, dispatch).then(x => {
            if (x.error) throw x.error;
            return x;
          }),
        );
      }
      await Promise.all(settledDispatches.values());

      await new Promise(setImmediate);
    } while (this.dispatches.length);

    return await Promise.all(settledDispatches.values());
  }

  public async waitForAllDispatchesSettled(): Promise<SettledDispatch[]> {
    const settledDispatches = new Map<PendingDispatch, Promise<SettledDispatch>>();
    const startStack = new Error('').stack.slice(8); // "Error: \n" is 8 chars

    do {
      // clear out dispatches everytime you check it
      const dispatches = this.dispatches.splice(0);
      for (const dispatch of dispatches) {
        settledDispatches.set(dispatch, this.resolveDispatch(startStack, dispatch));
      }
      await Promise.all(settledDispatches.values());

      await new Promise(setImmediate);
    } while (this.dispatches.length);

    return await Promise.all(settledDispatches.values());
  }

  public async close(error?: Error): Promise<void> {
    if (this.isClosing) return;
    this.isClosing = true;
    // eslint-disable-next-line promise/no-promise-in-callback
    await Promise.all(this.connections.map(x => x.disconnect(error).catch(() => null)));
  }

  private async resolveDispatch(
    startStack: string,
    dispatch: PendingDispatch,
  ): Promise<SettledDispatch> {
    const { sessionId, resolution, options, retries } = dispatch;
    const dispatchResolution = <SettledDispatch>{
      options: { ...options, connectionToCore: undefined },
      name: options.name,
      sessionId,
      error: undefined,
      output: undefined,
      retries,
    };
    const result = await resolution;
    if (result instanceof Error) {
      const marker = `------WAIT FOR ALL DISPATCHES`.padEnd(50, '-');
      result.stack += `\n${marker}\n${startStack}`;
      dispatchResolution.error = result;
    } else {
      dispatchResolution.output = result;
    }
    return dispatchResolution;
  }

  private internalDispatchAgent(
    runFn: (agent: Agent) => Promise<void>,
    options: IAgentCreateOptions,
    dispatched: PendingDispatch,
  ): void {
    // if no available connection, return
    const connection = this.getConnection();
    if (!connection) {
      dispatched.resolution = Promise.resolve(
        new Error("There aren't any connections available to dispatch this agent"),
      );
      this.dispatches.push(dispatched);
      return;
    }

    dispatched.resolution = connection
      .useAgent(options, async agent => {
        try {
          dispatched.sessionId = await agent.sessionId;
          dispatched.options.name = await agent.sessionName;
          await runFn(agent);
        } finally {
          await agent.close();
        }
        return agent.output.toJSON();
      })
      .catch(err => {
        const canRetry =
          !dispatched.sessionId && dispatched.retries < this.disconnectedDispatchRetries;
        if (canRetry && !this.isClosing && this.connections.length) {
          dispatched.retries += 1;
          return this.internalDispatchAgent(runFn, options, dispatched);
        }

        return err;
      });

    this.dispatches.push(dispatched);
  }

  private getAvailableConnections(): ConnectionToCore[] {
    // prefer a connection that can create a session right now
    let connections = this.connections.filter(x => x.canCreateSessionNow());
    if (!connections.length) connections = this.connections.filter(x => !x.isDisconnecting);
    return connections;
  }

  private getConnection(): ConnectionToCore {
    const connections = this.getAvailableConnections();
    if (!connections.length) throw new Error('There are no active Core connections available.');
    return pickRandom(connections);
  }

  private registerUnhandledExceptionHandlers(): void {
    if (process.env.NODE_ENV === 'test') return;

    process.on('uncaughtExceptionMonitor', this.close.bind(this));
    process.on('unhandledRejection', this.logUnhandledError.bind(this));
  }

  private async logUnhandledError(error: Error): Promise<void> {
    if (error instanceof DisconnectedFromCoreError) return;
    if (!error || error[hasBeenLoggedSymbol]) return;
    // if error and there are remote connections, log error here
    if (this.connections.some(x => !!x.options.host)) {
      log.error('UnhandledRejection (Client)', { error, sessionId: null });
    }
    // eslint-disable-next-line promise/no-promise-in-callback
    await Promise.all(
      this.connections.map(x => {
        return x.logUnhandledError(error).catch(logError => {
          if (logError instanceof CanceledPromiseError) return;
          log.error('UnhandledRejection.CouldNotSendToCore', {
            error: logError,
            connectionHost: x.hostOrError,
            sessionId: null,
          });
        });
      }),
    );
  }

  private onDisconnected(connection: ConnectionToCore): void {
    const idx = this.connections.indexOf(connection);
    if (idx >= 0) this.connections.splice(idx, 1);
  }
}
