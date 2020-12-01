import FetchRequest from 'awaited-dom/impl/official-klasses/Request';
import AwaitedPath from 'awaited-dom/base/AwaitedPath';
import StateMachine from 'awaited-dom/base/StateMachine';
import { IRequestInfo, IRequestInit } from 'awaited-dom/base/interfaces/official';
import IAttachedState from 'awaited-dom/base/IAttachedState';
import CoreTab from './CoreTab';

interface IState {
  awaitedPath: AwaitedPath;
  attachedState: IAttachedState;
  remoteInitializerPromise: Promise<void>;
  coreTab: Promise<CoreTab>;
}

const { getState, setState } = StateMachine<FetchRequest, IState>();

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default function RequestGenerator(coreTab: Promise<CoreTab>) {
  return class Request extends FetchRequest {
    constructor(input: IRequestInfo, init?: IRequestInit) {
      super(input, init);

      setState(this, {
        coreTab,
        remoteInitializerPromise: createRemoteInitializer(this, coreTab, input, init),
      });
    }
  };
}

async function createRemoteInitializer(
  instance: FetchRequest,
  coreTabPromise: Promise<CoreTab>,
  input: IRequestInfo,
  init?: IRequestInit,
): Promise<void> {
  const requestInput = await getRequestIdOrUrl(input);
  const coreTab = await coreTabPromise;
  const attachedState = await coreTab.createRequest(requestInput, init);
  const awaitedPath = new AwaitedPath().withAttachedId(attachedState.id);
  setState(instance, {
    attachedState,
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
