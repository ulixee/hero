import { createPublicKey, KeyObject } from 'crypto';

const ed25519DerPrefix = Buffer.from('302a300506032b6570032100', 'hex');
export function getPublicKeyBytes(key: KeyObject): Buffer {
  return createPublicKey(key).export({ type: 'spki', format: 'der' }).slice(ed25519DerPrefix.length);
}

export function createPublicKeyFromBytes(bytes: Buffer): KeyObject {
  if (bytes.length !== 32) {
    throw new Error(
      `Wrong key length (${bytes.length}) provided to importPublicKey. Must be 32 bytes (20 hex chars)`,
    );
  }
  const keyDer = Buffer.concat([ed25519DerPrefix, bytes]);

  return createPublicKey({ key: keyDer, format: 'der', type: 'spki' });
}
