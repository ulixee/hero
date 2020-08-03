import { EventEmitter } from 'events';
import Axios from 'axios';
import { Agent } from 'http';
import IPaintEvent from '~shared/interfaces/IPaintEvent';
import ISaSession, { IMinorTick } from '~shared/interfaces/ISaSession';
import { IDomChangeEvent } from '../injected-scripts/interfaces/IDomChangeEvent';
import ChildProcess from 'child_process';
import IReplayMeta from '../shared/interfaces/IReplayMeta';

const httpAgent = new Agent({ keepAlive: true });
const axios = Axios.create({
  httpAgent,
});

export default class ReplayApi extends EventEmitter {
  private static localApiHost: string;

  public readonly saSession: ISaSession;
  public dataLocation: string;
  public sessionId: string;
  public urlOrigin: string;
  public isActive = true;
  public apiHost: string;

  private currentTickIdx = 0;
  private currentPlaybarOffsetPct = 0;
  private currentDocumentLoadCommandId = 0;
  private currentDocumentLoadPaintIdx = 0;
  // put in placeholder
  private paintEvents: IPaintEvent[] = [];
  private paintEventsLoadedIndex = -1;

  constructor(apiHost: string, replay: IReplayMeta) {
    super();
    this.apiHost = apiHost;
    this.dataLocation = replay.dataLocation;
    this.saSession = {
      ...replay,
      name: replay.sessionName,
    } as any;
  }

  public async updateSaSession() {
    const params = {
      dataLocation: this.dataLocation,
      name: this.saSession.name,
      scriptInstanceId: this.saSession.scriptInstanceId,
      scriptEntrypoint: this.saSession.scriptEntrypoint,
    };
    const response = await axios.get(`${this.apiHost}/sessionMeta`, { params });
    console.log(`Updated ReplayApi.sessionMeta`, params, {
      sessionId: response.data.id,
      dataLocation: response.data.dataLocation,
    });
    Object.assign(this.saSession, response.data);
    this.sessionId = this.saSession.id;
    this.dataLocation = response.data.dataLocation;

    this.paintEvents = this.saSession.paintEvents ?? [];
    delete this.saSession.paintEvents;

    if (!this.urlOrigin) this.setFirstOrigin();
    this.emit('session:updated', this.saSession);

    if (!this.saSession.closeDate && this.isActive) {
      setTimeout(() => this.updateSaSession(), 1000);
    }
  }

  public resourceUrl(url) {
    const params = {
      sessionId: this.saSession.id,
      dataLocation: this.dataLocation,
      url: url,
    };
    const resourceUrl = new URL('/resource', this.apiHost);
    for (const [key, val] of Object.entries(params)) {
      resourceUrl.searchParams.append(key, val);
    }
    return resourceUrl.href;
  }

  public getPageOffset(page: { id: string; url: string }) {
    const pageToLoad = this.saSession.pages.find(x => x.id === page.id);
    return (
      this.saSession.ticks.find(x => x.commandId === pageToLoad.commandId)?.playbarOffsetPercent ??
      0
    );
  }

  public async setTickValue(playbarOffset: number) {
    const ticks = this.saSession.ticks;
    if (this.currentPlaybarOffsetPct === playbarOffset) return;

    const lastTick = ticks[ticks.length - 1];
    let newTick = ticks[this.currentTickIdx];
    let newTickIdx = 0;
    // if going forward, load next ticks
    if (playbarOffset > this.currentPlaybarOffsetPct) {
      if (playbarOffset >= lastTick?.playbarOffsetPercent) {
        newTick = lastTick;
        newTickIdx = ticks.length - 1;
      }
      for (let i = this.currentTickIdx; i < ticks.length; i += 1) {
        if (ticks[i].playbarOffsetPercent >= playbarOffset) break;
        newTick = ticks[i];
        newTickIdx = i;
      }
      if (!newTick) return;
    } else {
      for (let i = this.currentTickIdx; i >= 0; i -= 1) {
        newTick = ticks[i];
        newTickIdx = i;
        if (newTick.playbarOffsetPercent <= playbarOffset) break;
      }
    }

    let found = false;
    // find last page load event
    for (let i = this.paintEvents.length - 1; i >= 0; i -= 1) {
      const paintEvent = this.paintEvents[i];
      if (paintEvent.commandId > newTick.commandId) continue;
      if (paintEvent.changeEvents[0][1] === 'newDocument') {
        found = true;
        this.currentDocumentLoadCommandId = paintEvent.commandId;
        this.currentDocumentLoadPaintIdx = i;
        this.urlOrigin = new URL(paintEvent.changeEvents[0][2].textContent).href;
        if (this.urlOrigin.endsWith('/')) {
          this.urlOrigin = this.urlOrigin.substr(0, this.urlOrigin.length - 1);
        }
        break;
      }
    }
    if (!found) {
      this.currentDocumentLoadCommandId = 0;
      this.currentDocumentLoadPaintIdx = 0;
      this.setFirstOrigin();
    }

    const newPaintEventIdx = this.findLastMinorTickEvent(
      newTickIdx,
      playbarOffset,
      'paintEventIdx',
    );
    const newMouseEventIdx = this.findLastMinorTickEvent(
      newTickIdx,
      playbarOffset,
      'mouseEventIdx',
    );
    const newScrollEventIdx = this.findLastMinorTickEvent(
      newTickIdx,
      playbarOffset,
      'scrollEventIdx',
    );
    const newFocusEventIdx = this.findLastMinorTickEvent(
      newTickIdx,
      playbarOffset,
      'focusEventIdx',
    );
    this.currentTickIdx = newTickIdx;
    this.currentPlaybarOffsetPct = playbarOffset;

    const paintEvents = await this.setPaintIndex(newPaintEventIdx);
    const lastCommandResults = this.findLastCommandResults(newTick.commandId);

    const mouseEvent =
      newMouseEventIdx === -1 ? null : this.saSession.mouseEvents[newMouseEventIdx];
    const scrollEvent =
      newScrollEventIdx === -1 ? null : this.saSession.scrollEvents[newScrollEventIdx];
    const focusEvent =
      newFocusEventIdx === -1 ? null : this.saSession.focusEvents[newFocusEventIdx];

    let nodesToHighlight = lastCommandResults?.resultNodeIds;
    if (focusEvent && focusEvent.event === 0) {
      if (!lastCommandResults || focusEvent.commandId > lastCommandResults.commandId) {
        nodesToHighlight = [focusEvent.targetNodeId];
      }
    }

    return [paintEvents, nodesToHighlight, mouseEvent, scrollEvent];
  }

  private setFirstOrigin() {
    for (const paintEvent of this.paintEvents) {
      if (paintEvent.changeEvents[0][1] === 'newDocument') {
        this.urlOrigin = new URL(paintEvent.changeEvents[0][2].textContent).href;
      }
    }
  }

  private findLastMinorTickEvent(
    tickIdx: number,
    playbarOffset: number,
    property: keyof IMinorTick,
  ) {
    let newEventIdx = -1;
    for (let i = tickIdx + 1; i >= 0; i -= 1) {
      const tick = this.saSession.ticks[i];
      if (!tick) continue;
      if (tick.commandId < this.currentDocumentLoadCommandId) break;

      const isNewDocumentTick = tick.commandId === this.currentDocumentLoadCommandId;
      for (let minorIdx = tick.minorTicks.length - 1; minorIdx >= 0; minorIdx -= 1) {
        const minor = tick.minorTicks[minorIdx];
        // if we're on current index, see if we've gone past the markers
        if (i === tickIdx && minor.playbarOffsetPercent > playbarOffset) {
          continue;
        }

        const value = minor[property] as number;
        if (value !== undefined && value > newEventIdx) {
          newEventIdx = value;
        }

        if (isNewDocumentTick && minor.paintEventIdx === this.currentDocumentLoadPaintIdx) {
          break;
        }
      }
      if (newEventIdx >= 0) return newEventIdx;
    }
    return newEventIdx;
  }

  private async setPaintIndex(paintEventIdx: number) {
    if (paintEventIdx === this.paintEventsLoadedIndex) return;

    if (paintEventIdx === -1) {
      this.paintEventsLoadedIndex = -1;
      return [
        [-1, 'newDocument', { textContent: this.urlOrigin }, this.saSession.startDate],
      ] as IDomChangeEvent[];
    }

    // don't reload the currently loaded index
    let startIndex = this.paintEventsLoadedIndex + 1;

    // if going backwards, load back to the last new document load
    if (paintEventIdx < this.paintEventsLoadedIndex) {
      if (this.currentDocumentLoadPaintIdx > startIndex) {
        startIndex = 0;
      } else {
        startIndex = this.currentDocumentLoadPaintIdx;
      }
    }
    if (startIndex < 0) startIndex = 0;

    if (startIndex >= this.paintEvents.length) return;

    const changeEvents: IDomChangeEvent[] = [];
    for (let i = startIndex; i <= paintEventIdx; i += 1) {
      const paintEvent = this.paintEvents[i];
      if (paintEvent) changeEvents.push(...paintEvent.changeEvents);
    }

    this.paintEventsLoadedIndex = paintEventIdx;
    return changeEvents;
  }

  private findLastCommandResults(commandId: number) {
    const commandIndex = this.saSession.commandResults.findIndex(x => x.commandId === commandId);
    for (let i = commandIndex; i >= 0; i -= 1) {
      const result = this.saSession.commandResults[i];
      if (result.commandId <= this.currentDocumentLoadCommandId) break;
      if (result.resultNodeIds?.length) {
        return result;
      }
    }
    return null;
  }

  public static async connect(replay: IReplayMeta) {
    const api = new ReplayApi(this.localApiHost, replay);
    console.log(`CONNECTED TO REPLAY API: [${this.localApiHost}]`);
    await api.updateSaSession();
    return api;
  }

  public static async start(replayApiPackagePath: string) {
    if (this.localApiHost) return;

    const args = [];
    console.log('Launching replay api at %s', replayApiPackagePath);
    const child = ChildProcess.spawn(`node ${replayApiPackagePath}`, args, {
      stdio: ['ignore', 'pipe', 'inherit'],
      shell: true,
      windowsHide: true,
    });

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
