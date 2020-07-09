import ChildProcess from 'child_process';
import pathOfReplayApi from '../pathOfReplayApi';
import { EventEmitter } from 'events';
import Axios from 'axios';
import { Agent } from 'http';
import IPaintEvent from '~shared/interfaces/IPaintEvent';
import ISaSession from '~shared/interfaces/ISaSession';
import { IDomChangeEvent } from '../injected-scripts/interfaces/IDomChangeEvent';

const httpAgent = new Agent({ keepAlive: true });
const axios = Axios.create({
  httpAgent,
});
const API_HOST = 'http://localhost:1212';

export default class ReplayApi extends EventEmitter {
  public readonly saSession: ISaSession;
  public readonly dataLocation: string;
  public readonly sessionId: string;
  public urlOrigin: string;

  private paintEvents: IPaintEvent[] = [];
  private paintEventsLoadedIndex = -1;

  constructor(dataLocation, saSession: ISaSession) {
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
    const response = await axios.get(`${API_HOST}/sessionMeta`, { params });
    Object.assign(this.saSession, response.data.data);
    this.emit('session:updated', this.saSession);

    if (!this.saSession.closeDate) {
      setTimeout(() => this.updateSaSession(), 1000);
    }
  }

  public async setPaintIndex(paintEventIdx: number) {
    // see if we need to load more events
    if (paintEventIdx > this.paintEvents.length) {
      const paintEvents = await this.fetchPaintEvents(this.paintEvents.length, paintEventIdx);
      this.paintEvents.push(...paintEvents);
    }

    // don't reload the currently loaded index
    let startIndex = this.paintEventsLoadedIndex + 1;

    // if going backwards, load back to the last new document load
    if (paintEventIdx < this.paintEventsLoadedIndex) {
      for (let i = this.paintEventsLoadedIndex; i >= 0; i -= 1) {
        const group = this.paintEvents[i];
        if (group.changeEvents[0][1] === 'newDocument') {
          startIndex = i;
          break;
        }
      }
    }

    let newUrlOrigin: string;
    const changeEvents: IDomChangeEvent[] = [];
    for (const paintEvent of this.paintEvents.slice(startIndex, paintEventIdx)) {
      newUrlOrigin = paintEvent.urlOrigin;
      changeEvents.push(...paintEvent.changeEvents);
    }
    if (newUrlOrigin) {
      this.urlOrigin = newUrlOrigin;
    }
    this.paintEventsLoadedIndex = paintEventIdx;
    return changeEvents;
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

  private async fetchPaintEvents(fromPaintEventIdx: number, toPaintEventIdx: number) {
    const params = {
      dataLocation: this.dataLocation,
      sessionId: this.sessionId,
      fromPaintEventIdx,
      toPaintEventIdx,
    };
    console.log(`GET ${API_HOST}/paintEvents`, params);
    const response = await axios.get(`${API_HOST}/paintEvents`, { params });
    return response.data.data;
  }

  public static async connect(dataLocation, sessionName, scriptInstanceId) {
    const params = {
      dataLocation,
      name: sessionName,
      scriptInstanceId,
    };
    console.log(`GET ${API_HOST}/sessionMeta`, params);
    const response = await axios.get(`${API_HOST}/sessionMeta`, { params });
    return new ReplayApi(dataLocation, response.data.data);
  }
}

// async function startLocal() {
//   const args = [];
//   const child = ChildProcess.spawn(pathOfReplayApi, args, { detached: true, stdio: 'ignore' });
//   this.replayApiHost = '';
// }
