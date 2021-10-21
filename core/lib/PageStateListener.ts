import IPageStateResult from '@ulixee/hero-interfaces/IPageStateResult';
import IPageStateListenArgs from '@ulixee/hero-interfaces/IPageStateListenArgs';
import { bindFunctions } from '@ulixee/commons/lib/utils';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import IPageStateAssertionBatch from '@ulixee/hero-interfaces/IPageStateAssertionBatch';
import * as Path from 'path';
import { getCacheDirectory } from '@ulixee/commons/lib/dirUtils';
import { readFileAsJson } from '@ulixee/commons/lib/fileUtils';
import { createHash } from 'crypto';
import Tab from './Tab';
import FrameEnvironment from './FrameEnvironment';
import CommandRunner from './CommandRunner';

export interface IPageStateEvents {
  resolved: { state: string; error?: Error };
}

export default class PageStateListener extends TypedEventEmitter<IPageStateEvents> {
  public readonly id: string;
  public readonly states: string[];
  public readonly startTime: number;
  public readonly startingCommandId: number;
  public readonly commandStartTime: number;

  public readonly batchAssertionsById = new Map<
    string,
    {
      domAssertionsByFrameId: Map<number, IPageStateAssertionBatch['assertions']>;
      assertions: IPageStateAssertionBatch['assertions'];
      rawAssertionsData?: unknown;
    }
  >();

  private onCloseFns: (() => any)[] = [];
  private commandFnsById = new Map<string, () => Promise<any>>();
  private readonly checkInterval: NodeJS.Timer;
  private lastResults: any;
  private isStopping = false;
  private isCheckingState = false;
  private runAgain = false;

  private readyPromise: Promise<void | Error>;

  constructor(
    public readonly jsPathId: string,
    private readonly options: IPageStateListenArgs,
    private readonly tab: Tab,
    private readonly publishResultsFn: (result: IPageStateResult) => void,
  ) {
    super();
    bindFunctions(this);
    this.id = createHash('md5').update(`${options.callsite}`).digest('hex');
    this.states = options.states;

    const commands = tab.session.commands;
    // make sure to clear out any meta
    commands.nextCommandMeta = null;
    this.startingCommandId = commands.lastId;
    this.commandStartTime = commands.last.runStartDate;

    const previousCommand = commands.history[commands.history.length - 2];
    // go one ms after the previous command
    this.startTime = previousCommand ? previousCommand.runStartDate + 1 : Date.now();

    this.readyPromise = this.bindFrameEvents().catch(err => err);
    this.checkInterval = setInterval(this.checkState, 2e3).unref();

    tab.once('close', this.stop);
  }

  public stop(result?: { state: string; error?: Error }): void {
    clearTimeout(this.checkInterval);
    if (this.isStopping) return;
    this.isStopping = true;
    this.emit('resolved', {
      state: result?.state,
      error: result?.error,
    });
    for (const fn of this.onCloseFns) fn();
  }

  public async runBatchAssert(batchId: string): Promise<boolean> {
    let failedCount = 0;
    const { domAssertionsByFrameId, assertions } = this.batchAssertionsById.get(batchId);
    for (const assertion of assertions) {
      const [frameId, type, args, , result] = assertion;
      if (type === 'url') {
        const frame = this.tab.frameEnvironmentsById.get(frameId) ?? this.tab.mainFrameEnvironment;
        const url = await frame.getUrl();
        if (url !== result) failedCount += 1;
      }
      if (type === 'resource') {
        const resource = this.tab.findResource(args[0]);
        if (!resource) failedCount += 1;
      }
    }
    for (const [frameId, frameAssertions] of domAssertionsByFrameId) {
      const frame = this.tab.frameEnvironmentsById.get(frameId);
      const failedDomAssertions = await frame.runDomAssertions(batchId, frameAssertions);
      failedCount += failedDomAssertions;
    }
    return failedCount === 0;
  }

  private async loadBatchAssert(
    args: [
      batchId: string,
      pageStateIdJsPath: IJsPath,
      assertions: IPageStateAssertionBatch['assertions'],
    ],
  ): Promise<void> {
    const [batchId] = args;
    this.batchAssertionsById.set(batchId, { assertions: [], domAssertionsByFrameId: new Map() });
    const entry = this.batchAssertionsById.get(batchId);

    let assertions = args[2];
    if (batchId.startsWith('@')) {
      // load now
      const filepath = Path.join(getCacheDirectory(), batchId);
      const assertionsBatch = await readFileAsJson<IPageStateAssertionBatch>(filepath);
      assertions = assertionsBatch.assertions;
      entry.rawAssertionsData = assertionsBatch;
    }

    const { domAssertionsByFrameId } = entry;
    for (const assertion of assertions) {
      const [frameId, type] = assertion;
      if (type === 'xpath' || type === 'jspath') {
        if (!domAssertionsByFrameId.has(frameId)) domAssertionsByFrameId.set(frameId, []);
        domAssertionsByFrameId.get(frameId).push(assertion);
      } else {
        entry.assertions.push(assertion);
      }
    }
  }

  private async bindFrameEvents(): Promise<void> {
    const frames = new Set<FrameEnvironment>();
    for (const [id, rawCommand] of Object.entries(this.options.commands)) {
      const [frameId, command, args] = rawCommand;
      const frame = this.tab.getFrameEnvironment(frameId);
      if (frame) frames.add(frame);

      if (command === 'Tab.assert') {
        await this.loadBatchAssert(args as any);
      }

      const commandRunner = new CommandRunner(command, args, {
        FrameEnvironment: frame,
        Tab: this.tab,
        Session: this.tab.session,
      });
      this.commandFnsById.set(id, commandRunner.runFn);
    }

    for (const frame of frames) {
      frame.on('paint', this.checkState);
      frame.navigations.on('status-change', this.checkState);

      this.onCloseFns.push(() => {
        frame.off('paint', this.checkState);
        frame.navigations.off('status-change', this.checkState);
      });
    }
    setImmediate(this.checkState);
  }

  private publishResult(results: IPageStateResult): void {
    if (this.shouldStop()) return;

    const stringifiedResults = JSON.stringify(results);
    if (this.lastResults !== stringifiedResults) {
      this.publishResultsFn(results);
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
