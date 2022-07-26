import { decodeHash, encodeHash } from '@ulixee/commons/lib/hashUtils';
import MerkleTree from '@ulixee/crypto/lib/MerkleTree';
import * as path from 'path';
import * as fs from 'fs';
import Keypair from '@ulixee/crypto/lib/Keypair';
import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';
import IWalletSignature from '@ulixee/specification/types/IWalletSignature';
import IKeyringSettings, {
  ClaimsKey,
  TransferKey,
  UniversalKey,
} from '../interfaces/IKeyringSettings';
import KeyringTree from './KeyringTree';
import KeyringSignature from './KeyringSignature';

let isFilepathInitialized = false;

export default class Keyring {
  public readonly address: string;
  public keyringSettings: IKeyringSettings;
  public keyringMerkleTree: MerkleTree;

  public readonly transferKeys: Keypair[] = [];
  public readonly claimKeys: Keypair[] = [];

  private readonly loadedKeypairsAtIndexes: Keypair[] = [];

  constructor(
    merkleTreeLeaves: Buffer[],
    settings: IKeyringSettings,
    loadedKeypairsAtIndexes: (Keypair | undefined)[],
  ) {
    this.loadedKeypairsAtIndexes = loadedKeypairsAtIndexes;

    this.keyringSettings = settings ?? ({} as any);
    this.keyringSettings.keyTypes ??= loadedKeypairsAtIndexes.map(() => UniversalKey);
    for (let i = 0; i <= loadedKeypairsAtIndexes.length; i += 1) {
      if (loadedKeypairsAtIndexes[i]) {
        const keyType = this.keyringSettings.keyTypes[i];

        if (keyType === UniversalKey || keyType === TransferKey) {
          this.transferKeys.push(loadedKeypairsAtIndexes[i]);
        }
        if (keyType === UniversalKey || keyType === ClaimsKey) {
          this.claimKeys.push(loadedKeypairsAtIndexes[i]);
        }
      }
    }
    this.keyringSettings.transferSignatureSettings ||= this.transferKeys.length;
    this.keyringSettings.claimSignatureSettings ||= 1;
    this.keyringMerkleTree = new MerkleTree(merkleTreeLeaves);
    this.address = Keyring.encodeAddress(this.keyringMerkleTree.getRoot());
  }

  public async save(format = false, filename?: string, relativeTo?: string): Promise<string> {
    const basePath = relativeTo || path.join(process.cwd(), 'keyrings');
    if (!isFilepathInitialized) {
      if (!fs.existsSync(basePath)) fs.mkdirSync(basePath, { recursive: true });
      isFilepathInitialized = true;
    }

    const json = TypeSerializer.stringify(this.toJSON(), { format });
    const filepath = path.resolve(basePath, `${filename || this.address}.json`);
    await fs.promises.writeFile(filepath, json, { encoding: 'utf8' });
    return filepath;
  }

  public sign(hash: Buffer, keypairIndexes: number[], isClaim = false): IWalletSignature {
    const keypairs: Keypair[] = [];

    for (let i = 0; i < this.loadedKeypairsAtIndexes.length; i += 1) {
      if (!keypairIndexes.includes(i)) continue;
      this.verifyKeyType(i, isClaim);
      const key = this.loadedKeypairsAtIndexes[i];
      if (key) keypairs.push(key);
    }

    return KeyringSignature.create(
      hash,
      keypairs,
      this.keyringMerkleTree,
      this.keyringSettings,
      isClaim,
    );
  }

  public verifyKeyType(index: number, isClaim: boolean): void {
    const keyType = this.keyringSettings.keyTypes[index];
    const isUniversalKey = keyType === UniversalKey;

    if (!isUniversalKey) {
      if (isClaim && keyType !== ClaimsKey)
        throw new Error(
          `Invalid key index provided (${index}). Index not valid for claim transactions.`,
        );
      if (!isClaim && keyType !== TransferKey)
        throw new Error(
          `Invalid key index provided (${index}). Index not valid for transfer transactions.`,
        );
    }
  }

  public toJSON(): IKeyringJson {
    return {
      settings: this.keyringSettings,
      address: this.address,
      merkleLeaves: this.keyringMerkleTree.leaves,
      loadedKeysAtIndexes: this.loadedKeypairsAtIndexes.map(x => (x ? x.export() : null)),
    };
  }

  public static verify(
    address: string,
    hashedMessage: Buffer,
    signature: IWalletSignature,
    isClaim = false,
  ): boolean {
    const treeRoot = this.decodeAddress(address);
    const keyringSignature = new KeyringSignature(treeRoot, signature);
    return !keyringSignature.isInvalid(hashedMessage, isClaim);
  }

  public static createFromKeypairs(keypairs: Keypair[], settings?: IKeyringSettings): Keyring {
    settings ??= { keyTypes: keypairs.map(() => UniversalKey) };

    settings.transferSignatureSettings ??= settings.keyTypes.filter(
      x => x === UniversalKey || x === TransferKey,
    ).length;
    settings.claimSignatureSettings ??= 1;

    const merkleTree = KeyringTree.create(
      keypairs.map(x => x.publicKey),
      settings,
    );
    settings.keyTypes ??= keypairs.map(() => UniversalKey);

    return new Keyring(merkleTree.leaves, settings, keypairs);
  }

  public static fromStored(stored: IKeyringJson): Keyring {
    const { merkleLeaves, loadedKeysAtIndexes, address, settings } = stored;

    const keyring = new Keyring(
      merkleLeaves,
      settings,
      loadedKeysAtIndexes.map(x => (x ? Keypair.loadFromPem(x) : null)),
    );
    if (keyring.address !== address)
      throw new Error(
        `Failed to load Address Keyring. Different key calculated. (calculated: ${keyring.address}, stored: ${address})`,
      );
    return keyring;
  }

  public static readFromPath(filepath: string, relativeToDir = process.cwd()): Keyring {
    if (!path.isAbsolute(filepath)) filepath = path.resolve(relativeToDir, filepath);
    const data = fs.readFileSync(filepath, { encoding: 'utf8' });
    const keyring = TypeSerializer.parse(data);
    return Keyring.fromStored(keyring);
  }

  public static readFromFile(address: string, relativeToDir = process.cwd()): Keyring {
    const filepath = path.resolve(relativeToDir, 'keyrings', `${address}.json`);
    return Keyring.readFromPath(filepath);
  }

  public static getKeyIndices(settings: IKeyringSettings, isClaim: boolean): number[] {
    const publicKeyIndices: number[] = [];
    for (let i = 0; i < settings.keyTypes.length; i += 1) {
      const type = settings.keyTypes[i];

      if (type === UniversalKey) publicKeyIndices.push(i);
      else if (isClaim && type === ClaimsKey) publicKeyIndices.push(i);
      else if (!isClaim && type === TransferKey) publicKeyIndices.push(i);
    }
    return publicKeyIndices;
  }

  public static encodeAddress(treeRoot: Buffer): string {
    return encodeHash(treeRoot, 'ar');
  }

  public static decodeAddress(address: string): Buffer {
    return decodeHash(address, 'ar');
  }
}

interface IKeyringJson {
  address: string;
  merkleLeaves: Buffer[];
  settings: IKeyringSettings;
  loadedKeysAtIndexes: (string | null)[];
}
