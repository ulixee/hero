"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const NumberCheck_1 = require("@double-agent/analyze/lib/checks/NumberCheck");
const StringCheck_1 = require("@double-agent/analyze/lib/checks/StringCheck");
const BooleanCheck_1 = require("@double-agent/analyze/lib/checks/BooleanCheck");
const DecimalLengthCheck_1 = require("@double-agent/analyze/lib/checks/DecimalLengthCheck");
const NumberLengthCheck_1 = require("@double-agent/analyze/lib/checks/NumberLengthCheck");
const config_1 = require("@double-agent/config");
const extractDomEndpoints_1 = require("./extractDomEndpoints");
const EndpointType_1 = require("../interfaces/EndpointType");
const KeyOrderCheck_1 = require("./checks/KeyOrderCheck");
const FlagsCheck_1 = require("./checks/FlagsCheck");
const PrototypeCheck_1 = require("./checks/PrototypeCheck");
const FunctionCheck_1 = require("./checks/FunctionCheck");
const TypeCheck_1 = require("./checks/TypeCheck");
const StacktraceCheck_1 = require("./checks/StacktraceCheck");
const GetterCheck_1 = require("./checks/GetterCheck");
const SetterCheck_1 = require("./checks/SetterCheck");
const RefCheck_1 = require("./checks/RefCheck");
const ClassCheck_1 = require("./checks/ClassCheck");
const ArrayCheck_1 = require("./checks/ArrayCheck");
const SymbolCheck_1 = require("./checks/SymbolCheck");
const AutomationCheck_1 = require("./checks/AutomationCheck");
class CheckGenerator {
    constructor(profile) {
        this.checks = [];
        this.endpointsByPath = {};
        this.userAgentId = profile.userAgentId;
        this.endpointsByPath = (0, extractDomEndpoints_1.default)(profile.data.https);
        for (const { path, object } of Object.values(this.endpointsByPath)) {
            if (this.didAddAutomationChecks(path, object))
                continue;
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
    addKeyOrderChecks(path, object) {
        if (!['object', 'prototype', 'function', 'class', 'constructor', 'array'].includes(object._$type))
            return;
        if (!object._$keyOrder?.length)
            return;
        const { userAgentId } = this;
        // TODO: this is a flawed approach. We need to either get true profiles, or compare only this part to a true profile
        // ALTERNATIVELY: we could require a plugin for each Profiler/Devtools diff that explicitly checks the valid profiles
        const keys = removeAutomationKeys(path, object._$keyOrder);
        this.add(new KeyOrderCheck_1.default({ userAgentId }, { path }, keys));
    }
    addFlagChecks(path, object) {
        const { userAgentId } = this;
        if (object._$flags) {
            this.add(new FlagsCheck_1.default({ userAgentId }, { path }, object._$flags.split('')));
        }
        if (object._$functionMethods) {
            for (const name of Object.keys(object._$functionMethods)) {
                const methodPath = `${path}.${name}`;
                const methodObj = object._$functionMethods[name];
                this.add(new FlagsCheck_1.default({ userAgentId }, { path: methodPath }, methodObj._$flags.split('')));
            }
        }
    }
    addPrototypeChecks(path, object) {
        if (!['prototype', 'object', 'constructor', 'array'].includes(object._$type))
            return;
        const { userAgentId } = this;
        this.add(new PrototypeCheck_1.default({ userAgentId }, { path }, object._$protos));
    }
    addNumberChecks(path, object) {
        if (object._$type !== EndpointType_1.default.number)
            return;
        const { userAgentId } = this;
        if (config_1.default.shouldIgnorePathValue(path)) {
            this.add(new TypeCheck_1.default({ userAgentId }, { path }, EndpointType_1.default.number));
        }
        else if (object._$value === null || object._$value === undefined) {
            this.add(new NumberCheck_1.default({ userAgentId }, { path }, object._$value));
        }
        else if (String(object._$value).includes('.')) {
            const decimalStr = String(object._$value).split('.')[1];
            this.add(new DecimalLengthCheck_1.default({ userAgentId }, { path }, decimalStr.length));
        }
        else {
            this.add(new NumberLengthCheck_1.default({ userAgentId }, { path }, String(object._$value).length));
        }
    }
    addFunctionChecks(path, object) {
        if (!object._$function)
            return;
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
        const functionCheck = new FunctionCheck_1.default({ userAgentId }, { path }, codeString, methods, invocation);
        this.add(functionCheck);
    }
    addStringChecks(path, object) {
        if (object._$type !== EndpointType_1.default.string)
            return;
        const { userAgentId } = this;
        if (config_1.default.shouldIgnorePathValue(path)) {
            this.add(new TypeCheck_1.default({ userAgentId }, { path }, EndpointType_1.default.string));
        }
        else if (path.endsWith('.stack')) {
            // is stack trace
            this.add(new StacktraceCheck_1.default({ userAgentId }, { path }, object._$value));
        }
        else {
            this.add(new StringCheck_1.default({ userAgentId }, { path }, object._$value));
        }
    }
    addGetterChecks(path, object) {
        if (!object._$get)
            return;
        const { userAgentId } = this;
        this.add(new GetterCheck_1.default({ userAgentId }, { path }, { codeString: object._$get }));
        this.add(new GetterCheck_1.default({ userAgentId }, { path }, { codeStringToString: object._$getToStringToString }));
        if (object._$accessException) {
            this.add(new GetterCheck_1.default({ userAgentId }, { path }, { accessException: object._$accessException }));
        }
    }
    addSetterChecks(path, object) {
        if (!object._$set)
            return;
        const { userAgentId } = this;
        this.add(new SetterCheck_1.default({ userAgentId }, { path }, { codeString: object._$set }));
        this.add(new SetterCheck_1.default({ userAgentId }, { path }, { codeStringToString: object._$setToStringToString }));
    }
    addRefChecks(path, object) {
        if (object._$type !== EndpointType_1.default.ref)
            return;
        const { userAgentId } = this;
        this.add(new RefCheck_1.default({ userAgentId }, { path }, object._$ref));
    }
    addClassChecks(path, object) {
        if (object._$type !== EndpointType_1.default.class)
            return;
        const { userAgentId } = this;
        const hasFunction = !!object._$function;
        this.add(new ClassCheck_1.default({ userAgentId }, { path }, { hasFunction }));
        const constructorPath = `${path}.new()`;
        const constructorException = this.endpointsByPath[constructorPath]?.object._$constructorException;
        if (constructorException) {
            this.add(new ClassCheck_1.default({ userAgentId }, { path }, { constructorException }));
        }
    }
    addBooleanChecks(path, object) {
        if (object._$type !== EndpointType_1.default.boolean)
            return;
        const { userAgentId } = this;
        if (config_1.default.shouldIgnorePathValue(path)) {
            this.add(new TypeCheck_1.default({ userAgentId }, { path }, EndpointType_1.default.boolean));
        }
        else {
            this.add(new BooleanCheck_1.default({ userAgentId }, { path }, object._$value));
        }
    }
    addArrayChecks(path, object) {
        if (object._$type !== EndpointType_1.default.array)
            return;
        const { userAgentId } = this;
        const hasLengthProperty = !!object._$keyOrder?.includes('length');
        this.add(new ArrayCheck_1.default({ userAgentId }, { path }, hasLengthProperty));
    }
    addSymbolChecks(path, object) {
        if (object._$type !== EndpointType_1.default.symbol)
            return;
        const { userAgentId } = this;
        this.add(new SymbolCheck_1.default({ userAgentId }, { path }, object._$value));
    }
    addTypeChecks(path, object) {
        if (!['object', 'constructor', 'dom'].includes(object._$type))
            return;
        const { userAgentId } = this;
        this.add(new TypeCheck_1.default({ userAgentId }, { path }, object._$type));
    }
    didAddAutomationChecks(path, _) {
        const devtoolsIndicators = config_1.default.getDevtoolsIndicators();
        const profilerIndicators = config_1.default.getProfilerIndicators();
        const { userAgentId } = this;
        if (devtoolsIndicators.changed.includes(path) ||
            profilerIndicators.extraChanged.includes(path) ||
            devtoolsIndicators.changed.includes(path) ||
            devtoolsIndicators.extraChanged.includes(path)) {
            // TODO: include expected value in the devtools-indicators export so we know what to check for
            this.add(new TypeCheck_1.default({ userAgentId }, { path }, EndpointType_1.default.boolean));
            return true;
        }
        if (isAutomationAddedPath(path)) {
            this.add(new AutomationCheck_1.default({ userAgentId }, { path }));
            return true;
        }
        return false;
    }
    add(check) {
        this.checks.push(check);
    }
}
exports.default = CheckGenerator;
/////// ////////////////////////////////////////////////////////////////
function extractInvocation(path, object) {
    if (config_1.default.shouldIgnorePathValue(path)) {
        return null;
    }
    if (object._$invocation === undefined) {
        return null;
    }
    return object._$invocation;
}
function isAutomationAddedPath(path) {
    const devtoolsIndicators = config_1.default.getDevtoolsIndicators();
    const profilerIndicators = config_1.default.getProfilerIndicators();
    return (devtoolsIndicators.added.some(x => (0, config_1.pathIsPatternMatch)(path, x)) ||
        profilerIndicators.added.some(x => (0, config_1.pathIsPatternMatch)(path, x)) ||
        devtoolsIndicators.extraAdded.some(x => (0, config_1.pathIsPatternMatch)(path, x)) ||
        profilerIndicators.extraAdded.some(x => (0, config_1.pathIsPatternMatch)(path, x)) ||
        devtoolsIndicators.removed.some(x => (0, config_1.pathIsPatternMatch)(path, x)) ||
        profilerIndicators.removed.some(x => (0, config_1.pathIsPatternMatch)(path, x)));
}
function removeAutomationKeys(path, keys) {
    const cleanedKeys = [];
    for (const key of keys) {
        const keyPath = `${path}.${key}`;
        if (!isAutomationAddedPath(keyPath)) {
            cleanedKeys.push(key);
        }
    }
    return cleanedKeys;
}
//# sourceMappingURL=CheckGenerator.js.map