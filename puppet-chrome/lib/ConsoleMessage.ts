/**
 * Copyright 2018 Google Inc. All rights reserved.
 * Modifications copyright (c) Data Liberation Foundation Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Protocol } from 'devtools-protocol';
import { DevtoolsSession } from './DevtoolsSession';
import ExceptionDetails = Protocol.Runtime.ExceptionDetails;
import StackTrace = Protocol.Runtime.StackTrace;
import ObjectPreview = Protocol.Runtime.ObjectPreview;
import ConsoleAPICalledEvent = Protocol.Runtime.ConsoleAPICalledEvent;

export default class ConsoleMessage {
  constructor(readonly message: string, readonly location: string, readonly type: string) {}

  static create(devtoolsSession: DevtoolsSession, event: ConsoleAPICalledEvent) {
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

  static exceptionToError(exceptionDetails: ExceptionDetails) {
    const error = new Error(exceptionDetails.text);
    if (exceptionDetails.exception) {
      error.stack = stringifyRemoteObject(exceptionDetails.exception);
    } else if (exceptionDetails.stackTrace) {
      error.stack = this.printStackTrace(exceptionDetails.stackTrace);
    }
    return error;
  }

  private static printStackTrace(stackTrace: StackTrace) {
    let message = '';
    if (!stackTrace) return message;
    for (const callframe of stackTrace.callFrames) {
      const location = `${callframe.url}:${callframe.lineNumber}:${callframe.columnNumber}`;
      const functionName = callframe.functionName || '<anonymous>';
      message += `\n    at ${functionName} (${location})`;
    }
    return message;
  }
}

function stringifyRemoteObject(remoteObject: Protocol.Runtime.RemoteObject) {
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

function previewToObject(preview: ObjectPreview) {
  const subProps = preview.properties.map(
    prop => `${prop.name}: ${prop.valuePreview ? previewToObject(prop.valuePreview) : prop.value}`,
  );
  const props = `{ ${subProps.join(', ')} }`;
  if (preview.description === 'Object') return props;
  return `${preview.description}(${props})`;
}
