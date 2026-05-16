"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ConsoleMessage {
    constructor(message, location, type) {
        this.message = message;
        this.location = location;
        this.type = type;
    }
    static create(devtoolsSession, event) {
        const { args, stackTrace, type, context } = event;
        const message = args
            .map(arg => {
            devtoolsSession.disposeRemoteObject(arg);
            return stringifyRemoteObject(arg);
        })
            .join(' ');
        const location = `//#${context ?? 'nocontext'}${this.printStackTrace(stackTrace)}`;
        return new ConsoleMessage(message, location, type);
    }
    static exceptionToError(exceptionDetails) {
        const error = new Error(exceptionDetails.text);
        if (exceptionDetails.exception) {
            error.stack = stringifyRemoteObject(exceptionDetails.exception);
        }
        else if (exceptionDetails.stackTrace) {
            error.stack = this.printStackTrace(exceptionDetails.stackTrace);
        }
        return error;
    }
    static printStackTrace(stackTrace) {
        let message = '';
        if (!stackTrace)
            return message;
        for (const callframe of stackTrace.callFrames) {
            const location = `${callframe.url}:${callframe.lineNumber}:${callframe.columnNumber}`;
            const functionName = callframe.functionName || '<anonymous>';
            message += `\n    at ${functionName} (${location})`;
        }
        return message;
    }
}
exports.default = ConsoleMessage;
function stringifyRemoteObject(remoteObject) {
    if (remoteObject.unserializableValue) {
        if (remoteObject.type === 'bigint' && typeof BigInt !== 'undefined') {
            return BigInt(remoteObject.unserializableValue.replace('n', ''));
        }
        switch (remoteObject.unserializableValue) {
            case '-0':
                return -0;
            case 'NaN':
                return NaN;
            case 'Infinity':
                return Infinity;
            case '-Infinity':
                return -Infinity;
            default:
                throw new Error(`Unsupported unserializable value: ${remoteObject.unserializableValue}`);
        }
    }
    if (remoteObject.type === 'object' && remoteObject.preview) {
        return JSON.stringify(previewToObject(remoteObject.preview));
    }
    return remoteObject.value ?? remoteObject.description;
}
function previewToObject(preview) {
    const subProps = preview.properties.map(prop => `${prop.name}: ${prop.valuePreview ? previewToObject(prop.valuePreview) : prop.value}`);
    const props = `{ ${subProps.join(', ')} }`;
    if (preview.description === 'Object')
        return props;
    return `${preview.description}(${props})`;
}
//# sourceMappingURL=ConsoleMessage.js.map