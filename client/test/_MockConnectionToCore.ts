import ICoreResponsePayload from '@ulixee/net/interfaces/ICoreResponsePayload';
import ICoreCommandRequestPayload from '@ulixee/hero-interfaces/ICoreCommandRequestPayload';
import EmittingTransportToCore from '@ulixee/net/lib/EmittingTransportToCore';
import ICoreListenerPayload from '@ulixee/hero-interfaces/ICoreListenerPayload';
import ConnectionToHeroCore from '../connections/ConnectionToHeroCore';

export default class MockConnectionToCore extends ConnectionToHeroCore {
  public outgoingSpy = jest.fn();
  public override transport: EmittingTransportToCore;

  constructor(
    mockMessageFn: (
      message: ICoreCommandRequestPayload,
    ) => ICoreResponsePayload<any, any> | Promise<ICoreResponsePayload<any, any>>,
  ) {
    super(new EmittingTransportToCore());

    this.transport.on('outbound', async payload => {
      this.outgoingSpy(payload);
      const response = await mockMessageFn(payload);
      this.transport.emit('message', response);
    });
  }

  public fakeEvent(event: ICoreListenerPayload): void {
    this.onEvent(event);
  }
}
