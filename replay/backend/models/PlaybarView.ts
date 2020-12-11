import Window from '~backend/models/Window';
import Application from '~backend/Application';
import IRectangle from '~shared/interfaces/IRectangle';
import ReplayTabState from '~backend/api/ReplayTabState';
import ViewBackend from '~backend/models/ViewBackend';

export default class PlaybarView extends ViewBackend {
  private readonly isReady: Promise<void>;
  private tabState: ReplayTabState;
  private isLoaded = false;
  private playOnLoaded = false;

  constructor(window: Window) {
    super(window, {
      sandbox: false,
      nodeIntegration: true,
      enableRemoteModule: true,
    });

    this.browserView.setAutoResize({
      width: true,
      height: false,
      horizontal: false,
      vertical: true,
    });

    const url = Application.instance.getPageUrl('playbar');
    this.isReady = this.browserView.webContents.loadURL(url);
    this.updateFrontendTicks = this.updateFrontendTicks.bind(this);
  }

  public async load(tabState: ReplayTabState) {
    this.isLoaded = false;
    this.attach();

    // remove existing listeners
    if (this.tabState) this.tabState.off('tick:changes', this.updateFrontendTicks);

    this.tabState = tabState;
    this.tabState.on('tick:changes', this.updateFrontendTicks);

    await this.isReady;

    this.browserView.webContents.send('ticks:load', this.tabState.getTickState());
    this.isLoaded = true;
    if (this.playOnLoaded) this.play();
  }

  public play() {
    if (!this.isLoaded) {
      this.playOnLoaded = true;
    } else {
      this.playOnLoaded = false;
      this.browserView.webContents.send('start');
    }
  }

  public pause() {
    this.playOnLoaded = false;
    this.browserView.webContents.send('pause');
  }

  public changeTickOffset(offset: number) {
    this.browserView.webContents.send('ticks:change-offset', offset);
  }

  public onTickHover(rect: IRectangle, tickValue: number) {
    if (!this.isAttached) return;
    const tick = this.tabState.ticks.find(x => x.playbarOffsetPercent === tickValue);
    if (!tick) return;

    const bounds = this.browserView.getBounds();
    // set rect y to the top of the playbar
    rect.y = bounds.y;
    const commandLabel = tick.label;
    const commandResult =
      tick.eventType === 'command'
        ? this.tabState.commands.find(x => x.id === tick.commandId)
        : {
            duration: 0,
          };
    Application.instance.overlayManager.show(
      'command-overlay',
      this.window.browserWindow,
      rect,
      commandLabel,
      commandResult,
    );
  }

  private updateFrontendTicks() {
    this.browserView.webContents.send('ticks:updated', this.tabState.getTickState());
  }
}
