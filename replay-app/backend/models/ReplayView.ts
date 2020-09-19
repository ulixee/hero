import { v1 as uuidv1 } from 'uuid';
import Window from './Window';
import ReplayApi from '~backend/api';
import IRectangle from '~shared/interfaces/IRectangle';
import Application from '~backend/Application';
import TabBackend from './TabBackend';
import ReplayTabState from '~backend/api/ReplayTabState';

const domReplayerScript = require.resolve('../../injected-scripts/domReplayerSubscribe');

interface IReplayViewOptions {
  replaceFrontendTabId?: number;
  replayTabId?: string;
  isNewTab?: boolean;
}

export default class ReplayView extends TabBackend {
  public replayApi: ReplayApi;
  public tabState: ReplayTabState;

  public constructor(window: Window, replayApi: ReplayApi, options: IReplayViewOptions) {
    super(window, {
      preload: domReplayerScript,
      enableRemoteModule: false,
      partition: uuidv1(),
      contextIsolation: true,
      javascript: false,
    });
    this.interceptHttpRequests();
    this.load(replayApi, options);
  }

  public async load(replayApi: ReplayApi, options: IReplayViewOptions = { isNewTab: false }) {
    if (this.browserView.isDestroyed()) return;

    console.log('loading replayview', options);
    const { replaceFrontendTabId } = options;

    this.clearState();

    this.replayApi = replayApi;

    await this.window.webContents.session.clearCache();
    this.webContents.openDevTools({ mode: 'detach', activate: false });

    await this.replayApi.isReady;
    if (options.replayTabId) {
      this.tabState = this.replayApi.getTab(options.replayTabId);
    } else {
      this.tabState = this.replayApi.getStartTab;
    }
    console.log('loaded tab state', this.tabState.startOrigin);

    this.tabState.onChangesFn = this.updateFrontendTicks.bind(this);
    await this.webContents.loadURL(this.tabState.startOrigin);

    this.window.sendToRenderer('tab:updated', {
      id: this.id,
      currentTickValue: 0,
      saSession: replayApi.saSession,
      replaceFrontendTabId,
      tickState: this.tabState.getTickState(),
    });
  }

  public async changeTickOffset(offset: number) {
    this.onTick(offset);
    this.window.sendToRenderer('tab:updated', {
      id: this.id,
      currentTickValue: offset,
    });
  }

  public onTick(tickValue: number) {
    if (!this.replayApi) return;
    const events = this.tabState.setTickValue(tickValue);
    this.publishTickChanges(events);
  }

  public nextTick() {
    const events = this.tabState.nextTick();
    this.publishTickChanges(events);
    return this.tabState.currentPlaybarOffsetPct;
  }

  public onTickHover(rect: IRectangle, tickValue: number) {
    const tick = this.tabState.ticks.find(x => x.playbarOffsetPercent === tickValue);
    if (!tick) return;

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

  public destroy() {
    super.destroy();
    this.clearState();
  }

  private clearState() {
    if (this.tabState) this.tabState.onChangesFn = null;
    this.replayApi?.close();
    this.tabState = null;
    this.replayApi = null;
  }

  private publishTickChanges(events: any[]) {
    if (!events) return;
    this.webContents.send('dom:apply', ...events);
    this.window.sendToRenderer('tab:page-url', { url: this.tabState.urlOrigin, id: this.id });
  }

  private async updateFrontendTicks() {
    await this.replayApi.isReady;

    const tabUpdateParam = {
      id: this.id,
      tickState: this.tabState.getTickState(),
    };
    this.window.sendToRenderer('tab:updated', tabUpdateParam);

    if (this.replayApi.unresponsiveSeconds >= 5) {
      Application.instance.overlayManager.show(
        'message-overlay',
        this.window.browserWindow,
        this.window.browserWindow.getContentBounds(),
        {
          title: 'Did your script hang?',
          message: `The last update was ${this.replayApi.unresponsiveSeconds} seconds ago.`,
        },
      );
    } else {
      Application.instance.overlayManager.getByName('message-overlay').hide();
    }
  }

  private interceptHttpRequests() {
    const session = this.webContents.session;
    session.protocol.interceptStreamProtocol('http', async (request, callback) => {
      console.log('intercepting http buffer', request.url);
      const result = await this.replayApi.getResource(request.url);
      callback(result);
    });
    session.protocol.interceptStreamProtocol('https', async (request, callback) => {
      console.log('intercepting https buffer', request.url);
      const result = await this.replayApi.getResource(request.url);
      callback(result);
    });
  }
}
