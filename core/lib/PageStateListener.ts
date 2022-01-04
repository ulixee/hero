import IPageStateResult from '@ulixee/hero-interfaces/IPageStateResult';
import IPageStateListenArgs from '@ulixee/hero-interfaces/IPageStateListenArgs';
import { bindFunctions } from '@ulixee/commons/lib/utils';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import IPageStateAssertionBatch from '@ulixee/hero-interfaces/IPageStateAssertionBatch';
import { createHash } from 'crypto';
import Tab from './Tab';
import CommandRunner from './CommandRunner';
import Log from '@ulixee/commons/lib/Logger';
import PageStateCodeBlock from '@ulixee/hero-timetravel/lib/PageStateCodeBlock';

const { log } = Log(module);

export interface IPageStateEvents {
  resolved: { state: string; error?: Error };
  updated: IPageStateResult;
}

interface IBatchAssertion {
  domAssertionsByFrameId: Map<number, IPageStateAssertionBatch['assertions']>;
  assertions: IPageStateAssertionBatch['assertions'];
  minValidAssertions: number;
  totalAssertions: number;
  state: string;
}

type IBatchAssertCommandArgs = [
  batchId: string,
  pageStateIdJsPath: IJsPath,
  assertions: IPageStateAssertionBatch['assertions'],
  minValidAssertions: number,
  state: string,
];

export default class PageStateListener extends TypedEventEmitter<IPageStateEvents> {
  public readonly id: string = 'default';
  public readonly states: string[];
  public readonly startTime: number;
  public readonly startingCommandId: number;
  public readonly commandStartTime: number;
  public readonly isLoaded: Promise<void | Error>;

  public readonly rawBatchAssertionsById = new Map<string, IPageStateAssertionBatch>();

  private batchAssertionsById = new Map<string, IBatchAssertion>();
  private commandFnsById = new Map<string, () => Promise<any>>();
  private readonly checkInterval: NodeJS.Timer;
  private lastResults: any;
  private isStopping = false;
  private isCheckingState = false;
  private runAgain = false;
  private watchedFrameIds = new Set<number>();

  constructor(
    public readonly jsPathId: string,
    private readonly options: IPageStateListenArgs,
    private readonly tab: Tab,
  ) {
    super();
    bindFunctions(this);
    if (options.callsite) {
      this.id = createHash('md5').update(`${options.callsite}`).digest('hex');
    }
    this.states = options.states;

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

    tab.once('close', this.stop);
    this.isLoaded = this.bindFrameEvents().catch(err => err);
    this.checkInterval = setInterval(this.checkState, 2e3).unref();
  }

  public stop(result?: { state: string; error?: Error }): void {
    clearTimeout(this.checkInterval);
    if (this.isStopping) return;
    this.isStopping = true;
    this.removeAllListeners('state');
    this.emit('resolved', {
      state: result?.state,
      error: result?.error,
    });

    for (const frameId of this.watchedFrameIds) {
      const frame = this.tab.getFrameEnvironment(frameId);
      if (!frame) continue;
      frame.off('paint', this.checkState);
      frame.navigations.off('status-change', this.checkState);
    }
  }

  public stateThatImportedBatchAssertion(id: string): string {
    return this.batchAssertionsById.get(id).state;
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

  public addAssertionBatch(state: string, batch: IPageStateAssertionBatch): string {
    if (!this.states.includes(state)) this.states.push(state);
    let fullId = batch.id;
    for (const id of this.batchAssertionsById.keys()) {
      if (id.endsWith(batch.id + '.json')) {
        fullId = id;
        break;
      }
    }
    const args: IBatchAssertCommandArgs = [
      fullId,
      JSON.parse(this.jsPathId),
      batch.assertions,
      batch.minValidAssertions,
      state,
    ];
    this.trackCommand(fullId, this.tab.mainFrameId, 'Tab.assert', args);
    this.loadBatchAssert(args);
    return fullId;
  }

  private loadBatchAssert(args: IBatchAssertCommandArgs): void {
    const [batchId, , assertions, minValidAssertions, state] = args;
    this.batchAssertionsById.set(batchId, {
      assertions: [],
      domAssertionsByFrameId: new Map(),
      totalAssertions: assertions.length,
      minValidAssertions: minValidAssertions ?? assertions.length,
      state,
    });

    const entry = this.batchAssertionsById.get(batchId);

    const { domAssertionsByFrameId } = entry;
    let domAssertionCount = 0;
    for (const assertion of assertions) {
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
      minValidAssertions,
      state,
      domAssertionCount,
      otherAssertions: entry.assertions,
    });
  }

  private async loadGeneratedBatchAssertions(args: IBatchAssertCommandArgs): Promise<void> {
    const [batchId] = args;
    if (!batchId.startsWith('@')) return;

    const assertionsBatch = await PageStateCodeBlock.loadAssertionBatch(
      batchId,
      this.tab.session.options.scriptInstanceMeta,
    );
    if (assertionsBatch) {
      args[2] = assertionsBatch.assertions;
      args[3] = assertionsBatch.minValidAssertions;

      this.rawBatchAssertionsById.set(batchId, assertionsBatch);
    }
  }

  private async bindFrameEvents(): Promise<void> {
    for (const [id, rawCommand] of Object.entries(this.options.commands)) {
      const [frameId, command, args] = rawCommand;
      if (command === 'Tab.assert') {
        await this.loadGeneratedBatchAssertions(args as any);
      }
      this.trackCommand(id, frameId, command, args);
    }

    setImmediate(this.checkState);
  }

  private trackCommand(id: string, frameId: number, command: string, args: any[]): void {
    const frame = this.tab.getFrameEnvironment(frameId);

    if (command === 'Tab.assert') {
      this.loadBatchAssert(args as any);
    }

    const commandRunner = new CommandRunner(command, args, {
      FrameEnvironment: frame,
      Tab: this.tab,
      Session: this.tab.session,
    });
    commandRunner.shouldRecord = false;
    this.commandFnsById.set(id, commandRunner.runFn);

    if (!this.watchedFrameIds.has(frame.id)) {
      this.watchedFrameIds.add(frame.id);

      frame.on('paint', this.checkState);
      frame.navigations.on('status-change', this.checkState);
    }
  }

  private publishResult(results: IPageStateResult): void {
    if (this.shouldStop()) return;

    const stringifiedResults = JSON.stringify(results);
    if (this.lastResults !== stringifiedResults) {
      this.emit('updated', results);
    }
    this.lastResults = stringifiedResults;
  }

  private async checkState(): Promise<void> {
    if (this.shouldStop()) return;
    if (this.isCheckingState) {
      this.runAgain = true;
      return;
    }

    try {
      this.isCheckingState = true;
      this.runAgain = false;

      const results: IPageStateResult = {};

      const promises = [...this.commandFnsById].map(async ([id, runCommandFn]) => {
        results[id] = await runCommandFn().catch(err => err);
      });
      await Promise.all(promises);

      this.publishResult(results);
    } finally {
      this.isCheckingState = false;
      if (this.runAgain) process.nextTick(this.checkState);
    }
  }

  private shouldStop(): boolean {
    return this.tab.isClosing || this.isStopping === true;
  }
}
