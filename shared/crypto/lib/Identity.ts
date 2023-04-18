import { promises as fs, readFileSync, existsSync } from 'fs';
import * as path from 'path';
import { createPrivateKey, generateKeyPairSync, KeyExportOptions, KeyObject } from 'crypto';
import { sha256 } from '@ulixee/commons/lib/hashUtils';
import { existsAsync } from '@ulixee/commons/lib/fileUtils';
import Log from '@ulixee/commons/lib/Logger';
import { decodeBuffer, encodeBuffer } from '@ulixee/commons/lib/bufferUtils';
import Ed25519 from './Ed25519';
import { UnreadableIdentityError } from './errors';

const { log } = Log(module);

export default class Identity {
  public static defaultPkcsCipher = 'aes-256-cbc';
  public static encodingPrefix = 'id' as const;
  public readonly privateKey: KeyObject;

  public get bech32(): string {
    this.#bech32 ??= encodeBuffer(this.publicKey, Identity.encodingPrefix);
    return this.#bech32;
  }

  public get publicKey(): Buffer {
    this.#publicKeyBytes ??= Ed25519.getPublicKeyBytes(this.privateKey);
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
    return Ed25519.sign(this.privateKey, hashedMessage);
  }

  public equals(identityBech32: string): boolean {
    return this.bech32 === identityBech32;
  }

  public verifyKeys(): void {
    const hashedMessage = sha256(Buffer.from('signed_test_message'));
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
    if (existsSync(filepath)) {
      throw new Error('You attempted to overwrite an existing Identity!! Please remove it first.');
    }

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
    const key = await Ed25519.create();
    const pair = new Identity(key.privateKey);
    pair.verifyKeys();
    return pair;
  }

  public static verify(identityBech32: string, hashedMessage: Buffer, signature: Buffer): boolean {
    if (!identityBech32) return false;
    const publicKeyBytes = decodeBuffer(identityBech32, this.encodingPrefix);

    const publicKey = Ed25519.createPublicKeyFromBytes(publicKeyBytes);
    const isValid = Ed25519.verify(publicKey, hashedMessage, signature);
    if (isValid === true) return true;

    if (isValid instanceof Error) {
      log.error('Error validating signature', {
        error: isValid,
      });
    }
    return false;
  }
}
