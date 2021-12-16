import { bindFunctions } from '@ulixee/commons/lib/utils';
import Timer from '@ulixee/commons/lib/Timer';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import IPageStateResult from '@ulixee/hero-interfaces/IPageStateResult';
import { readFileAsJson } from '@ulixee/commons/lib/fileUtils';
import IPageStateAssertionBatch from '@ulixee/hero-interfaces/IPageStateAssertionBatch';
import IPageStateListenArgs, { IRawCommand } from '@ulixee/hero-interfaces/IPageStateListenArgs';
import CoreTab from './CoreTab';
import IPageStateDefinitions, {
  IPageStateDefinitionFn,
  IStateAndAssertion,
} from '../interfaces/IPageStateDefinitions';
import Tab from './Tab';
import DisconnectedFromCoreError from '../connections/DisconnectedFromCoreError';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import ISourceCodeLocation from '@ulixee/commons/interfaces/ISourceCodeLocation';

let counter = 0;

const NullPropertyAccessRegex = /Cannot read property '.+' of (?:null|undefined)/;
const NullPropertyAccessRegexNode16 =
  /Cannot read properties of (?:null|undefined) \(reading '.+'\)/;
const BatchAssertionCommand = 'Tab.assert';

export default class PageState<T extends IPageStateDefinitions, K = keyof T> {
  readonly #coreTab: CoreTab;
  readonly #tab: Tab;
  readonly #states: T;
  readonly #callsite: ISourceCodeLocation[];
  readonly #jsPath: IJsPath = ['page-state', (counter += 1)];
  #idCounter = 0;

  readonly #rawCommandsById: {
    [id: string]: IRawCommand;
  } = {};

  readonly #idBySerializedCommand = new Map<string, string>();
  readonly #stateResolvable = new Resolvable<K>();
  readonly #batchAssertionPathToId: Record<string, string> = {};

  constructor(tab: Tab, coreTab: CoreTab, states: T, callSitePath: ISourceCodeLocation[]) {
    this.#tab = tab;
    this.#coreTab = coreTab;
    this.#states = states ?? ({} as T);
    this.#callsite = callSitePath;
    bindFunctions(this);
  }

  async waitFor(timeoutMs = 30e3): Promise<K> {
    // first do a dry run of the assertions to gather all our raw commands to subscribe to
    await this.collectAssertionCommands();

    const timer = new Timer(timeoutMs);
    const pageStateOptions: IPageStateListenArgs = {
      commands: this.#rawCommandsById,
      callsite: JSON.stringify(this.#callsite),
      states: Object.keys(this.#states),
    };

    await this.#coreTab
      .addEventListener(this.#jsPath, 'page-state', this.onStateChanged, pageStateOptions)
      .catch(this.rewriteNoStateError);

    let finalState: K;
    let waitError: Error;
    try {
      finalState = await timer.waitForPromise(
        this.#stateResolvable.promise,
        'Timeout waiting for PageState',
      );
      return finalState;
    } catch (error) {
      if (!(error instanceof DisconnectedFromCoreError)) {
        waitError = error;
        throw error;
      }
    } finally {
      await this.#coreTab.removeEventListener(this.#jsPath, 'page-state', this.onStateChanged, {
        state: finalState,
        error: waitError,
      });
    }
  }

  private rewriteNoStateError(error: Error): void {
    const states = Object.keys(this.#states);
    if (error instanceof CanceledPromiseError && !states.length) {
      error.name = 'ConfigurationRequired';
      error.stack = `${error.name}: ${error.message}\n${error.stack.split(/\r?\n/).pop()}`;
    }
    throw error;
  }

  private async onStateChanged(stateResult: IPageStateResult): Promise<void> {
    try {
      const state = await this.findActivePageState(stateResult);
      if (state) this.#stateResolvable.resolve(state);
    } catch (err) {
      this.#stateResolvable.reject(err);
    }
  }

  private async findActivePageState(stateResult: IPageStateResult): Promise<K> {
    if (stateResult.resolvedState) return stateResult.resolvedState as any;
    try {
      // intercept commands with "pushed" state when commands "run"
      this.#coreTab.commandQueue.intercept((meta: ISessionMeta, command, ...args) => {
        const id = this.getCommandId(meta.frameId, command, args);
        return stateResult[id];
      });

      for (const [stateKey, assertion] of Object.entries(this.#states)) {
        const assertionSets = await this.createAssertionSets(assertion);
        const isValidAssertionSet = await this.doAllAssertionsPass(assertionSets);
        if (isValidAssertionSet) return stateKey as unknown as K;
      }
      return null;
    } finally {
      this.#coreTab.commandQueue.intercept(undefined);
    }
  }

  private async doAllAssertionsPass(assertionSets: IAssertionSet[]): Promise<boolean> {
    for (const { stateAndAssertions, minValidAssertions } of assertionSets) {
      let allowedRemainingInvalidAssertions = 1 + stateAndAssertions.length - minValidAssertions;

      for (const [state, assertion] of stateAndAssertions) {
        const isValid = await this.isAssertionValid(state, assertion);

        if (!isValid) {
          allowedRemainingInvalidAssertions -= 1;
          if (allowedRemainingInvalidAssertions <= 0) return false;
        }
      }
    }
    return true;
  }

  private async isAssertionValid(
    state: Promise<T>,
    assertion: T | ((value: T) => boolean),
  ): Promise<boolean> {
    try {
      const stateResult = await state;
      if (stateResult instanceof Error) throw stateResult;

      if (assertion === undefined) {
        return !!stateResult;
      }

      if (typeof assertion === 'function') {
        const didPass = assertion(stateResult);
        if (isPromise(didPass)) {
          throw new Error(`PageState Assertions can't return promises\n\n${assertion?.toString()}`);
        }
        return didPass === true;
      }

      return assertion === stateResult;
    } catch (err) {
      if (NullPropertyAccessRegex.test(err) || NullPropertyAccessRegexNode16.test(err)) {
        return false;
      }
      throw err;
    }
  }

  private async createAssertionSets(
    assertionDefinitionFn: IPageStateDefinitionFn,
  ): Promise<IAssertionSet[]> {
    const assertionSets: IAssertionSet[] = [];
    function removeSoloAssert(assertion: IStateAndAssertion<any>): void {
      const matchingIndex = assertionSets.findIndex(
        x => x.stateAndAssertions.length === 1 && x.stateAndAssertions[0] === assertion,
      );
      if (matchingIndex >= 0) assertionSets.splice(matchingIndex, 1);
    }

    const runAssertionBatch = this.runAssertionBatch;

    assertionDefinitionFn({
      assert(statePromise, assertion) {
        const assertionSet: IAssertionSet = {
          stateAndAssertions: [[statePromise.catch(err => err), assertion]],
          minValidAssertions: 1,
        };
        assertionSets.push(assertionSet);
        return assertionSet.stateAndAssertions[0];
      },
      assertAny(count, stateAndAssertions) {
        // remove from solo entries (since all flow through the "assert" fn). need to consolidate to one entry
        for (const assertion of stateAndAssertions) {
          removeSoloAssert(assertion);
        }
        assertionSets.push({
          stateAndAssertions,
          minValidAssertions: count,
        });
      },
      loadFrom(exportedStateOrPath) {
        assertionSets.push({
          stateAndAssertions: [[runAssertionBatch(exportedStateOrPath).catch(err => err), true]],
          minValidAssertions: 1,
        });
      },
    });

    // wait for all to complete
    for (const assertionSet of assertionSets) {
      for (const assertion of assertionSet.stateAndAssertions) {
        await assertion[0];
      }
    }

    return assertionSets;
  }

  private async collectAssertionCommands(): Promise<void> {
    // run first pass where we just collect all the commands
    // we're going to get periodic updates that we're going to intercept as mock results
    const promises: Promise<any>[] = [];
    const capture = (assert: IStateAndAssertion<any>): void => {
      const promise = this.captureCommands(assert).catch(() => null);
      promises.push(promise);
    };
    const loadAssertionBatch = this.loadAssertionBatch;

    for (const [key, assertion] of Object.entries(this.#states)) {
      const result = assertion({
        assert(statePromise, assert) {
          capture([statePromise, assert]);
          return [statePromise];
        },
        assertAny(count, stateAndAssertions) {
          for (const assert of stateAndAssertions) {
            capture(assert);
          }
        },
        loadFrom(exportedStateOrPath) {
          const promise = loadAssertionBatch(key, exportedStateOrPath);
          promises.push(promise);
        },
      });

      if (isPromise(result)) {
        throw new Error(
          `waitForPageState({ ${key}: Promise<any>, ... }) returns a Promise for "${key}". Each state function must have synchronous assertions.`,
        );
      }
    }

    await Promise.all(promises);
  }

  private runAssertionBatch(
    exportedStateOrPath: string | IPageStateAssertionBatch,
  ): Promise<number> {
    const id =
      typeof exportedStateOrPath === 'string'
        ? this.#batchAssertionPathToId[exportedStateOrPath]
        : exportedStateOrPath.id;
    return this.#coreTab.commandQueue.run(BatchAssertionCommand, id);
  }

  private async loadAssertionBatch(
    state: string,
    exportedStateOrPath: IPageStateAssertionBatch | string,
  ): Promise<void> {
    let assertionBatch = exportedStateOrPath as IPageStateAssertionBatch;
    if (typeof exportedStateOrPath === 'string') {
      // @ is a shortcut meaning, "read from Core::CacheLocation"
      if (exportedStateOrPath.startsWith('@')) {
        assertionBatch = {
          id: exportedStateOrPath,
          minValidAssertions: null,
          assertions: null,
        };
      } else {
        assertionBatch = await readFileAsJson(exportedStateOrPath);
      }
      this.#batchAssertionPathToId[exportedStateOrPath] = assertionBatch.id;
    }

    this.#idCounter += 1;
    const id = `${this.#idCounter}-${BatchAssertionCommand}`;
    this.#rawCommandsById[id] = [
      null,
      BatchAssertionCommand,
      [
        assertionBatch.id,
        this.#jsPath,
        assertionBatch.assertions,
        assertionBatch.minValidAssertions,
        state,
      ],
    ];
    // NOTE: subtly different serialization - serialized command and local run just stores the id
    this.#idBySerializedCommand.set(
      JSON.stringify([null, BatchAssertionCommand, [assertionBatch.id]]),
      id,
    );
  }

  private async captureCommands(assert: IStateAndAssertion<any>): Promise<void> {
    try {
      this.#coreTab.commandQueue.intercept((meta, command, ...args) => {
        const record = [meta.frameId, command, args] as IRawCommand;
        // see if already logged
        const serialized = JSON.stringify(record);
        if (this.#idBySerializedCommand.has(serialized)) return;

        this.#idCounter += 1;
        const id = `${this.#idCounter}-${command}`;
        this.#rawCommandsById[id] = record;
        this.#idBySerializedCommand.set(serialized, id);
      });

      // trigger a run so we can see commands that get triggered
      await assert[0];
    } finally {
      this.#coreTab.commandQueue.intercept(undefined);
    }
  }

  private getCommandId(frameId: number, command: string, args: any[]): string {
    const key = JSON.stringify([frameId ?? null, command, args]);
    return this.#idBySerializedCommand.get(key);
  }
}

function isPromise(value: any): boolean {
  return !!value && typeof value === 'object' && 'then' in value && typeof 'then' === 'function';
}

interface IAssertionSet {
  stateAndAssertions: IStateAndAssertion<any>[];
  minValidAssertions: number;
}
