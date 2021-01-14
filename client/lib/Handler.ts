import { createPromise, pickRandom } from '@secret-agent/commons/utils';
import IAgentCreateOptions from '../interfaces/IAgentCreateOptions';
import IConnectionToCoreOptions from '../interfaces/IConnectionToCoreOptions';
import Agent from './Agent';
import ConnectionToCore from '../connections/ConnectionToCore';
import ConnectionFactory from '../connections/ConnectionFactory';
import Signals = NodeJS.Signals;

export default class Handler {
  public defaultAgentOptions: IAgentCreateOptions = {};
  private readonly connections: ConnectionToCore[] = [];
  private readonly dispatches: Promise<Error | void>[] = [];

  constructor(...connectionOptions: (IConnectionToCoreOptions | ConnectionToCore)[]) {
    if (!connectionOptions.length) {
      connectionOptions.push({});
    }

    for (const options of connectionOptions) {
      const connection = ConnectionFactory.createConnection(options);
      this.connections.push(connection);
    }

    this.registerShutdownHandlers();
    this.registerUnhandledExceptionHandlers();
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
    const connection = pickRandom(this.connections);

    // NOTE: keep await to ensure dispatch stays in stack trace
    const promise = connection
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

    const connection = pickRandom(this.connections);

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
    await Promise.all(this.connections.map(x => x.disconnect(error)));
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
    await Promise.all(this.connections.map(x => x.logUnhandledError(error)));
  }
}
