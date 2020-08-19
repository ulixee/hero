import { URL } from 'url';
import Protocol from 'devtools-protocol';
import ExceptionDetails = Protocol.Runtime.ExceptionDetails;
import StackTrace = Protocol.Runtime.StackTrace;

export function extractFileExtension(url: string, filetype: string) {
  const location = new URL(url);
  const matches = location.pathname.split('.');
  if (matches.length === 1 && filetype === 'document') return 'html';
  if (matches.length === 1) return 'text';
  return matches.pop().match(/([^/]+)$/)[1] || filetype;
}

export function exceptionDetailsToError(exceptionDetails: ExceptionDetails) {
  let message = exceptionDetails.text;
  if (exceptionDetails.exception) {
    message = exceptionDetails.exception.description || exceptionDetails.exception.value;
  } else if (exceptionDetails.stackTrace) {
    message += printStackTrace(exceptionDetails.stackTrace);
  }
  const error = new Error(message);
  error.stack = '';
  return error;
}

export function printStackTrace(stackTrace: StackTrace) {
  let message = '';
  for (const callframe of stackTrace.callFrames) {
    const location = `${callframe.url}:${callframe.lineNumber}:${callframe.columnNumber}`;
    const functionName = callframe.functionName || '<anonymous>';
    message += `\n    at ${functionName} (${location})`;
  }
  return message;
}
