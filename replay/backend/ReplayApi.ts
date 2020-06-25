import ChildProcess from 'child_process';
import pathOfReplayApi from '../pathOfReplayApi';
import { EventEmitter } from 'events';
import Axios from 'axios';

const API_HOST = 'http://localhost:1212';

export default class ReplayApi extends EventEmitter {
  public readonly saSession: any;
  public readonly dataLocation: string;
  public readonly sessionId: string;

  constructor(dataLocation, saSession: any) {
    super();
    this.dataLocation = dataLocation;
    this.sessionId = saSession.id;
    this.saSession = saSession;

    if (!this.saSession.closeDate) {
      setTimeout(() => this.updateSaSession(), 1000);
    }
  }

  public async updateSaSession() {
    const params = {
      dataLocation: this.dataLocation,
      name: this.saSession.name,
      scriptInstanceId: this.saSession.scriptInstanceId,
    };
    console.log(`GET ${API_HOST}/sessionMeta`, params);
    const response = await Axios.get(`${API_HOST}/sessionMeta`, { params });
    Object.assign(this.saSession, response.data.data);
    this.emit('session:updated', this.saSession);

    if (!this.saSession.closeDate) {
      setTimeout(() => this.updateSaSession(), 1000);
    }
  }

  public async fetchPaintEvents(fromPaintEventIdx: number, toPaintEventIdx: number) {
    const params = {
      dataLocation: this.dataLocation,
      sessionId: this.sessionId,
      fromPaintEventIdx,
      toPaintEventIdx,
    };
    console.log(`GET ${API_HOST}/paintEvents`, params);
    const response = await Axios.get(`${API_HOST}/paintEvents`, { params });
    return response.data.data;
  }

  public resourceUrl(url) {
    const params = {
      sessionId: this.saSession.id,
      dataLocation: this.dataLocation,
      url: url,
    };
    const resourceUrl = new URL('/resource', API_HOST);
    for (const [key, val] of Object.entries(params)) {
      resourceUrl.searchParams.append(key, val);
    }
    return resourceUrl.href;
  }

  public static async connect(dataLocation, sessionName, scriptInstanceId) {
    const params = {
      dataLocation,
      name: sessionName,
      scriptInstanceId,
    };
    console.log(`GET ${API_HOST}/sessionMeta`, params);
    const response = await Axios.get(`${API_HOST}/sessionMeta`, { params });
    return new ReplayApi(dataLocation, response.data.data);
  }
}

// async function startLocal() {
//   const args = [];
//   const child = ChildProcess.spawn(pathOfReplayApi, args, { detached: true, stdio: 'ignore' });
//   this.replayApiHost = '';
// }
