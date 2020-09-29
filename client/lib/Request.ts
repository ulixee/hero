import FetchRequest from 'awaited-dom/impl/official-klasses/Request';
import AwaitedPath from 'awaited-dom/base/AwaitedPath';
import StateMachine from 'awaited-dom/base/StateMachine';
import { IRequestInfo, IRequestInit } from 'awaited-dom/base/interfaces/official';
import CoreTab from './CoreTab';

interface IState {
  awaitedPath: AwaitedPath;
  remoteInitializerPromise: Promise<void>;
  coreTab: CoreTab;
}

const { getState, setState } = StateMachine<FetchRequest, IState>();

export default function RequestGenerator(coreTab: CoreTab) {
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
  coreTab: CoreTab,
  input: IRequestInfo,
  init?: IRequestInit,
) {
  const requestInput = await getRequestIdOrUrl(input);
  const attachedState = await coreTab.createRequest(requestInput, init);
  const awaitedPath = new AwaitedPath().withAttachedId(attachedState.id);
  setState(instance, {
    attachedState,
    awaitedPath,
  });
}

export async function getRequestIdOrUrl(input: IRequestInfo) {
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
