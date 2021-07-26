import Log from '@ulixee/commons/lib/Logger';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import MitmSocket from '..';
import BaseIpcHandler, { IGoIpcOpts } from './BaseIpcHandler';

const { log } = Log(module);

export default class MitmSocketSession extends BaseIpcHandler {
  protected logger: IBoundLog;

  private readonly socketsById = new Map<number, MitmSocket>();

  constructor(readonly sessionId: string, options: IGoIpcOpts) {
    super({ ...options, mode: 'proxy' });
    this.logger = log.createChild(module, { sessionId });
  }

  public async requestSocket(socket: MitmSocket): Promise<void> {
    const id = socket.id;
    this.socketsById.set(id, socket);

    socket.on('close', () => this.socketsById.delete(id));

    await this.waitForConnected;

    try {
      await this.sendIpcMessage({
        id,
        socketPath: socket.socketPath,
        ...socket.connectOpts,
      });
    } catch (error) {
      if (this.isClosing) {
        return null;
      }
      this.logger.info('MitmSocketSession.requestSocketError', {
        error,
      });
    }
  }

  protected onMessage(rawMessage: string): void {
    if (this.isClosing) return;
    const message = JSON.parse(rawMessage);
    if (this.options.debug) {
      this.logger.info('MitmSocketSession.onMessage', {
        ...message,
      });
    }
    if (message?.id) {
      this.socketsById.get(message.id)?.onMessage(message);
    }
  }

  protected beforeExit(): void {
    for (const socket of this.socketsById.values()) {
      socket.onExit();
    }
    this.socketsById.clear();
  }
}
