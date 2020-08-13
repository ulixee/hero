import * as http from 'http';
import Window from './Window';
import ReplayApi from '~backend/api';
import IRectangle from '~shared/interfaces/IRectangle';
import Application from '~backend/Application';
import TabBackend from './TabBackend';
import { v1 as uuidv1 } from 'uuid';
import ReplayState from '~backend/api/ReplayState';

const domReplayerScript = require.resolve('../../injected-scripts/domReplayerSubscribe');

export default class ReplayView extends TabBackend {
  public replayApi: ReplayApi;

  private get state(): ReplayState {
    return this.replayApi?.state;
  }

  public constructor(window: Window, replayApi: ReplayApi, replaceTabId?: number) {
    super(window, {
      preload: domReplayerScript,
      enableRemoteModule: false,
      partition: uuidv1(),
      contextIsolation: true,
      javascript: false,
    });
    this.interceptHttpRequests();
    this.load(replayApi, true, replaceTabId);
  }

  public async load(replayApi: ReplayApi, isNewTab = false, replaceTabId?: number) {
    if (this.browserView.isDestroyed()) return;
    if (!isNewTab && !this.isActiveTab) return;

    if (this.replayApi) {
      this.replayApi.removeAllListeners('ticks:updated');
      this.replayApi.close();
    }
    this.replayApi = replayApi;
    this.replayApi.on('ticks:updated', this.updateFrontendTicks.bind(this));

    await this.window.webContents.session.clearCache();
    this.webContents.openDevTools({ mode: 'detach', activate: false });

    await this.replayApi.isReady;
    await this.webContents.loadURL(replayApi.state.startOrigin);

    this.window.sendToRenderer('tab:updated', {
      id: this.id,
      currentTickValue: 0,
      saSession: replayApi.saSession,
      replaceTabId,
      tickState: this.state.getTickState(),
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
    const events = this.state.setTickValue(tickValue);
    this.publishTickChanges(events);
  }

  public nextTick() {
    const events = this.state.nextTick();
    this.publishTickChanges(events);
    return this.state.currentPlaybarOffsetPct;
  }

  public onTickHover(rect: IRectangle, tickValue: number) {
    const tick = this.state.ticks.find(x => x.playbarOffsetPercent === tickValue);
    if (!tick) return;

    const commandLabel = tick.label;
    const commandResult =
      tick.eventType === 'command'
        ? this.state.commands.find(x => x.id === tick.commandId)
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

  private publishTickChanges(events: any[]) {
    if (!events) return;
    this.webContents.send('dom:apply', ...events);
    this.window.sendToRenderer('tab:page-url', { url: this.state.urlOrigin, id: this.id });
  }

  private async updateFrontendTicks() {
    await this.replayApi.isReady;
    const tabUpdateParam = {
      id: this.id,
      tickState: this.state.getTickState(),
    };
    this.window.sendToRenderer('tab:updated', tabUpdateParam);

    if (this.state.unresponsiveSeconds >= 5) {
      Application.instance.overlayManager.show(
        'message-overlay',
        this.window.browserWindow,
        this.window.browserWindow.getContentBounds(),
        {
          title: 'Did your script hang?',
          message: `The last update was ${this.state.unresponsiveSeconds} seconds ago.`,
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
