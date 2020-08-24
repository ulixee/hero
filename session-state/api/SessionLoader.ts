import SessionDb from '../lib/SessionDb';
import { MouseEventType } from '../models/MouseEventsTable';
import { EventEmitter } from 'events';
import { ISessionRecord } from '../models/SessionTable';
import CommandFormatter from '../lib/CommandFormatter';
import ResourceType from '../../core-interfaces/ResourceType';
import SessionState from '../index';

export default class SessionLoader extends EventEmitter {
  public static eventStreams = [
    'mouse-events',
    'scroll-events',
    'focus-events',
    'dom-changes',
    'frames',
    'commands',
    'script-state',
  ];
  public session: ISessionRecord;
  public startOrigin: string;

  private readonly sessionDb: SessionDb;
  private readonly sessionState: SessionState;
  private readonly parentFrames = new Set<string>();

  private lastScriptState: IScriptState;

  constructor(sessionDb: SessionDb, sessionState?: SessionState) {
    super();
    this.sessionState = sessionState;
    this.sessionDb = sessionDb;
  }

  public listen() {
    const db = this.sessionDb;
    this.session = this.sessionDb.session.get();
    if (!this.session.closeDate) {
      db.pages.subscribe(() => this.checkState());
      db.session.subscribe(() => this.checkState());
      this.checkState();
    }

    db.frames.subscribe(frames => {
      for (const frame of frames) {
        if (!frame.parentId) this.parentFrames.add(frame.id);
      }
    });

    db.domChanges.subscribe(changes => {
      for (const change of changes) {
        if (!this.startOrigin && change.action === 'newDocument') {
          this.startOrigin = change.textContent;
          this.emit('ready');
        }
        (change as any).isMainFrame =
          this.parentFrames.size === 0 || this.parentFrames.has(change.frameId);
        if (change.attributes) change.attributes = JSON.parse(change.attributes);
        if (change.attributeNamespaces) {
          change.attributeNamespaces = JSON.parse(change.attributeNamespaces);
        }
        if (change.properties) change.properties = JSON.parse(change.properties);
      }
      if (changes.length) this.emit('dom-changes', changes);
    });

    db.commands.subscribe(commands => {
      const commandsWithResults = commands.map(CommandFormatter.parseResult);
      this.emit('commands', commandsWithResults);
      this.checkState();
    });

    db.mouseEvents.subscribe(mouseEvents => {
      const toPublish = mouseEvents.filter(x => mouseFilter.includes(x.event));
      if (toPublish.length) this.emit('mouse-events', toPublish);
    });

    db.scrollEvents.subscribe(scroll => {
      this.emit('scroll-events', scroll);
    });

    db.focusEvents.subscribe(events => {
      this.emit('focus-events', events);
    });

    db.resources.subscribe(resources => {
      const resourcesToSend = [];
      for (const resource of resources) {
        if (!resourceWhitelist.includes(resource.type)) continue;
        resourcesToSend.push({
          url: resource.requestUrl,
          type: resource.type,
          data: resource.responseData,
          encoding: resource.responseEncoding,
          status: resource.statusCode,
          headers: JSON.parse(resource.responseHeaders),
        });
      }
      if (resourcesToSend.length) this.emit('resources', resourcesToSend);
    });

    // don't close a live db
    if (db.readonly) {
      db.close();
      setImmediate(() => this.emit('close'));
    }
  }

  public checkState() {
    if (!this.sessionState || this.session.closeDate) return;
    const scriptState: IScriptState = this.sessionState.checkForResponsive();
    const lastState = this.lastScriptState;

    this.lastScriptState = scriptState;
    if (
      !lastState ||
      lastState.hasRecentErrors !== scriptState.hasRecentErrors ||
      lastState.closeTime !== scriptState.closeTime ||
      lastState.unresponsiveSeconds !== scriptState.unresponsiveSeconds
    ) {
      this.emit('script-state', scriptState);
      if (scriptState.closeTime) {
        setImmediate(() => this.emit('close'));
      }
    }
  }
}

const mouseFilter = [MouseEventType.MOVE, MouseEventType.DOWN, MouseEventType.UP];

const resourceWhitelist: ResourceType[] = [
  'Ico',
  'Image',
  'Media',
  'Font',
  'Stylesheet',
  'Document',
];

interface IScriptState {
  unresponsiveSeconds: number;
  hasRecentErrors: boolean;
  closeTime?: Date;
}
