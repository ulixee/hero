import FetchRequest from '@ulixee/awaited-dom/impl/official-klasses/Request';
import AwaitedPath from '@ulixee/awaited-dom/base/AwaitedPath';
import StateMachine from '@ulixee/awaited-dom/base/StateMachine';
import { IRequestInfo, IRequestInit } from '@ulixee/awaited-dom/base/interfaces/official';
import { INodePointer } from '@ulixee/js-path';
import CoreFrameEnvironment from './CoreFrameEnvironment';
import IAwaitedOptions from '../interfaces/IAwaitedOptions';

interface IState extends IAwaitedOptions {
  awaitedPath: AwaitedPath;
  nodePointer: INodePointer;
}

const { getState, setState } = StateMachine<FetchRequest, IState>();

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default function RequestGenerator(coreFrame: Promise<CoreFrameEnvironment>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return class Request extends FetchRequest {
    constructor(input: IRequestInfo, init?: IRequestInit) {
      super(input, init);

      setState(this, {
        coreFrame,
        remoteInitializerPromise: createRemoteInitializer(this, coreFrame, input, init),
      });
    }
  };
}

async function createRemoteInitializer(
  instance: FetchRequest,
  coreFramePromise: Promise<CoreFrameEnvironment>,
  input: IRequestInfo,
  init?: IRequestInit,
): Promise<void> {
  const requestInput = await getRequestIdOrUrl(input);
  const coreFrame = await coreFramePromise;
  const nodePointer = await coreFrame.createRequest(requestInput, init);
  const awaitedPath = new AwaitedPath(null).withNodeId(null, nodePointer.id);
  setState(instance, {
    nodePointer,
    awaitedPath,
  });
}

export async function getRequestIdOrUrl(input: IRequestInfo): Promise<number | string> {
  let requestInput: number | string;
  if (typeof input === 'string') {
    requestInput = input;
  } else {
    // wait for request being cloned if needed
    await getState(input).remoteInitializerPromise;
    const awaitedPath = getState(input).awaitedPath as AwaitedPath;
    requestInput = awaitedPath.toJSON()[0] as number;
  }
  return requestInput;
}
