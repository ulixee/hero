import * as http2 from 'http2';
import { ClientHttp2Stream, IncomingHttpHeaders, IncomingHttpStatusHeader } from 'http2';
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
  private static sessions = new Set<http2.ClientHttp2Session>();
  private static localApiHost: string;

  public readonly saSession: ISaSession;
  public tabs: ReplayTabState[] = [];
  public apiHost: string;
  public lastActivityDate: Date;
  public lastCommandName: string;
  public showUnresponsiveMessage = true;

  public onNewTab?: (tab: ReplayTabState) => any;

  public get isReady() {
    return this.isReadyResolvable.promise;
  }

  public get getStartTab(): ReplayTabState {
    return this.tabs[0];
  }

  private replayTime: ReplayTime;
  private readonly isReadyResolvable = getResolvable<void>();

  private readonly http2Session: http2.ClientHttp2Session;

  private resources: ReplayResources = new ReplayResources();

  constructor(apiHost: string, replay: IReplayMeta) {
    this.apiHost = apiHost;
    this.saSession = {
      ...replay,
      name: replay.sessionName,
      id: replay.sessionId,
    } as any;

    this.http2Session = http2.connect(apiHost, () => console.log('Reply API connected'));

    ReplayApi.sessions.add(this.http2Session);
    this.http2Session.on('close', () => {
      ReplayApi.sessions.delete(this.http2Session);
      console.log('Http2 Session closed');
    });
    this.http2Session.on('stream', this.onStream.bind(this));

    const request = this.http2Session
      .request({
        ':path': `/`,
        'data-location': this.saSession.dataLocation,
        'session-name': this.saSession.name,
        'session-id': this.saSession.id,
        'script-instance-id': this.saSession.scriptInstanceId,
        'script-entrypoint': this.saSession.scriptEntrypoint,
      })
      .on('response', async headers => {
        const status = headers[':status'];
        if (status !== 200) {
          const data = await streamToJson<{ message: string }>(request);
          this.isReadyResolvable.reject(new Error(data.message ?? 'Unexpected Error'));
        }
      });
  }

  public getResource(url: string): Promise<IReplayHttpResource> {
    return this.resources.get(url);
  }

  public close(): void {
    if (this.tabs.some(x => x.isActive)) return;

    this.http2Session.removeAllListeners();
    this.http2Session.destroy();
    ReplayApi.sessions.delete(this.http2Session);
  }

  public getTab(tabId: string): ReplayTabState {
    return this.tabs.find(x => x.tabId === tabId);
  }

  private async onStream(
    stream: ClientHttp2Stream,
    headers: IncomingHttpHeaders & IncomingHttpStatusHeader,
  ): Promise<void> {
    const path = headers[':path'];

    if (path === '/session') {
      const data = await streamToJson<ISaSession>(stream);
      this.onSession(data);
      return;
    }

    // don't load api data until the session is ready
    await this.isReady;

    if (path === '/resource') {
      const data = await readStream(stream);
      this.onResource(data, headers as any);
    } else {
      const json = await streamToJson(stream);
      this.onApiFeed(path, json);
    }
  }

  private onResource(data: Buffer, headers: { [key: string]: string }): void {
    const type = headers['resource-type'];
    const statusCode = parseInt(headers['resource-status-code'] ?? '404', 10);
    const tabId = headers['resource-tabid'];
    const url = headers['resource-url'];

    this.resources.onResource({
      data,
      url,
      tabId,
      headers: JSON.parse(headers['resource-headers']),
      statusCode,
      type,
    });
  }

  private onApiFeed(dataPath: string, data: any) {
    console.log('Replay Api Feed', dataPath);
    const tabsWithChanges = new Set<ReplayTabState>();
    if (dataPath === '/script-state') {
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
        if (dataPath === '/dom-changes') tab.loadDomChange(event);
        else if (dataPath === '/commands') tab.loadCommand(event);
        else if (dataPath === '/mouse-events') tab.loadPageEvent('mouse', event);
        else if (dataPath === '/focus-events') tab.loadPageEvent('focus', event);
        else if (dataPath === '/scroll-events') tab.loadPageEvent('scroll', event);
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
      ReplayApi.sessions.size,
    );
    if (ReplayApi.serverProcess) ReplayApi.serverProcess.kill();
    for (const session of ReplayApi.sessions) session.destroy();
  }

  public static async connect(replay: IReplayMeta) {
    if (!replay.sessionStateApi && !this.serverProcess) {
      await ReplayApi.startServer();
    }

    console.log('Connecting to Replay API', replay.sessionStateApi || this.localApiHost);
    const api = new ReplayApi(replay.sessionStateApi || this.localApiHost, replay);
    await api.isReady;
    return api;
  }

  private static async startServer() {
    if (this.localApiHost) return;

    const args = [];
    if (!this.serverStartPath) {
      const replayDir = __dirname.split(`${Path.sep}replay${Path.sep}`).shift();
      this.serverStartPath = Path.resolve(replayDir, 'session-state/api/start');
    }
    console.log('Launching Replay API Server at %s', this.serverStartPath);
    const child = spawn(`node "${this.serverStartPath}"`, args, {
      stdio: ['ignore', 'pipe', 'inherit'],
      shell: true,
      windowsHide: true,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        SA_REPLAY_DEBUG: process.env.SA_REPLAY_DEBUG,
        DEBUG: process.env.DEBUG,
      },
    });
    this.serverProcess = child;

    child.stdout.setEncoding('utf8');
    const promise = await new Promise(resolve => {
      child.stdout.on('data', msg => {
        const match = msg.match(/REPLAY API SERVER LISTENING on \[(\d+)\]/);
        if (match && match.length) {
          resolve(match[1]);
        }
        console.log(msg.trim());
      });
    });

    this.localApiHost = `http://localhost:${await promise}`;
    return child;
  }
}

async function readStream(stream: http2.Http2Stream): Promise<Buffer> {
  const data: Buffer[] = [];
  for await (const chunk of stream) data.push(chunk);
  return Buffer.concat(data);
}

async function streamToJson<T>(stream: http2.Http2Stream): Promise<T> {
  const data = await readStream(stream);
  const json = data.toString('utf8');
  return JSON.parse(json);
}
