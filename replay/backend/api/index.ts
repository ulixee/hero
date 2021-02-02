import * as WebSocket from 'ws';
import { ChildProcess, spawn } from 'child_process';
import * as Path from 'path';
import ISaSession from '~shared/interfaces/ISaSession';
import IReplayMeta from '~shared/interfaces/IReplayMeta';
import ReplayResources, { IReplayHttpResource } from '~backend/api/ReplayResources';
import getResolvable from '~shared/utils/promise';
import ReplayTabState from '~backend/api/ReplayTabState';
import ReplayTime from '~backend/api/ReplayTime';

export default class ReplayApi {
  public static serverProcess: ChildProcess;
  public static serverStartPath: string;
  public static nodePath: string;
  private static websockets = new Set<WebSocket>();
  private static localApiHost: string;

  public readonly saSession: ISaSession;
  public tabs: ReplayTabState[] = [];
  public apiHost: string;
  public lastActivityDate: Date;
  public lastCommandName: string;
  public showUnresponsiveMessage = true;
  public hasAllData = false;

  public onNewTab?: (tab: ReplayTabState) => any;

  public get isReady() {
    return this.isReadyResolvable.promise;
  }

  public get getStartTab(): ReplayTabState {
    return this.tabs[0];
  }

  private replayTime: ReplayTime;
  private readonly isReadyResolvable = getResolvable<void>();

  private readonly websocket: WebSocket;

  private resources: ReplayResources = new ReplayResources();

  constructor(apiHost: string, replay: IReplayMeta) {
    this.apiHost = apiHost;
    this.saSession = {
      ...replay,
      name: replay.sessionName,
      id: replay.sessionId,
    } as any;

    const headers: any = {};
    for (const [key, value] of Object.entries({
      'data-location': this.saSession.dataLocation,
      'session-name': this.saSession.name,
      'session-id': this.saSession.id,
      'script-instance-id': this.saSession.scriptInstanceId,
      'script-entrypoint': this.saSession.scriptEntrypoint,
    })) {
      if (value) headers[key] = value;
    }

    this.websocket = new WebSocket(apiHost, {
      headers,
    });

    this.websocket.once('open', () => {
      this.websocket.off('error', this.isReadyResolvable.reject);
    });
    this.websocket.once('error', this.isReadyResolvable.reject);

    ReplayApi.websockets.add(this.websocket);
    this.websocket.on('close', () => {
      ReplayApi.websockets.delete(this.websocket);
      console.log('Ws Session closed', this.saSession.id);
    });
    this.websocket.on('message', this.onMessage.bind(this));
  }

  public getResource(url: string): Promise<IReplayHttpResource> {
    return this.resources.get(url);
  }

  public close(): void {
    if (this.tabs.some(x => x.isActive)) return;

    this.websocket.close();
    ReplayApi.websockets.delete(this.websocket);
  }

  public getTab(tabId: string): ReplayTabState {
    return this.tabs.find(x => x.tabId === tabId);
  }

  private async onMessage(messageData: WebSocket.Data): Promise<void> {
    const { event, data } = parseJSON(messageData);

    if (event === 'trailer') {
      this.hasAllData = true;
      for (const tab of this.tabs) tab.hasAllData = true;
      console.log('All data received', data);
      return;
    }

    if (event === 'error') {
      this.isReadyResolvable.reject(data.message);
      return;
    }

    if (event === 'session') {
      this.onSession(data);
      return;
    }

    // don't load api data until the session is ready
    await this.isReady;
    this.onApiFeed(event, data);
  }

  private onApiFeed(eventName: string, data: any) {
    console.log('Replay Api Feed', eventName);
    const tabsWithChanges = new Set<ReplayTabState>();
    if (eventName === 'script-state') {
      console.log('ScriptState', data);
      const closeDate = data.closeDate ? new Date(data.closeDate) : null;
      this.replayTime.update(closeDate);
      this.lastActivityDate = data.lastActivityDate ? new Date(data.lastActivityDate) : null;
      this.lastCommandName = data.lastCommandName;
      for (const tab of this.tabs) tabsWithChanges.add(tab);
    } else {
      for (const event of data) {
        let tab = this.getTab(event.tabId);
        if (!tab) {
          console.log('New Tab created in replay');
          const tabMeta = {
            tabId: event.tabId,
            createdTime: event.timestamp ?? event.startDate,
            width: this.tabs[0].viewportWidth,
            height: this.tabs[0].viewportHeight,
          };
          tab = new ReplayTabState(tabMeta, this.replayTime);
          if (this.onNewTab) this.onNewTab(tab);

          this.tabs.push(tab);
        }
        tabsWithChanges.add(tab);

        if (eventName === 'resources') this.resources.onResource(event);
        else if (eventName === 'dom-changes') tab.loadDomChange(event);
        else if (eventName === 'commands') {
          if (!this.replayTime.close) this.replayTime.update();
          tab.loadCommand(event);
        } else if (eventName === 'mouse-events') tab.loadPageEvent('mouse', event);
        else if (eventName === 'focus-events') tab.loadPageEvent('focus', event);
        else if (eventName === 'scroll-events') tab.loadPageEvent('scroll', event);
      }
    }
    for (const tab of tabsWithChanges) tab.sortTicks();
  }

  private onSession(data: ISaSession) {
    // parse strings to dates from api
    data.startDate = new Date(data.startDate);
    data.closeDate = data.closeDate ? new Date(data.closeDate) : null;

    Object.assign(this.saSession, data);

    console.log(`Loaded ReplayApi.sessionMeta`, {
      sessionId: data.id,
      dataLocation: data.dataLocation,
      start: data.startDate,
      close: data.closeDate,
      tabs: data.tabs,
    });

    this.replayTime = new ReplayTime(data.startDate, data.closeDate);
    this.tabs = data.tabs.map(x => new ReplayTabState(x, this.replayTime));

    this.isReadyResolvable.resolve();
  }

  public static quit() {
    console.log(
      'Shutting down Replay API. Process? %s. Open Sessions: %s',
      !!ReplayApi.serverProcess,
      ReplayApi.websockets.size,
    );
    for (const socket of ReplayApi.websockets) socket.terminate();
    if (ReplayApi.serverProcess) ReplayApi.serverProcess.kill();
  }

  public static async connect(replay: IReplayMeta) {
    if (!replay.replayApiUrl && !this.serverProcess) {
      await ReplayApi.startServer();
    }

    console.log('Connecting to Replay API', replay.replayApiUrl || this.localApiHost);
    const api = new ReplayApi(replay.replayApiUrl || this.localApiHost, replay);
    try {
      await api.isReady;
    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
        replay.replayApiUrl = null;
        if (this.serverProcess) {
          this.serverProcess.kill();
          this.serverProcess = null;
        }
        return this.connect(replay);
      }
      throw err;
    }
    return api;
  }

  private static async startServer() {
    if (this.localApiHost) return;

    const args = [];
    if (!this.serverStartPath) {
      const replayDir = __dirname.split(`${Path.sep}replay${Path.sep}`).shift();
      this.serverStartPath = Path.resolve(replayDir, 'core', 'start');
    }
    if (!this.nodePath) this.nodePath = 'node';
    console.log('Launching Replay API Server at %s', this.serverStartPath);
    const child = spawn(`${this.nodePath} "${this.serverStartPath}"`, args, {
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
      shell: true,
      windowsHide: true,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        SA_REPLAY_DEBUG: process.env.SA_REPLAY_DEBUG,
        DEBUG: process.env.DEBUG,
      },
    });

    child.on('error', console.error);
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    process.once('exit', () => {
      this.serverProcess?.kill();
    });
    this.serverProcess = child;
    this.serverProcess.once('exit', () => {
      child.stderr.unpipe();
      child.stdout.unpipe();
      this.serverProcess = null;
    });

    const promise = await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('message', message => {
        resolve(message as string);
        child.off('error', reject);
      });
    });

    this.localApiHost = `${await promise}/replay`;
    return child;
  }
}

function parseJSON(data: WebSocket.Data) {
  return JSON.parse(data.toString(), (key, value) => {
    if (
      typeof value === 'object' &&
      value !== null &&
      value.type === 'Buffer' &&
      Array.isArray(value.data)
    ) {
      return Buffer.from(value.data);
    }
    return value;
  });
}
