import { createHash } from 'crypto';
import { bech32m } from 'bech32';

export function hash(data: Buffer, prefix: 'scr' | 'dbx'): string {
  const digest = createHash('sha3-256').update(data).digest();
  const words = bech32m.toWords(digest);
  return bech32m.encode(prefix, words);
}
