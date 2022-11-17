import {
  createPrivateKey,
  createPublicKey,
  generateKeyPair,
  KeyObject,
  KeyPairKeyObjectResult,
  sign,
  verify,
} from 'crypto';
import { promisify } from 'util';

const ed25519DerPrefix = Buffer.from('302a300506032b6570032100', 'hex');
const ed25519PrivateDerPrefix = Buffer.from('302e020100300506032b657004220420', 'hex');
const generateKeyPairAsync = promisify(generateKeyPair);

export default class Ed25519 {
  static getPublicKeyBytes(privateKey: KeyObject): Buffer {
    return createPublicKey(privateKey)
      .export({ type: 'spki', format: 'der' })
      .slice(ed25519DerPrefix.length);
  }

  static getPrivateKeyBytes(key: KeyObject): Buffer {
    return key.export({ type: 'pkcs8', format: 'der' }).slice(ed25519PrivateDerPrefix.length);
  }

  static createPublicKeyFromBytes(bytes: Buffer): KeyObject {
    if (bytes.length !== 32) {
      throw new Error(
        `Wrong key length (${bytes.length}) provided to createPublicKeyFromBytes. Must be 32 bytes (20 hex chars)`,
      );
    }
    const keyDer = Buffer.concat([ed25519DerPrefix, bytes]);

    return createPublicKey({ key: keyDer, format: 'der', type: 'spki' });
  }

  static createPrivateKeyFromBytes(bytes: Buffer): KeyObject {
    if (bytes.length !== 32) {
      throw new Error(
        `Wrong key length (${bytes.length}) provided to importPublicKey. Must be 32 bytes (20 hex chars)`,
      );
    }
    const keyDer = Buffer.concat([ed25519PrivateDerPrefix, bytes]);

    return createPrivateKey({ key: keyDer, format: 'der', type: 'pkcs8' });
  }

  static async create(): Promise<KeyPairKeyObjectResult> {
    return await generateKeyPairAsync('ed25519');
  }

  static verify(publicKey: KeyObject, hashedMessage: Buffer, signature: Buffer): Error | boolean {
    if (!signature || !signature.length || !hashedMessage || !hashedMessage.length || !publicKey)
      return false;

    try {
      return verify(null, hashedMessage, publicKey, signature);
    } catch (e) {
      return e;
    }
  }

  static sign(keyObject: KeyObject, hashedMessage: Buffer): Buffer {
    return sign(null, hashedMessage, keyObject);
  }
}
