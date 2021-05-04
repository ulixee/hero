import FetchRequest from 'awaited-dom/impl/official-klasses/Request';
import AwaitedPath from 'awaited-dom/base/AwaitedPath';
import StateMachine from 'awaited-dom/base/StateMachine';
import { IRequestInfo, IRequestInit } from 'awaited-dom/base/interfaces/official';
import INodePointer from 'awaited-dom/base/INodePointer';
import CoreFrameEnvironment from './CoreFrameEnvironment';

interface IState {
  awaitedPath: AwaitedPath;
  nodePointer: INodePointer;
  remoteInitializerPromise: Promise<void>;
  coreFrame: Promise<CoreFrameEnvironment>;
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
