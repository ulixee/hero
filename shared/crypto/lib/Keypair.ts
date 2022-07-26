import { promises as fs, readFileSync } from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import {
  createPrivateKey,
  generateKeyPair,
  generateKeyPairSync,
  KeyObject,
  sign,
  verify,
} from 'crypto';
import { sha3 } from '@ulixee/commons/lib/hashUtils';
import { existsAsync } from '@ulixee/commons/lib/fileUtils';
import Log from '@ulixee/commons/lib/Logger';
import { createPublicKeyFromBytes, getPublicKeyBytes } from './pkiUtils';
import { UnreadableKeysError } from './errors';

const { log } = Log(module);

const generateKeyPairAsync = promisify(generateKeyPair);

export default class Keypair {
  public static defaultPkcsCipher = 'aes-256-cbc';
  public readonly privateKey: KeyObject;

  public get publicKey(): Buffer {
    this.#publicKeyBytes ??= getPublicKeyBytes(this.privateKey);
    return this.#publicKeyBytes;
  }

  #publicKeyBytes: Buffer;

  constructor(privateKey: KeyObject) {
    if (!privateKey) {
      throw new UnreadableKeysError(`Cannot read private key`);
    }
    this.privateKey = privateKey;
  }

  public sign(hashedMessage: Buffer): Buffer {
    return sign(null, hashedMessage, this.privateKey);
  }

  public verifyKeys(): void {
    const hashedMessage = sha3(Buffer.from('signed_test_message'));
    const signature = this.sign(hashedMessage);
    const isValid = Keypair.verify(this.publicKey, hashedMessage, signature);
    if (!isValid) {
      throw new UnreadableKeysError('This keypair does not match the ED25519 spec');
    }
  }

  public export(passphrase?: string, cipher?: string): string {
    if (passphrase) {
      cipher ??= Keypair.defaultPkcsCipher;
    }
    return this.privateKey.export({
      type: 'pkcs8',
      format: 'pem',
      cipher,
      passphrase,
    }) as string;
  }

  public async save(
    filepath: string,
    options?: { passphrase?: string; cipher?: string },
  ): Promise<string> {
    if (filepath) {
      if (!path.isAbsolute(filepath)) {
        filepath = path.join(process.cwd(), filepath);
      }
      if (!(await existsAsync(path.dirname(filepath)))) {
        await fs.mkdir(path.dirname(filepath), { recursive: true });
      }
    }
    if (!filepath) throw new Error('keypair is missing filepath');

    await fs.writeFile(filepath, this.export(options?.passphrase, options?.cipher));
    return filepath;
  }

  // CLASS METHODS ////////////////////////

  public static loadFromFile(filepath: string, options?: { keyPassphrase?: string }): Keypair {
    if (!path.isAbsolute(filepath)) {
      filepath = path.join(process.cwd(), filepath);
    }
    const data = readFileSync(filepath, 'utf8');
    return this.loadFromPem(data, options);
  }

  public static loadFromPem(data: string, options?: { keyPassphrase?: string }): Keypair {
    const privateKey = createPrivateKey({
      key: data,
      format: 'pem',
      type: 'pkcs8',
      passphrase: options?.keyPassphrase,
    });
    const keypair = new Keypair(privateKey);
    keypair.verifyKeys();
    return keypair;
  }

  public static createSync(): Keypair {
    const key = generateKeyPairSync('ed25519');
    const pair = new Keypair(key.privateKey);
    pair.verifyKeys();
    return pair;
  }

  public static async create(): Promise<Keypair> {
    const key = await generateKeyPairAsync('ed25519');
    const pair = new Keypair(key.privateKey);
    pair.verifyKeys();
    return pair;
  }

  public static verify(
    publicKey: string | Buffer | KeyObject,
    hashedMessage: Buffer,
    signature: Buffer,
  ): boolean {
    if (!signature || !signature.length || !hashedMessage || !hashedMessage.length || !publicKey)
      return false;

    if (typeof publicKey === 'string') {
      publicKey = Buffer.from(publicKey, 'hex');
    }

    if (publicKey instanceof Buffer) {
      publicKey = createPublicKeyFromBytes(publicKey);
    }

    try {
      return verify(null, hashedMessage, publicKey, signature);
    } catch (err) {
      log.error('Error validating signature', err);
      return false;
    }
  }
}
