import { EventEmitter } from 'events';
import * as http2 from 'http2';
import ISaSession from '~shared/interfaces/ISaSession';
import { ChildProcess, spawn } from 'child_process';
import IReplayMeta from '~shared/interfaces/IReplayMeta';
import ReplayResources from '~backend/api/ReplayResources';
import ReplayState from '~backend/api/ReplayState';
import * as Path from 'path';
import getResolvable from '~shared/utils/promise';

export default class ReplayApi extends EventEmitter {
  public static serverProcess: ChildProcess;
  public static serverStartPath = Path.resolve(__dirname, '../../../session-state/api/start');
  private static sessions = new Set<http2.ClientHttp2Session>();
  private static localApiHost: string;

  public readonly saSession: ISaSession;
  public apiHost: string;
  public state: ReplayState;
  public readonly isReady = getResolvable<void>();

  private readonly http2Session: http2.ClientHttp2Session;

  private resources: ReplayResources = new ReplayResources();
  private broadcastTimer: NodeJS.Timer;
  private lastBroadcast?: Date;

  constructor(apiHost: string, replay: IReplayMeta) {
    super();
    this.apiHost = apiHost;
    this.saSession = {
      ...replay,
      name: replay.sessionName,
      id: replay.sessionId,
    } as any;
    this.state = new ReplayState();

    this.http2Session = http2.connect(apiHost, () => console.log('Reply API connected'));

    ReplayApi.sessions.add(this.http2Session);
    this.http2Session.on('close', () => ReplayApi.sessions.delete(this.http2Session));

    this.http2Session.on('stream', async (stream, headers) => {
      const path = headers[':path'];

      const url = headers['resource-url'] as string;
      console.log('Replay Api Stream: %s', ...[path, url].filter(Boolean));

      if (path === '/session') {
        const data = await streamToJson<ISaSession>(stream);
        this.onSession(data);
        this.isReady.resolve();
        return;
      }

      await this.isReady.promise;

      if (path === '/resource') {
        const type = headers['resource-type'] as string;
        const statusCode = parseInt((headers['resource-status-code'] as string) ?? '404', 10);
        await this.resources.onResource(stream, {
          url,
          headers: JSON.parse(headers['resource-headers'] as string),
          statusCode,
          type,
        });
      } else {
        const json = await streamToJson(stream);
        this.onApiFeed(path, json);
      }
    });

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
          this.isReady.reject(new Error(data.message ?? 'Unexpected Error'));
        }
      });
  }

  public async getResource(url: string) {
    return this.resources.get(url);
  }

  public close() {
    this.http2Session.removeAllListeners();
    this.http2Session.close();
  }

  private onApiFeed(path: string, json: any) {
    this.state.loadApiFeed(path, json);
    if (!this.lastBroadcast) {
      return this.broadcast();
    }
    if (new Date().getTime() - this.lastBroadcast.getTime() > 500) {
      return this.broadcast();
    }
    clearTimeout(this.broadcastTimer);
    this.broadcastTimer = setTimeout(() => this.broadcast(), 50);
  }

  private broadcast() {
    this.lastBroadcast = new Date();
    this.emit('ticks:updated');
  }

  private onSession(data: ISaSession) {
    Object.assign(this.saSession, data);

    console.log(`Loaded ReplayApi.sessionMeta`, {
      sessionId: data.id,
      dataLocation: data.dataLocation,
    });
    this.state.loadSession(this.saSession);
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

    console.log('Connecting to Replay API', replay.sessionStateApi ?? this.localApiHost);
    const api = new ReplayApi(replay.sessionStateApi ?? this.localApiHost, replay);
    await api.isReady;
    return api;
  }

  private static async startServer() {
    if (this.localApiHost) return;

    const args = [];
    console.log('Launching Replay API Server at %s', this.serverStartPath);
    const child = spawn(`node ${this.serverStartPath}`, args, {
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

async function streamToJson<T>(stream: http2.Http2Stream): Promise<T> {
  const data: Buffer[] = [];
  for await (const chunk of stream) data.push(chunk);
  const json = Buffer.concat(data).toString('utf8');
  return JSON.parse(json);
}
