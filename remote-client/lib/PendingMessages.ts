import IResponsePayload from '@secret-agent/remote-interfaces/IResponsePayload';

export = class PendingMessages {
  private pending: { [id: string]: IPendingPromise } = {};
  private lastId = 0;

  public has(id) {
    return !!this.pending[id];
  }

  public createId() {
    this.lastId += 1;
    return this.lastId.toString();
  }

  public add(
    id: string,
    resolve: (value?: any | PromiseLike<any>) => void,
    reject: (reason?: any) => void,
  ) {
    if (this.pending[id]) throw new Error(`Id already exists in pending messages: ${id}`);
    this.pending[id] = { id, resolve, reject };
    return this.pending[id];
  }

  public respond(id: string, message: IResponsePayload) {
    if (!this.pending[id]) return;
    if (message.isError) {
      const error = new Error(message.data?.message);
      error.stack = message.data?.stack;
      error.name = message.data?.name;
      (error as any).data = message.data?.data;
      this.pending[id].reject(error);
    } else this.pending[id].resolve({ data: message.data, commandId: message.commandId });
    delete this.pending[id];
  }
};

interface IPendingPromise {
  id: string;
  resolve: (
    value?:
      | Pick<IResponsePayload, 'data' | 'commandId'>
      | PromiseLike<Pick<IResponsePayload, 'data' | 'commandId'>>,
  ) => void;
  reject: (reason?: any) => void;
  sending?: Promise<any>;
}
