import { EventEmitter } from 'events';
import ResourceType from '@secret-agent/core-interfaces/ResourceType';
import SessionDb from '../lib/SessionDb';
import { MouseEventType } from '../models/MouseEventsTable';
import { ISessionRecord } from '../models/SessionTable';
import CommandFormatter from '../lib/CommandFormatter';
import SessionState from '../index';

export default class SessionLoader extends EventEmitter {
  public static eventStreams = [
    'dom-changes',
    'mouse-events',
    'scroll-events',
    'focus-events',
    'frames',
    'commands',
    'script-state',
  ];

  public session: ISessionRecord;
  public tabs = new Map<string, { tabId: string; createdTime: string; startOrigin: string }>();
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
      db.frameNavigations.subscribe(() => this.checkState());
      db.session.subscribe(() => this.checkState());
      this.checkState();
    }

    db.frames.subscribe(frames => {
      for (const frame of frames) {
        if (!frame.parentId) this.parentFrames.add(frame.id);
        this.addTabId(frame.tabId, frame.createdTime);
      }
    });

    db.domChanges.subscribe(changes => {
      for (const change of changes) {
        if (change.action === 'newDocument') {
          this.addTabId(change.tabId, change.timestamp);
          const tab = this.tabs.get(change.tabId);
          if (!tab.startOrigin) {
            tab.startOrigin = change.textContent;
          }
          this.emit('tab-ready');
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
      for (const command of commands) this.addTabId(command.tabId, command.startDate);
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
          tabId: resource.tabId,
          type: resource.type,
          data: resource.responseData,
          encoding: resource.responseEncoding,
          status: resource.statusCode,
          headers: resource.responseHeaders ? JSON.parse(resource.responseHeaders) : {},
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
    const scriptState = this.sessionState.checkForResponsive();
    const lastState = this.lastScriptState;

    this.lastScriptState = scriptState;
    if (
      !lastState ||
      lastState.hasRecentErrors !== scriptState.hasRecentErrors ||
      lastState.closeDate !== scriptState.closeDate ||
      lastState.unresponsiveSeconds !== scriptState.unresponsiveSeconds
    ) {
      this.emit('script-state', scriptState);
    }
  }

  private addTabId(tabId: string, timestamp: string) {
    if (!this.tabs.has(tabId)) {
      this.tabs.set(tabId, {
        tabId,
        createdTime: timestamp,
        startOrigin: null,
      });
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
  'Other',
  'Document',
];

interface IScriptState {
  unresponsiveSeconds: number;
  hasRecentErrors: boolean;
  closeDate?: Date;
}
