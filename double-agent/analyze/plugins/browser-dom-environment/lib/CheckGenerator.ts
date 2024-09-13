import BaseCheck from '@double-agent/analyze/lib/checks/BaseCheck';
import NumberCheck from '@double-agent/analyze/lib/checks/NumberCheck';
import StringCheck from '@double-agent/analyze/lib/checks/StringCheck';
import BooleanCheck from '@double-agent/analyze/lib/checks/BooleanCheck';
import DecimalLengthCheck from '@double-agent/analyze/lib/checks/DecimalLengthCheck';
import NumberLengthCheck from '@double-agent/analyze/lib/checks/NumberLengthCheck';
import IBaseProfile from '@double-agent/collect/interfaces/IBaseProfile';
import Config, { pathIsPatternMatch } from '@double-agent/config';
import extractDomEndpoints, { IEndpoint } from './extractDomEndpoints';
import EndpointType, { IEndpointType } from '../interfaces/EndpointType';
import KeyOrderCheck from './checks/KeyOrderCheck';
import FlagsCheck from './checks/FlagsCheck';
import PrototypeCheck from './checks/PrototypeCheck';
import FunctionCheck from './checks/FunctionCheck';
import TypeCheck from './checks/TypeCheck';
import StacktraceCheck from './checks/StacktraceCheck';
import GetterCheck from './checks/GetterCheck';
import SetterCheck from './checks/SetterCheck';
import RefCheck from './checks/RefCheck';
import ClassCheck from './checks/ClassCheck';
import ArrayCheck from './checks/ArrayCheck';
import SymbolCheck from './checks/SymbolCheck';
import AutomationCheck from './checks/AutomationCheck';
import IDomDescriptor from '../interfaces/IDomDescriptor';

export default class CheckGenerator {
  public checks: BaseCheck[] = [];

  private readonly endpointsByPath: { [path: string]: IEndpoint } = {};
  private readonly userAgentId: string;

  constructor(profile: IBaseProfile<any>) {
    this.userAgentId = profile.userAgentId;
    this.endpointsByPath = extractDomEndpoints(profile.data.https);
    for (const { path, object } of Object.values(this.endpointsByPath)) {
      if (this.didAddAutomationChecks(path, object)) continue;
      this.addKeyOrderChecks(path, object);
      this.addFlagChecks(path, object);
      this.addPrototypeChecks(path, object);
      this.addNumberChecks(path, object);
      this.addFunctionChecks(path, object);
      this.addStringChecks(path, object);
      this.addGetterChecks(path, object);
      this.addSetterChecks(path, object);
      this.addRefChecks(path, object);
      this.addClassChecks(path, object);
      this.addBooleanChecks(path, object);
      this.addArrayChecks(path, object);
      this.addSymbolChecks(path, object);
      this.addTypeChecks(path, object);
    }
  }

  private addKeyOrderChecks(path: string, object: IDomDescriptor) {
    if (
      !['object', 'prototype', 'function', 'class', 'constructor', 'array'].includes(object._$type)
    )
      return;
    if (!object._$keyOrder?.length) return;

    const { userAgentId } = this;
    // TODO: this is a flawed approach. We need to either get true profiles, or compare only this part to a true profile
    // ALTERNATIVELY: we could require a plugin for each Profiler/Devtools diff that explicitly checks the valid profiles
    const keys = removeAutomationKeys(path, object._$keyOrder);
    this.add(new KeyOrderCheck({ userAgentId }, { path }, keys));
  }

  private addFlagChecks(path: string, object: IDomDescriptor) {
    const { userAgentId } = this;

    if (object._$flags) {
      this.add(new FlagsCheck({ userAgentId }, { path }, object._$flags.split('')));
    }

    if (object._$functionMethods) {
      for (const name of Object.keys(object._$functionMethods)) {
        const methodPath = `${path}.${name}`;
        const methodObj = object._$functionMethods[name];
        this.add(
          new FlagsCheck({ userAgentId }, { path: methodPath }, methodObj._$flags.split('')),
        );
      }
    }
  }

  private addPrototypeChecks(path: string, object: IDomDescriptor) {
    if (!['prototype', 'object', 'constructor', 'array'].includes(object._$type)) return;

    const { userAgentId } = this;
    this.add(new PrototypeCheck({ userAgentId }, { path }, object._$protos));
  }

  private addNumberChecks(path: string, object: IDomDescriptor): IChecks {
    if (object._$type !== EndpointType.number) return;

    const { userAgentId } = this;
    if (Config.shouldIgnorePathValue(path)) {
      this.add(new TypeCheck({ userAgentId }, { path }, EndpointType.number));
    } else if (object._$value === null || object._$value === undefined) {
      this.add(new NumberCheck({ userAgentId }, { path }, object._$value as number));
    } else if (String(object._$value).includes('.')) {
      const decimalStr = String(object._$value).split('.')[1];
      this.add(new DecimalLengthCheck({ userAgentId }, { path }, decimalStr.length));
    } else {
      this.add(new NumberLengthCheck({ userAgentId }, { path }, String(object._$value).length));
    }
  }

  private addFunctionChecks(path: string, object: IDomDescriptor) {
    if (!object._$function) return;
    if (!['function', 'class', 'prototype'].includes(object._$type)) {
      throw new Error(`Unknown function type: ${object._$type}`);
    }

    const { userAgentId } = this;
    const codeString = object._$function;
    const invocation = extractInvocation(path, object);
    const methods = {};
    if (object._$functionMethods) {
      for (const name of Object.keys(object._$functionMethods)) {
        methods[name] = object._$functionMethods[name]._$value;
      }
    }

    const functionCheck = new FunctionCheck(
      { userAgentId },
      { path },
      codeString,
      methods,
      invocation,
    );
    this.add(functionCheck);
  }

  private addStringChecks(path: string, object: IDomDescriptor): IChecks {
    if (object._$type !== EndpointType.string) return;

    const { userAgentId } = this;
    if (Config.shouldIgnorePathValue(path)) {
      this.add(new TypeCheck({ userAgentId }, { path }, EndpointType.string));
    } else if (path.endsWith('.stack')) {
      // is stack trace
      this.add(new StacktraceCheck({ userAgentId }, { path }, object._$value as string));
    } else {
      this.add(new StringCheck({ userAgentId }, { path }, object._$value as string));
    }
  }

  private addGetterChecks(path: string, object: IDomDescriptor) {
    if (!object._$get) return;

    const { userAgentId } = this;
    this.add(new GetterCheck({ userAgentId }, { path }, { codeString: object._$get }));
    this.add(
      new GetterCheck(
        { userAgentId },
        { path },
        { codeStringToString: object._$getToStringToString },
      ),
    );

    if (object._$accessException) {
      this.add(
        new GetterCheck({ userAgentId }, { path }, { accessException: object._$accessException }),
      );
    }
  }

  private addSetterChecks(path: string, object: IDomDescriptor) {
    if (!object._$set) return;

    const { userAgentId } = this;
    this.add(new SetterCheck({ userAgentId }, { path }, { codeString: object._$set }));
    this.add(
      new SetterCheck(
        { userAgentId },
        { path },
        { codeStringToString: object._$setToStringToString },
      ),
    );
  }

  private addRefChecks(path: string, object: IDomDescriptor) {
    if (object._$type !== EndpointType.ref) return;

    const { userAgentId } = this;
    this.add(new RefCheck({ userAgentId }, { path }, object._$ref));
  }

  private addClassChecks(path: string, object: IDomDescriptor) {
    if (object._$type !== EndpointType.class) return;

    const { userAgentId } = this;
    const hasFunction = !!object._$function;
    this.add(new ClassCheck({ userAgentId }, { path }, { hasFunction }));

    const constructorPath = `${path}.new()`;
    const constructorException =
      this.endpointsByPath[constructorPath]?.object._$constructorException;
    if (constructorException) {
      this.add(new ClassCheck({ userAgentId }, { path }, { constructorException }));
    }
  }

  private addBooleanChecks(path: string, object: IDomDescriptor) {
    if (object._$type !== EndpointType.boolean) return;

    const { userAgentId } = this;
    if (Config.shouldIgnorePathValue(path)) {
      this.add(new TypeCheck({ userAgentId }, { path }, EndpointType.boolean));
    } else {
      this.add(new BooleanCheck({ userAgentId }, { path }, object._$value as boolean));
    }
  }

  private addArrayChecks(path: string, object: IDomDescriptor) {
    if (object._$type !== EndpointType.array) return;

    const { userAgentId } = this;
    const hasLengthProperty = !!object._$keyOrder?.includes('length');
    this.add(new ArrayCheck({ userAgentId }, { path }, hasLengthProperty));
  }

  private addSymbolChecks(path: string, object: IDomDescriptor) {
    if (object._$type !== EndpointType.symbol) return;

    const { userAgentId } = this;
    this.add(new SymbolCheck({ userAgentId }, { path }, object._$value as string));
  }

  private addTypeChecks(path: string, object: IDomDescriptor) {
    if (!['object', 'constructor', 'dom'].includes(object._$type)) return;

    const { userAgentId } = this;
    this.add(new TypeCheck({ userAgentId }, { path }, object._$type));
  }

  private didAddAutomationChecks(path: string, _: IDomDescriptor): boolean {
    const devtoolsIndicators = Config.getDevtoolsIndicators();
    const profilerIndicators = Config.getProfilerIndicators();
    const { userAgentId } = this;
    if (
      devtoolsIndicators.changed.includes(path) ||
      profilerIndicators.extraChanged.includes(path) ||
      devtoolsIndicators.changed.includes(path) ||
      devtoolsIndicators.extraChanged.includes(path)
    ) {
      // TODO: include expected value in the devtools-indicators export so we know what to check for
      this.add(new TypeCheck({ userAgentId }, { path }, EndpointType.boolean));
      return true;
    }
    if (isAutomationAddedPath(path)) {
      this.add(new AutomationCheck({ userAgentId }, { path }));
      return true;
    }
    return false;
  }

  private add(check: BaseCheck) {
    this.checks.push(check);
  }
}

/////// ////////////////////////////////////////////////////////////////

function extractInvocation(path: string, object: any) {
  if (Config.shouldIgnorePathValue(path)) {
    return null;
  }
  if (object._$invocation === undefined) {
    return null;
  }
  return object._$invocation;
}

function isAutomationAddedPath(path: string): boolean {
  const devtoolsIndicators = Config.getDevtoolsIndicators();
  const profilerIndicators = Config.getProfilerIndicators();
  return (
    devtoolsIndicators.added.some(x => pathIsPatternMatch(path, x)) ||
    profilerIndicators.added.some(x => pathIsPatternMatch(path, x)) ||
    devtoolsIndicators.extraAdded.some(x => pathIsPatternMatch(path, x)) ||
    profilerIndicators.extraAdded.some(x => pathIsPatternMatch(path, x)) ||
    devtoolsIndicators.removed.some(x => pathIsPatternMatch(path, x)) ||
    profilerIndicators.removed.some(x => pathIsPatternMatch(path, x))
  );
}

function removeAutomationKeys(path: string, keys: string[]) {
  const cleanedKeys: string[] = [];
  for (const key of keys) {
    const keyPath = `${path}.${key}`;
    if (!isAutomationAddedPath(keyPath)) {
      cleanedKeys.push(key);
    }
  }

  return cleanedKeys;
}

// types /////////////////////////////////////////////////////////////////////////////////////

interface ICheck {
  path: string;
  type: IEndpointType;
  value?: any;

  // numbers
  length?: number;
  decimalLength?: number;

  // functions
  methods?: any;
  invocation?: string;
  errorClass?: string;

  // class
  isFunction?: boolean;

  // getters, setters, and functions
  codeString?: string;
  codeStringToString?: string;

  // getters
  accessException?: string;

  // class constructor
  constructorException?: string;

  // ref
  ref?: string;

  // arrays
  hasLength?: boolean;

  // flags
  isFrozen?: boolean;
  isSealed?: boolean;
}

type IChecks = ICheck[];
