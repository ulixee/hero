import * as WebSocket from 'ws';
import { ChildProcess, spawn } from 'child_process';
import * as Path from 'path';
import * as Http from 'http';
import * as Fs from 'fs';
import { app, ProtocolResponse } from 'electron';
import IHeroSession, { ISessionTab } from '~shared/interfaces/IHeroSession';
import IReplayMeta from '~shared/interfaces/IReplayMeta';
import ReplayResources from '~backend/api/ReplayResources';
import getResolvable from '~shared/utils/promise';
import ReplayTabState from '~backend/api/ReplayTabState';
import ReplayTime from '~backend/api/ReplayTime';
import ReplayOutput from '~backend/api/ReplayOutput';

export default class ReplayApi {
  public static serverProcess: ChildProcess;
  public static serverStartPath: string;
  public static nodePath: string;
  private static websockets = new Set<WebSocket>();
  private static replayScriptCacheByHost = new Map<string, string>();
  private static localApiHost: URL;

  public readonly heroSession: IHeroSession;
  public tabsById = new Map<number, ReplayTabState>();
  public apiHost: URL;
  public lastActivityDate: Date;
  public lastCommandName: string;
  public showUnresponsiveMessage = true;
  public hasAllData = false;
  public output = new ReplayOutput();

  public onTabChange?: (tab: ReplayTabState) => any;

  public get isReady() {
    return this.isReadyResolvable.promise;
  }

  public get startTab(): ReplayTabState {
    return this.tabsById.values().next().value;
  }

  private replayTime: ReplayTime;
  private readonly isReadyResolvable = getResolvable<void>();

  private readonly websocket: WebSocket;

  private resources = new ReplayResources();

  constructor(apiHost: URL, replay: IReplayMeta) {
    this.apiHost = apiHost;
    this.heroSession = {
      ...replay,
      name: replay.sessionName,
      id: replay.sessionId,
    } as any;

    const headers: any = {};
    for (const [key, value] of Object.entries({
      'data-location': this.heroSession.dataLocation,
      'session-name': this.heroSession.name,
      'session-id': this.heroSession.id,
      'script-instance-id': this.heroSession.scriptInstanceId,
      'script-entrypoint': this.heroSession.scriptEntrypoint,
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
      console.log('Ws Session closed', this.heroSession.id);
    });
    this.websocket.on('message', this.onMessage.bind(this));
  }

  public async getReplayScript(): Promise<string> {
    // only load from memory so we have latest version
    const cached = ReplayApi.replayScriptCacheByHost.get(this.apiHost.href);
    if (cached) return cached;

    const scriptsDir = `${app.getPath('userData')}/scripts`;
    if (!Fs.existsSync(scriptsDir)) {
      Fs.mkdirSync(scriptsDir, { recursive: true });
    }
    const scriptUrl = `http://${this.apiHost.host}/replay/domReplayer.js`;

    console.log('Fetching %s', scriptUrl);

    await new Promise<void>((resolve, reject) => {
      const req = Http.get(scriptUrl, async res => {
        res.on('error', reject);
        const data: Buffer[] = [];
        for await (const chunk of res) {
          data.push(chunk);
        }
        const result = Buffer.concat(data).toString();

        // cheap sanitization check to avoid accessing electron here
        if (
          result.includes('import(') ||
          result.match(/^\s*import/g) ||
          result.includes(' require.') ||
          result.includes(' require(')
        ) {
          throw new Error(
            `Disallowed nodejs module (require or import) access requested by domReplayer.js script at "${scriptUrl}"`,
          );
        }

        const scriptPath = `${scriptsDir}/${res.headers.filename}`;
        await Fs.promises.writeFile(scriptPath, result);
        ReplayApi.replayScriptCacheByHost.set(this.apiHost.href, scriptPath);

        resolve();
      });
      req.on('error', reject);
      req.end();
    });
    return ReplayApi.replayScriptCacheByHost.get(this.apiHost.href);
  }

  public async getResource(url: string): Promise<ProtocolResponse> {
    const resource = await this.resources.get(url);
    if (resource.redirectedToUrl) {
      return <ProtocolResponse>{
        statusCode: resource.statusCode,
        headers: { location: resource.redirectedToUrl },
      };
    }

    const localHost = ReplayApi.localApiHost;
    const apiHost = `http://${localHost.host}/replay/${this.heroSession.id}`;
    return this.resources.getContent(resource.id, apiHost, this.heroSession.dataLocation);
  }

  public close(): void {
    for (const value of this.tabsById.values()) {
      if (value.isActive) return;
    }

    this.websocket.close();
    ReplayApi.websockets.delete(this.websocket);
  }

  public getTab(tabId: number): ReplayTabState {
    return this.tabsById.get(tabId);
  }

  private async onMessage(messageData: WebSocket.Data): Promise<void> {
    const { event, data } = parseJSON(messageData);
    if (event === 'trailer') {
      this.hasAllData = true;
      for (const tab of this.tabsById.values()) tab.hasAllData = true;
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
    this.lastActivityDate ??= new Date();

    const tabsWithChanges = new Set<ReplayTabState>();

    if (event === 'script-state') {
      console.log('ScriptState', data);
      const closeDate = data.closeDate ? new Date(data.closeDate) : null;
      this.replayTime.update(closeDate);
      this.lastActivityDate = data.lastActivityDate ? new Date(data.lastActivityDate) : null;
      this.lastCommandName = data.lastCommandName;
      for (const tab of this.tabsById.values()) tabsWithChanges.add(tab);
    } else if (event === 'output') {
      this.output.onOutput(data);
    } else {
      if (!this.replayTime.close) {
        this.replayTime.update();
      }

      for (const record of data) {
        const tabId = record.tabId;
        let tab = this.getTab(tabId);
        if (!tab) {
          const timestamp = Number(record.timestamp ?? record.startDate);
          console.log('New Tab created in replay');
          tab = this.onApiHasNewTab(tabId, timestamp);
        }
        tabsWithChanges.add(tab);

        if (event === 'resources') this.resources.onResource(record);
        else tab.onApiFeed(event, record);
      }
    }

    for (const tab of tabsWithChanges) tab.sortTicks();
    // if this is a detached tab command, we should create a new tab here
    if (event === 'commands') {
      for (const record of data) {
        if (record.name !== 'detachTab' || !record.result) continue;
        console.log('Loading a detached Tab', record);
        const tab = this.getTab(record.tabId);
        const detachedTabId = record.result.detachedTab.id;
        const detachedState = record.result.detachedState;
        const { timestampRange, indexRange } = detachedState.domChangeRange;
        const paintEvents = tab.copyPaintEvents(timestampRange, indexRange);
        const newTab = this.onApiHasNewTab(detachedTabId, record.startDate, record.tabId);
        newTab.loadDetachedState(
          record.tabId,
          paintEvents,
          record.timestamp,
          record.id,
          detachedState.url,
        );
      }
    }
  }

  private onApiHasNewTab(
    tabId: number,
    timestamp: number,
    detachedFromTabId?: number,
  ): ReplayTabState {
    const firstTab = this.startTab;
    const tabMeta = <ISessionTab>{
      tabId,
      detachedFromTabId,
      createdTime: timestamp,
      width: firstTab.viewportWidth,
      height: firstTab.viewportHeight,
    };
    const tab = new ReplayTabState(tabMeta, this.replayTime);
    if (this.onTabChange) this.onTabChange(tab);

    this.tabsById.set(tabId, tab);
    return tab;
  }

  private onSession(data: IHeroSession) {
    // parse strings to dates from api
    data.startDate = new Date(data.startDate);
    data.closeDate = data.closeDate ? new Date(data.closeDate) : null;

    Object.assign(this.heroSession, data);

    console.log(`Loaded ReplayApi.sessionMeta`, {
      sessionId: data.id,
      dataLocation: data.dataLocation,
      start: data.startDate,
      close: data.closeDate,
      tabs: data.tabs,
    });

    this.replayTime = new ReplayTime(data.startDate, data.closeDate);
    for (const tab of data.tabs) {
      this.tabsById.set(tab.tabId, new ReplayTabState(tab, this.replayTime));
    }
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
    await ReplayApi.startServer();

    const replayApiUrl = replay.replayApiUrl ? new URL(replay.replayApiUrl) : this.localApiHost;

    console.log('Connecting to Replay API', replay.replayApiUrl);
    const api = new ReplayApi(replayApiUrl, replay);
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
    if (this.localApiHost || this.serverProcess) return;

    const args = [];
    if (!this.serverStartPath) {
      const replayDir = __dirname.split(`${Path.sep}replay${Path.sep}`).shift();
      this.serverStartPath = Path.resolve(replayDir, 'core', 'start');
    }
    if (!this.nodePath) {
      this.nodePath = 'node';
    }
    console.log('Launching Replay API Server at %s', this.serverStartPath);
    const child = spawn(`${this.nodePath} "${this.serverStartPath}"`, args, {
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
      shell: true,
      windowsHide: true,
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

    this.localApiHost = new URL(`${await promise}/replay`);
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
