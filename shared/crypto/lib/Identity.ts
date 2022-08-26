import { promises as fs, readFileSync } from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import {
  createPrivateKey,
  generateKeyPair,
  generateKeyPairSync,
  KeyExportOptions,
  KeyObject,
  sign,
  verify,
} from 'crypto';
import { sha3 } from '@ulixee/commons/lib/hashUtils';
import { existsAsync } from '@ulixee/commons/lib/fileUtils';
import Log from '@ulixee/commons/lib/Logger';
import { decodeBuffer, encodeBuffer } from '@ulixee/commons/lib/bufferUtils';
import { createPublicKeyFromBytes, getPublicKeyBytes } from './pkiUtils';
import { UnreadableIdentityError } from './errors';

const { log } = Log(module);

const generateKeyPairAsync = promisify(generateKeyPair);

export default class Identity {
  public static defaultPkcsCipher = 'aes-256-cbc';
  public static encodingPrefix = 'id' as const;
  public readonly privateKey: KeyObject;

  public get bech32(): string {
    this.#bech32 ??= encodeBuffer(this.publicKey, Identity.encodingPrefix);
    return this.#bech32;
  }

  public get publicKey(): Buffer {
    this.#publicKeyBytes ??= getPublicKeyBytes(this.privateKey);
    return this.#publicKeyBytes;
  }

  #bech32: string;
  #publicKeyBytes: Buffer;

  constructor(privateKey: KeyObject) {
    if (!privateKey) {
      throw new UnreadableIdentityError(`Cannot read private key`);
    }
    this.privateKey = privateKey;
  }

  public sign(hashedMessage: Buffer): Buffer {
    return sign(null, hashedMessage, this.privateKey);
  }

  public equals(identityBech32: string): boolean {
    return this.bech32 === identityBech32;
  }

  public verifyKeys(): void {
    const hashedMessage = sha3(Buffer.from('signed_test_message'));
    const signature = this.sign(hashedMessage);
    const isValid = Identity.verify(this.bech32, hashedMessage, signature);
    if (!isValid) {
      throw new UnreadableIdentityError(
        'This Identity private key does not match the ED25519 spec',
      );
    }
  }

  public export(passphrase?: string, cipher?: string): string {
    const options: KeyExportOptions<'pem'> = {
      type: 'pkcs8',
      format: 'pem',
    };
    if (passphrase) {
      options.passphrase = passphrase;
      options.cipher = cipher ?? Identity.defaultPkcsCipher;
    }
    return this.privateKey.export(options) as string;
  }

  public toJSON(): string {
    return this.bech32;
  }

  public toString(): string {
    return this.bech32;
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
    if (!filepath) throw new Error('No valid filepath was provided');

    await fs.writeFile(filepath, this.export(options?.passphrase, options?.cipher));
    return filepath;
  }

  // CLASS METHODS ////////////////////////

  public static loadFromFile(
    filepath: string,
    options?: { relativeToPath?: string; keyPassphrase?: string },
  ): Identity {
    if (!path.isAbsolute(filepath)) {
      filepath = path.join(options?.relativeToPath ?? process.cwd(), filepath);
    }
    const data = readFileSync(filepath, 'utf8');
    return this.loadFromPem(data, options);
  }

  public static loadFromPem(data: string, options?: { keyPassphrase?: string }): Identity {
    const privateKey = createPrivateKey({
      key: data,
      format: 'pem',
      type: 'pkcs8',
      passphrase: options?.keyPassphrase,
    });
    const identity = new Identity(privateKey);
    identity.verifyKeys();
    return identity;
  }

  public static createSync(): Identity {
    const key = generateKeyPairSync('ed25519');
    const identity = new Identity(key.privateKey);
    identity.verifyKeys();
    return identity;
  }

  public static async create(): Promise<Identity> {
    const key = await generateKeyPairAsync('ed25519');
    const pair = new Identity(key.privateKey);
    pair.verifyKeys();
    return pair;
  }

  public static verify(identityBech32: string, hashedMessage: Buffer, signature: Buffer): boolean {
    if (
      !signature ||
      !signature.length ||
      !hashedMessage ||
      !hashedMessage.length ||
      !identityBech32
    )
      return false;

    const publicKeyBytes = decodeBuffer(identityBech32, this.encodingPrefix);
    const publicKey = createPublicKeyFromBytes(publicKeyBytes);

    try {
      return verify(null, hashedMessage, publicKey, signature);
    } catch (err) {
      log.error('Error validating signature', err);
      return false;
    }
  }
}
