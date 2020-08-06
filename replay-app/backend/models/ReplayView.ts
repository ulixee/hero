import * as http from 'http';
import Window from './Window';
import ReplayApi from '~backend/ReplayApi';
import IRectangle from '~shared/interfaces/IRectangle';
import Application from '~backend/Application';
import TabBackend from './TabBackend';
import { v1 as uuidv1 } from 'uuid';

const domReplayerScript = require.resolve('../../injected-scripts/domReplayer');

export default class ReplayView extends TabBackend {
  public replayApi: ReplayApi;

  public constructor(window: Window, replayApi: ReplayApi, replaceTabId?: number) {
    super(window, {
      preload: domReplayerScript,
      nodeIntegration: true,
      partition: uuidv1(),
      contextIsolation: true,
      javascript: false,
    });
    this.interceptHttpRequests();
    this.load(replayApi, true, replaceTabId);
  }

  public async load(replayApi, isNewTab = false, replaceTabId?: number) {
    if (this.browserView.isDestroyed()) return;
    if (!isNewTab && !this.isActiveTab) return;

    if (this.replayApi) {
      this.replayApi.removeAllListeners('session:updated');
      this.replayApi.isActive = false;
    }
    this.replayApi = replayApi;
    this.replayApi.on('session:updated', this.updateTabSession.bind(this));

    await this.window.webContents.session.clearCache();
    this.webContents.openDevTools({ mode: 'detach' });

    await this.webContents.loadURL(replayApi.saSession.pages[0].url);

    this.window.sendToRenderer('tab:updated', {
      id: this.id,
      currentTickValue: 0,
      saSession: replayApi.saSession,
      replaceTabId,
    });
  }

  public async changeTickOffset(offset: number) {
    this.onTick(offset);
    this.window.sendToRenderer('tab:updated', {
      id: this.id,
      currentTickValue: offset,
    });
  }

  public async onTick(tickValue: number) {
    if (!this.replayApi) return;
    const events = await this.replayApi.setTickValue(tickValue);
    if (!events) return;
    this.webContents.send('dom:apply', ...events);
    this.window.sendToRenderer('tab:page-url', { url: this.replayApi.urlOrigin, id: this.id });
  }

  public async onTickHover(rect: IRectangle, tickValue: number) {
    const tick = this.replayApi.saSession.ticks.find(x => x.playbarOffsetPercent === tickValue);
    if (!tick) return;

    const commandLabel = tick.label;
    const commandResult = this.replayApi.saSession.commandResults.find(
      x => x.commandId === tick.commandId,
    );
    Application.instance.overlayManager.show(
      'command-overlay',
      this.window.browserWindow,
      rect,
      commandLabel,
      commandResult,
    );
  }

  private updateTabSession() {
    const tabUpdateParam = {
      id: this.id,
      saSession: this.replayApi.saSession,
    };
    this.window.sendToRenderer('tab:updated', tabUpdateParam);

    if (this.replayApi.saSession.unresponsiveSeconds >= 5) {
      Application.instance.overlayManager.show(
        'message-overlay',
        this.window.browserWindow,
        this.window.browserWindow.getContentBounds(),
        {
          title: 'Did your script hang?',
          message: `The last update was ${this.replayApi.saSession.unresponsiveSeconds} seconds ago.`,
        },
      );
    } else {
      Application.instance.overlayManager.getByName('message-overlay').hide();
    }
  }

  private interceptHttpRequests() {
    const session = this.webContents.session;
    session.protocol.interceptHttpProtocol('http', (request, callback) => {
      const resourceUrl = this.replayApi.resourceUrl(request.url);
      callback({ url: resourceUrl });
    });
    session.protocol.interceptHttpProtocol('https', (request, callback) => {
      const resourceUrl = this.replayApi.resourceUrl(request.url);
      callback({ url: resourceUrl });
    });
  }
}
