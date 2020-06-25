import Protocol from 'devtools-protocol/types/protocol-mapping';

import Events = Protocol.Events;
import Commands = Protocol.Commands;

export default interface IDevtoolsClient {
  off<K extends keyof Events>(event: K, listenerFn: (this: this, args: Events[K][0]) => any);
  on<K extends keyof Events>(event: K, listenerFn: (this: this, args: Events[K][0]) => any);
  send<
    K extends keyof Commands,
    Params = Commands[K]['paramsType'][0],
    Return = Commands[K]['returnType']
  >(
    command: K,
    params?: Params,
  ): Promise<Return>;
}
