import { EventEmitter } from 'events';
import Axios from 'axios';
import { Agent } from 'http';
import IPaintEvent from '~shared/interfaces/IPaintEvent';
import ISaSession, { IMinorTick } from '~shared/interfaces/ISaSession';
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

  private currentTickIdx = 0;
  private currentPlaybarOffsetPct = 0;
  private currentDocumentLoadCommandId = 0;
  private currentDocumentLoadPaintIdx = 0;
  // put in placeholder
  private paintEvents: IPaintEvent[] = [];
  private paintEventsLoadedIndex = -1;

  private loadAttempts = 5;

  constructor(dataLocation, saSession: ISaSession) {
    super();
    this.dataLocation = dataLocation;
    this.sessionId = saSession.id;
    this.saSession = saSession;

    this.paintEvents = saSession.paintEvents ?? [];
    delete saSession.paintEvents;

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
    this.paintEvents = this.saSession.paintEvents ?? [];
    delete this.saSession.paintEvents;
    this.emit('session:updated', this.saSession);

    this.loadAttempts -= 1;
    if (!this.saSession.closeDate && this.loadAttempts >= 0) {
      setTimeout(() => this.updateSaSession(), 1000);
    }
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

    let newTick = ticks[this.currentTickIdx];
    let newTickIdx = 0;
    // if going forward, load next ticks
    if (playbarOffset > this.currentPlaybarOffsetPct) {
      for (let i = this.currentTickIdx; i < ticks.length; i += 1) {
        newTick = ticks[i];
        newTickIdx = i;
        if (newTick.playbarOffsetPercent >= playbarOffset) break;
      }
      if (!newTick) return;
    } else {
      for (let i = this.currentTickIdx; i >= 0; i -= 1) {
        newTick = ticks[i];
        newTickIdx = i;
        if (newTick.playbarOffsetPercent < playbarOffset) break;
      }
    }

    // find last page load event
    for (let i = this.paintEvents.length - 1; i >= 0; i -= 1) {
      const paintEvent = this.paintEvents[i];
      if (paintEvent.commandId > newTick.commandId) continue;
      if (paintEvent.changeEvents[0][1] === 'newDocument') {
        this.currentDocumentLoadCommandId = paintEvent.commandId;
        this.currentDocumentLoadPaintIdx = i;
        this.urlOrigin = new URL(paintEvent.changeEvents[0][2].textContent).href;
        if (this.urlOrigin.endsWith('/')) {
          this.urlOrigin = this.urlOrigin.substr(0, this.urlOrigin.length - 1);
        }
        break;
      }
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

  private findLastMinorTickEvent(
    tickIdx: number,
    playbarOffset: number,
    property: keyof IMinorTick,
  ) {
    let newEventIdx = -1;
    for (let i = tickIdx; i >= 0; i -= 1) {
      const tick = this.saSession.ticks[i];
      if (tick.commandId < this.currentDocumentLoadCommandId) break;

      const isNewDocumentTick = tick.commandId === this.currentDocumentLoadCommandId;
      for (let minorIdx = tick.minorTicks.length - 1; minorIdx >= 0; minorIdx -= 1) {
        const minor = tick.minorTicks[minorIdx];
        // if we're on current index, see if we've gone past the markers
        if (i === tickIdx && minor.playbarOffsetPercent > playbarOffset) continue;

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
      return [[-1, 'newDocument']];
    }

    // don't reload the currently loaded index
    let startIndex = this.paintEventsLoadedIndex + 1;

    // if going backwards, load back to the last new document load
    if (paintEventIdx < this.paintEventsLoadedIndex) {
      startIndex = this.currentDocumentLoadPaintIdx;
    }

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
