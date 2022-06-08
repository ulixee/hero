import { createHash } from 'crypto';
import { bech32m } from 'bech32'

export function hashDatabox(script: Buffer): string {
  const hash = createHash('sha3-256').update(script).digest();
  const words = bech32m.toWords(hash);
  return bech32m.encode('dbx', words);
}
