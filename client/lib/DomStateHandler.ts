import { bindFunctions } from '@ulixee/commons/lib/utils';
import Timer from '@ulixee/commons/lib/Timer';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import IDomStateResult from '@ulixee/hero-interfaces/IDomStateResult';
import CoreTab from './CoreTab';
import DisconnectedFromCoreError from '../connections/DisconnectedFromCoreError';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import ISourceCodeLocation from '@ulixee/commons/interfaces/ISourceCodeLocation';
import IDomState, { IStateAndAssertion } from '@ulixee/hero-interfaces/IDomState';
import IDomStateListenArgs, { IRawCommand } from '@ulixee/hero-interfaces/IDomStateListenArgs';

let counter = 0;

const NullPropertyAccessRegex = /Cannot read property '.+' of (?:null|undefined)/;
const NullPropertyAccessRegexNode16 =
  /Cannot read properties of (?:null|undefined) \(reading '.+'\)/;

export default class DomStateHandler {
  readonly #coreTab: CoreTab;
  readonly #callsite: ISourceCodeLocation[];
  readonly #jsPath: IJsPath = ['dom-state', (counter += 1)];
  readonly #idBySerializedCommand = new Map<string, string>();
  readonly #rawCommandsById: {
    [id: string]: IRawCommand;
  } = {};

  #waitingForResult: Resolvable<boolean>;
  #commandIdCounter = 0;
  #onMatchFn: (error: Error, didMatch?: boolean) => any;
  #isSubscribed = false;
  #onlyRunCallbackOnMatch = false;
  #retryNumber = 0;

  constructor(
    readonly domState: IDomState,
    readonly name: string,
    coreTab: CoreTab,
    callsitePath: ISourceCodeLocation[],
  ) {
    this.#coreTab = coreTab;
    this.#callsite = callsitePath;
    bindFunctions(this);
  }

  async cancel(cancelPromise: CanceledPromiseError): Promise<void> {
    this.#waitingForResult?.reject(cancelPromise);
    await this.clear(false, cancelPromise);
  }

  async register(
    onMatchFn: (error: Error, didMatch?: boolean) => any,
    onlyRunCallbackOnMatch = false,
  ): Promise<void> {
    // first do a dry run of the assertions to gather all our raw commands to subscribe to
    await this.collectAssertionCommands();
    const listenArgs: IDomStateListenArgs = {
      commands: this.#rawCommandsById,
      callsite: JSON.stringify(this.#callsite),
      name: this.name,
      url: this.domState.url,
    };

    this.#onlyRunCallbackOnMatch = onlyRunCallbackOnMatch;
    this.#onMatchFn = onMatchFn;
    await this.#coreTab.addEventListener(
      this.#jsPath,
      'dom-state',
      this.onStateChanged,
      listenArgs,
      {
        retryNumber: this.#retryNumber,
        callsite: this.#callsite,
      },
    );
    this.#isSubscribed = true;
  }

  async clear(result: boolean, error?: Error): Promise<void> {
    if (!this.#isSubscribed) return;
    this.#isSubscribed = false;
    await this.#coreTab.removeEventListener(
      this.#jsPath,
      'dom-state',
      this.onStateChanged,
      {
        didMatch: result,
        error,
      },
      {
        retryNumber: this.#retryNumber,
        callsite: this.#callsite,
      },
    );
  }

  async check(isRetry = false): Promise<boolean> {
    if (isRetry) this.#retryNumber += 1;
    return await this.waitFor(30e3, true);
  }

  async waitFor(timeoutMs = 30e3, once = false): Promise<boolean> {
    const timer = new Timer(timeoutMs ?? 30e3);
    let waitError: Error;
    let success: boolean;

    try {
      this.#waitingForResult = new Resolvable<boolean>();
      await this.register((error, result) => {
        if (error) this.#waitingForResult.reject(error);
        else if (result || once) this.#waitingForResult.resolve(result);
      });

      success = await timer.waitForPromise(
        this.#waitingForResult.promise,
        'Timeout waiting for DomState',
      );
      return success;
    } catch (error) {
      timer.clear();
      if (!(error instanceof DisconnectedFromCoreError)) {
        waitError = error;
        throw error;
      }
    } finally {
      this.#waitingForResult = null;
      await this.clear(success, waitError);
    }
  }

  private async onStateChanged(stateResult: IDomStateResult): Promise<void> {
    let didResolve: boolean;
    let error: Error;
    try {
      // intercept commands with "pushed" state when commands "run"
      didResolve = await this.#coreTab.commandQueue.intercept(
        (meta: ISessionMeta, command, ...args) => {
          const id = this.getCommandId(meta.frameId, command, args);
          return stateResult[id];
        },
        async () => {
          const assertionSets = await this.createAssertionSets();
          for (const [state, assertion] of assertionSets) {
            if (!(await this.isAssertionValid(state, assertion))) {
              return false;
            }
          }
          return true;
        },
      );
    } catch (err) {
      error = err;
    }

    if (didResolve === false && this.#onlyRunCallbackOnMatch) return;

    await this.#onMatchFn(error, didResolve);
  }

  private async isAssertionValid<T>(
    state: Promise<T> | PromiseLike<T>,
    assertion: T | ((value: T) => boolean),
  ): Promise<boolean> {
    try {
      const stateResult = await state;
      if (stateResult instanceof Error) throw stateResult;

      if (assertion === undefined) {
        return !!stateResult;
      }

      if (typeof assertion === 'function') {
        const didPass = (assertion as Function)(stateResult);
        if (isPromise(didPass)) {
          throw new Error(`DomState Assertions can't return promises\n\n${assertion?.toString()}`);
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

  private async createAssertionSets(): Promise<IStateAndAssertion<any>[]> {
    const assertionSets: IStateAndAssertion<any>[] = [];

    this.domState.all(function assert(statePromise, assertion) {
      assertionSets.push([Promise.resolve(statePromise).catch(err => err), assertion]);
    });

    // wait for all to complete
    for (const assertion of assertionSets) {
      await assertion[0];
    }

    return assertionSets;
  }

  private async collectAssertionCommands(): Promise<void> {
    // run first pass where we just collect all the commands
    // we're going to get periodic updates that we're going to intercept as mock results
    let result: any;

    await this.#coreTab.commandQueue.intercept(
      (meta, command, ...args) => {
        const record = [meta.frameId, command, args] as IRawCommand;
        // see if already logged
        const serialized = JSON.stringify(record);
        if (this.#idBySerializedCommand.has(serialized)) return;

        this.#commandIdCounter += 1;
        const id = `${this.#commandIdCounter}-${command}`;
        this.#rawCommandsById[id] = record;
        this.#idBySerializedCommand.set(serialized, id);
      },
      async () => {
        const runCommands: Promise<any>[] = [];
        // trigger a run so we can see commands that get triggered
        result = this.domState.all(function assert(statePromise) {
          runCommands.push(Promise.resolve(statePromise).catch(() => null));
        });
        await Promise.all(runCommands);
      },
    );

    if (isPromise(result)) {
      throw new Error(
        `DomState (${
          this.name ?? 'no name'
        }) all(assert) returns a Promise. Each state function must have synchronous assertions.`,
      );
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
