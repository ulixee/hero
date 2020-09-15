import Debug from 'debug';

export function debug(prefix: string) {
  return Debug(`sa:${prefix}`);
}

export function isEnabled(namespace: string) {
  return Debug.enabled(namespace);
}
