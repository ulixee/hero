import ICoreResponsePayload from '@ulixee/net/interfaces/ICoreResponsePayload';
import ICoreCommandRequestPayload from '@ulixee/hero-interfaces/ICoreCommandRequestPayload';
import EmittingTransportToCore from '@ulixee/net/lib/EmittingTransportToCore';
import ICoreListenerPayload from '@ulixee/hero-interfaces/ICoreListenerPayload';
import ConnectionToHeroCore from '../connections/ConnectionToHeroCore';
export default class MockConnectionToCore extends ConnectionToHeroCore {
    outgoingSpy: jest.Mock<any, any, any>;
    transport: EmittingTransportToCore;
    constructor(mockMessageFn: (message: ICoreCommandRequestPayload) => ICoreResponsePayload<any, any> | Promise<ICoreResponsePayload<any, any>>);
    fakeEvent(event: ICoreListenerPayload): void;
}
