import Debug from 'debug';

export function getDebugNamespace(prefix: string) {
  return `sa:${prefix}`;
}

export function debug(prefix: string) {
  return Debug(getDebugNamespace(prefix));
}

export function isEnabled(namespace: string) {
  return Debug.enabled(namespace);
}
