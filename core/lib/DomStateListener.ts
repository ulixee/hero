import IDomStateResult from '@ulixee/hero-interfaces/IDomStateResult';
import IDomStateListenArgs from '@ulixee/hero-interfaces/IDomStateListenArgs';
import { bindFunctions } from '@ulixee/commons/lib/utils';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import { IJsPath } from '@unblocked-web/js-path';
import IDomStateAssertionBatch from '@ulixee/hero-interfaces/IDomStateAssertionBatch';
import { createHash } from 'crypto';
import Tab from './Tab';
import CommandRunner from './CommandRunner';
import Log from '@ulixee/commons/lib/Logger';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';

const { log } = Log(module);

export interface IDomStateEvents {
  resolved: { didMatch: boolean; error?: Error };
  updated: IDomStateResult;
}

interface IBatchAssertion {
  domAssertionsByFrameId: Map<number, IDomStateAssertionBatch['assertions']>;
  assertions: IDomStateAssertionBatch['assertions'];
  minValidAssertions: number;
  totalAssertions: number;
}

type IBatchAssertCommandArgs = [
  batchId: string,
  domStateIdJsPath: IJsPath,
  assertions: IDomStateAssertionBatch['assertions'],
  minValidAssertions: number,
  name: string,
];

export default class DomStateListener extends TypedEventEmitter<IDomStateEvents> {
  public readonly id: string = 'default';
  public readonly name: string;
  public readonly url: string | RegExp;
  public readonly startTime: number;
  public readonly startingCommandId: number;
  public readonly commandStartTime: number;

  public get hasCommands(): boolean {
    return this.commandFnsById.size > 0;
  }

  public readonly rawBatchAssertionsById = new Map<string, IDomStateAssertionBatch>();

  private batchAssertionsById = new Map<string, IBatchAssertion>();
  private commandFnsById = new Map<string, () => Promise<any>>();
  private readonly checkInterval: NodeJS.Timer;
  private lastResults: any;
  private isStopping = false;
  private isCheckingState = false;
  private runAgainTime = 0;
  private watchedFrameIds = new Set<number>();
  private events = new EventSubscriber();

  constructor(
    public readonly jsPathId: string,
    private readonly options: IDomStateListenArgs,
    private readonly tab: Tab,
  ) {
    super();
    bindFunctions(this);

    const key = [options.name, options.url].filter(Boolean);
    if (options.callsite) {
      key.push(createHash('md5').update(`${options.callsite}`).digest('hex'));
    }
    this.id = key.join('-');
    this.name = options.name;
    this.url = options.url;

    this.logger = log.createChild(module, {
      sessionId: tab.sessionId,
    });

    const commands = tab.session.commands;
    // make sure to clear out any meta
    commands.nextCommandMeta = null;
    this.startingCommandId = commands.lastId;
    this.commandStartTime = commands.last.runStartDate;

    const previousCommand = commands.history[commands.history.length - 2];
    // go one ms after the previous command
    this.startTime = previousCommand ? previousCommand.runStartDate + 1 : Date.now();
    this.events.once(tab, 'close', this.stop);
    this.bindFrameEvents();
    this.checkInterval = setInterval(this.validateState, 2e3).unref();
  }

  public stop(result?: { didMatch: boolean; error?: Error }): void {
    clearTimeout(this.checkInterval);
    if (this.isStopping) return;
    this.isStopping = true;
    this.removeAllListeners('state');
    this.emit('resolved', {
      didMatch: result?.didMatch ?? false,
      error: result?.error,
    });
    this.events.close();
  }

  public async runBatchAssert(batchId: string): Promise<boolean> {
    const failCounts = {
      url: 0,
      resource: [],
      dom: 0,
      storage: 0,
    };
    const { domAssertionsByFrameId, assertions, totalAssertions, minValidAssertions } =
      this.batchAssertionsById.get(batchId);
    for (const assertion of assertions) {
      const [frameId, assertType, args, comparison, result] = assertion;
      if (assertType === 'url') {
        const frame = this.tab.frameEnvironmentsById.get(frameId) ?? this.tab.mainFrameEnvironment;
        const url = frame.url;
        if (url !== result) failCounts.url += 1;
      }
      if (assertType === 'resource') {
        const filter = args[0];
        const resource = this.tab.findResource(filter);
        if (comparison === '!!' && !resource) failCounts.resource.push(filter);
      }
      if (assertType === 'storage') {
        const [filter, prop] = args;
        const storage = this.tab.findStorageChange(filter);
        if (comparison === '!!' && !storage) failCounts.storage += 1;

        if (comparison === '===' && prop) {
          if (!storage || storage[prop] !== result) failCounts.storage += 1;
        }
      }
    }

    for (const [frameId, frameAssertions] of domAssertionsByFrameId) {
      const frame = this.tab.frameEnvironmentsById.get(frameId);
      const failedDomAssertions = await frame.runDomAssertions(batchId, frameAssertions);
      failCounts.dom += failedDomAssertions;
    }

    const failedCount =
      failCounts.url + failCounts.resource.length + failCounts.dom + failCounts.storage;
    const validAssertions = totalAssertions - failedCount;
    this.logger.stats('BatchAssert results', {
      batchId,
      validAssertions,
      minValidAssertions,
      failCounts,
    });

    return validAssertions >= minValidAssertions;
  }

  public addAssertionBatch(batch: IDomStateAssertionBatch): string {
    let batchId = batch.id;
    for (const id of this.batchAssertionsById.keys()) {
      if (id.endsWith(batch.id + '.json')) {
        batchId = id;
        break;
      }
    }
    const args: IBatchAssertCommandArgs = [
      batchId,
      JSON.parse(this.jsPathId),
      batch.assertions,
      batch.minValidAssertions,
      this.name,
    ];
    this.trackCommand(batchId, this.tab.mainFrameId, 'Tab.assert', args);
    this.batchAssertionsById.set(batchId, {
      assertions: [],
      domAssertionsByFrameId: new Map(),
      totalAssertions: batch.assertions.length,
      minValidAssertions: batch.minValidAssertions ?? batch.assertions.length,
    });

    const entry = this.batchAssertionsById.get(batchId);

    const { domAssertionsByFrameId } = entry;
    let domAssertionCount = 0;
    for (const assertion of batch.assertions) {
      const [frameId, type] = assertion;
      if (type === 'xpath' || type === 'jspath') {
        if (!domAssertionsByFrameId.has(frameId)) domAssertionsByFrameId.set(frameId, []);
        domAssertionsByFrameId.get(frameId).push(assertion);
        domAssertionCount += 1;
      } else {
        // make a copy
        const record: IBatchAssertion['assertions'][0] = [...assertion];
        if (record[2])
          record[2] = [...record[2]].map(x => {
            if (typeof x === 'object') return { ...x };
            return x;
          });
        entry.assertions.push(record);
      }
    }

    this.logger.stats('Loading BatchAssert', {
      batchId,
      minValidAssertions: batch.minValidAssertions,
      domAssertionCount,
      otherAssertions: entry.assertions,
    });
    return batchId;
  }

  private bindFrameEvents(): void {
    for (const [id, rawCommand] of Object.entries(this.options.commands)) {
      const [frameId, command, args] = rawCommand;
      this.trackCommand(id, frameId, command, args);
    }

    setImmediate(this.validateState);
  }

  private trackCommand(id: string, frameId: number, command: string, args: any[]): void {
    const frame = this.tab.getFrameEnvironment(frameId);

    const commandRunner = new CommandRunner(command, args, {
      FrameEnvironment: frame,
      Tab: this.tab,
      Session: this.tab.session,
    });
    commandRunner.shouldRecord = false;
    this.commandFnsById.set(id, commandRunner.runFn);

    if (!this.watchedFrameIds.has(frame.id)) {
      this.watchedFrameIds.add(frame.id);
      this.events.on(frame, 'paint', this.validateState);
      this.events.on(frame.navigations, 'status-change', this.validateState);
    }
  }

  private publishResult(results: IDomStateResult): void {
    if (this.shouldStop()) return;

    const stringifiedResults = JSON.stringify(results);
    if (this.lastResults !== stringifiedResults) {
      this.emit('updated', results);
    }
    this.lastResults = stringifiedResults;
  }

  private async validateState(): Promise<void> {
    if (this.shouldStop()) return;
    if (this.isCheckingState) {
      this.runAgainTime = Date.now();
      return;
    }

    try {
      this.isCheckingState = true;
      this.runAgainTime = 0;

      const results: IDomStateResult = {};

      const promises = [...this.commandFnsById].map(async ([id, runCommandFn]) => {
        results[id] = await runCommandFn().catch(err => err);
      });
      await Promise.all(promises);

      this.publishResult(results);
    } finally {
      this.isCheckingState = false;
      if (this.runAgainTime > 0)
        setTimeout(this.validateState, Date.now() - this.runAgainTime).unref();
    }
  }

  private shouldStop(): boolean {
    return this.tab.isClosing || this.isStopping === true;
  }
}
