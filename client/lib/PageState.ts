import { bindFunctions } from '@ulixee/commons/lib/utils';
import Timer from '@ulixee/commons/lib/Timer';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import IPageStateResult from '@ulixee/hero-interfaces/IPageStateResult';
import CoreTab from './CoreTab';
import IPageStateDefinitions, {
  IPageStateDefinitionFn,
  IStateAndAssertion,
} from '../interfaces/IPageStateDefinitions';
import Tab from './Tab';

let counter = 0;

const NullPropertyAccessRegex = /Cannot read property '.+' of (?:null|undefined)/;
const NullPropertyAccessRegexNode16 =
  /Cannot read properties of (?:null|undefined) \(reading '.+'\)/;

export default class PageState<T extends IPageStateDefinitions, K = keyof T> {
  readonly #coreTab: CoreTab;
  readonly #tab: Tab;
  readonly #states: T;
  readonly #jsPath: IJsPath = ['page-state', (counter += 1)];

  readonly #rawCommands: {
    [id: string]: [frameId: number, command: string, args: any[]];
  } = {};

  readonly #serializedCommandsById = new Map<string, string>();
  readonly #stateResolvable = new Resolvable<K>();

  constructor(tab: Tab, coreTab: CoreTab, states: T) {
    this.#tab = tab;
    this.#coreTab = coreTab;
    this.#states = states;
    bindFunctions(this);
  }

  async waitFor(timeoutMs = 30e3): Promise<K> {
    // first do a dry run of the assertions to gather all our raw commands to subscribe to
    await this.collectAssertionCommands();

    const timer = new Timer(timeoutMs);
    await this.#coreTab.addEventListener(this.#jsPath, 'page-state', this.onStateChanged, {
      commands: this.#rawCommands,
    });

    try {
      return await timer.waitForPromise(
        this.#stateResolvable.promise,
        'Timeout waiting for PageState',
      );
    } finally {
      await this.#coreTab.removeEventListener(this.#jsPath, 'page-state', this.onStateChanged);
    }
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
    try {
      const interceptFn = PageState.createCommandLookupFn(
        this.#serializedCommandsById,
        stateResult,
      );
      // intercept commands with "pushed" state
      this.#coreTab.commandQueue.intercept(interceptFn);

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

    assertionDefinitionFn({
      assert(statePromise, assertion) {
        const stateAndAssertion = [
          statePromise.catch(err => err),
          assertion,
        ] as IStateAndAssertion<any>;
        assertionSets.push({
          stateAndAssertions: [stateAndAssertion],
          minValidAssertions: 1,
        });
        return stateAndAssertion;
      },
      assertAny(count, stateAndAssertions) {
        // remove from solo entries (since all flow through the "assert" fn). need to consolidate to one entry
        for (const assertion of stateAndAssertions) {
          const matchingIndex = assertionSets.findIndex(
            x => x.stateAndAssertions.length === 1 && x.stateAndAssertions.includes(assertion),
          );
          if (matchingIndex >= 0) assertionSets.splice(matchingIndex, 1);
        }
        assertionSets.push({
          stateAndAssertions,
          minValidAssertions: count,
        });
      },
    });

    // give things a second to settle
    await new Promise(setImmediate);

    return assertionSets;
  }

  private async collectAssertionCommands(): Promise<void> {
    // run first pass where we just collect all the commands
    // we're going to get periodic updates that we're going to intercept as mock results
    const capture = (state: Promise<any>): void => {
      this.captureCommands(state).catch(() => null);
    };

    for (const [key, assertion] of Object.entries(this.#states)) {
      const result = assertion({
        assert(statePromise) {
          capture(statePromise);
          return [statePromise];
        },
        assertAny(count, stateAndAssertions) {
          for (const [statePromise] of stateAndAssertions) {
            capture(statePromise);
          }
        },
      });

      if (isPromise(result)) {
        throw new Error(
          `waitForPageState({ ${key}: Promise<any>, ... }) returns a Promise for "${key}". Each state function must have synchronous assertions.`,
        );
      }
    }

    // wait a tick for all promises to be called
    await new Promise(setImmediate);
  }

  private async captureCommands(promise: Promise<any>): Promise<void> {
    try {
      let commandCounter = 0;
      this.#coreTab.commandQueue.intercept((meta, command, ...args) => {
        const commandAlreadyLogged = Object.values(this.#rawCommands).some(x => {
          return (
            x[0] === meta.frameId &&
            x[1] === command &&
            JSON.stringify(x[2]) === JSON.stringify(args)
          );
        });
        if (commandAlreadyLogged) return;

        commandCounter += 1;
        const id = `${commandCounter}-${command}`;
        this.#rawCommands[id] = [meta.frameId, command, args];
        this.#serializedCommandsById.set(id, JSON.stringify([meta.frameId, command, args]));
      });

      // trigger a run so we can see commands that get triggered
      await promise;
    } finally {
      this.#coreTab.commandQueue.intercept(undefined);
    }
  }

  private static createCommandLookupFn(
    serializedCommandsById: Map<string, string>,
    stateResult: IPageStateResult,
  ): (meta: ISessionMeta, command: string, ...args: any[]) => any {
    const stateMapBySerializedCommand: {
      [serializedCommand: string]: any;
    } = {};

    for (const [id, result] of Object.entries(stateResult)) {
      const key = serializedCommandsById.get(id);
      stateMapBySerializedCommand[key] = result;
    }

    return (meta: ISessionMeta, command, ...args) => {
      const { frameId } = meta;
      const key = JSON.stringify([frameId, command, args]);
      return stateMapBySerializedCommand[key];
    };
  }
}

function isPromise(value: any): boolean {
  return !!value && typeof value === 'object' && 'then' in value && typeof 'then' === 'function';
}

interface IAssertionSet {
  stateAndAssertions: IStateAndAssertion<any>[];
  minValidAssertions: number;
}
