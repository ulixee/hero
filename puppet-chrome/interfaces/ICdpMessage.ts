import { ProtocolMapping } from 'devtools-protocol/types/protocol-mapping';

export interface ICdpMessage<T = keyof ProtocolMapping.Commands & string> {
  method: T;
  params: any;
  sessionId?: string;
}
