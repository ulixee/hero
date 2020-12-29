import ICoreRequestPayload from '@secret-agent/core-interfaces/ICoreRequestPayload';
import ICoreEventPayload from '@secret-agent/core-interfaces/ICoreEventPayload';
import ICoreResponsePayload from '@secret-agent/core-interfaces/ICoreResponsePayload';
import { createPromise } from '@secret-agent/commons/utils';
import IResolvablePromise from '@secret-agent/core-interfaces/IResolvablePromise';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import Log from '@secret-agent/commons/Logger';
import ICoreConnectionOptions from '../interfaces/ICoreConnectionOptions';

const { log } = Log(module);

export default abstract class CoreClientConnection extends TypedEventEmitter<{
  close: void;
  connect: void;
  event: ICoreEventPayload;
}> {
  public options: ICoreConnectionOptions;
  protected isOpen = false;
  protected connectPromise: Promise<Error | null>;
  private readonly pendingById = new Map<string, IResolvablePromiseWithId>();
  private lastId = 0;

  constructor(options?: ICoreConnectionOptions) {
    super();
    this.options = options;
  }

  public abstract sendRequest(payload: ICoreRequestPayload): void | Promise<void>;

  public connect(): Promise<Error | null> {
    if (this.connectPromise) return this.connectPromise;
    this.connectPromise = this.send({
      command: 'connect',
      args: [this.options],
    })
      .then(x => {
        const { maxConcurrency, browserEmulatorIds } = x.data ?? {};
        if (!this.options.maxConcurrency || maxConcurrency < this.options.maxConcurrency) {
          log.info('Overriding max concurrency with Core value', {
            maxConcurrency,
            sessionId: null,
          });
          this.options.maxConcurrency = maxConcurrency;
        }
        this.options.browserEmulatorIds ??= browserEmulatorIds ?? [];
        this.emit('connect');
        return null;
      })
      .catch(err => err);
    this.isOpen = true;
    return this.connectPromise;
  }

  public async send(
    payload: Omit<ICoreRequestPayload, 'messageId'>,
  ): Promise<ICoreResponsePayload> {
    const { promise, id } = this.createPendingResult();
    await this.sendRequest({
      messageId: id,
      ...payload,
    });
    return promise;
  }

  public onMessage(payload: ICoreResponsePayload | ICoreEventPayload): void {
    if ((payload as ICoreResponsePayload).responseId) {
      payload = payload as ICoreResponsePayload;
      this.onResponse(payload.responseId, payload);
    } else if ((payload as ICoreEventPayload).listenerId) {
      this.emit('event', payload as ICoreEventPayload);
    } else {
      throw new Error(`message could not be processed: ${payload}`);
    }
  }

  public close(): Promise<void> {
    this.isOpen = false;
    this.emit('close');
    return Promise.resolve();
  }

  private onResponse(id: string, message: ICoreResponsePayload): void {
    const pending = this.pendingById.get(id);
    if (!pending) return;
    this.pendingById.delete(id);

    if (message.isError) {
      const error = new Error(message.data?.message);
      Object.assign(error, message.data);
      pending.reject(error);
    } else {
      pending.resolve({ data: message.data, commandId: message.commandId });
    }
  }

  private createPendingResult(): IResolvablePromiseWithId {
    const resolvablePromise = createPromise<ICoreResponsePayload>() as IResolvablePromiseWithId;
    this.lastId += 1;
    const id = this.lastId.toString();
    resolvablePromise.id = id;
    this.pendingById.set(id, resolvablePromise);
    return this.pendingById.get(id);
  }
}

interface IResolvablePromiseWithId extends IResolvablePromise<ICoreResponsePayload> {
  id: string;
}
