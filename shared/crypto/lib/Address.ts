import MerkleTree from '@ulixee/crypto/lib/MerkleTree';
import * as path from 'path';
import * as fs from 'fs';
import Identity from '@ulixee/crypto/lib/Identity';
import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';
import IAddressSignature from '@ulixee/specification/types/IAddressSignature';
import { encodeBuffer, decodeBuffer } from '@ulixee/commons/lib/bufferUtils';
import IAddressSettings, {
  ClaimsSigner,
  TransferSigner,
  UniversalSigner,
} from '../interfaces/IAddressSettings';
import AddressOwnersTree from './AddressOwnersTree';
import AddressSignature from './AddressSignature';

let isFilepathInitialized = false;

export default class Address {
  public static defaultDirname = 'addresses';

  public readonly bech32: string;
  public addressSettings: IAddressSettings;
  public ownersMerkleTree: MerkleTree;

  public readonly transferSigners: Identity[] = [];
  public readonly claimSigners: Identity[] = [];

  private readonly loadedIdentitiesAtIndexes: Identity[] = [];

  constructor(
    merkleTreeLeaves: Buffer[],
    settings: IAddressSettings,
    loadedIdentitiesAtIndexes: (Identity | undefined)[],
  ) {
    this.loadedIdentitiesAtIndexes = loadedIdentitiesAtIndexes;

    this.addressSettings = settings ?? ({} as any);
    this.addressSettings.signerTypes ??= loadedIdentitiesAtIndexes.map(() => UniversalSigner);
    for (let i = 0; i <= loadedIdentitiesAtIndexes.length; i += 1) {
      if (loadedIdentitiesAtIndexes[i]) {
        const keyType = this.addressSettings.signerTypes[i];

        if (keyType === UniversalSigner || keyType === TransferSigner) {
          this.transferSigners.push(loadedIdentitiesAtIndexes[i]);
        }
        if (keyType === UniversalSigner || keyType === ClaimsSigner) {
          this.claimSigners.push(loadedIdentitiesAtIndexes[i]);
        }
      }
    }
    this.addressSettings.transferSignatureSettings ||= this.transferSigners.length;
    this.addressSettings.claimSignatureSettings ||= 1;
    this.ownersMerkleTree = new MerkleTree(merkleTreeLeaves);
    this.bech32 = Address.encodeAddress(this.ownersMerkleTree.getRoot());
  }

  public async save(format = false, filename?: string, relativeTo?: string): Promise<string> {
    const basePath = relativeTo || path.join(process.cwd(), Address.defaultDirname);
    if (!isFilepathInitialized) {
      if (!fs.existsSync(basePath)) fs.mkdirSync(basePath, { recursive: true });
      isFilepathInitialized = true;
    }

    const json = TypeSerializer.stringify(this.toJSON(), { format });
    const filepath = path.resolve(basePath, `${filename || this.bech32}.json`);
    await fs.promises.writeFile(filepath, json, { encoding: 'utf8' });
    return filepath;
  }

  public sign(hash: Buffer, identityIndexes: number[], isClaim = false): IAddressSignature {
    const identities: Identity[] = [];

    for (let i = 0; i < this.loadedIdentitiesAtIndexes.length; i += 1) {
      if (!identityIndexes.includes(i)) continue;
      this.verifyKeyType(i, isClaim);
      const key = this.loadedIdentitiesAtIndexes[i];
      if (key) identities.push(key);
    }

    return AddressSignature.create(
      hash,
      identities,
      this.ownersMerkleTree,
      this.addressSettings,
      isClaim,
    );
  }

  public verifyKeyType(index: number, isClaim: boolean): void {
    const keyType = this.addressSettings.signerTypes[index];
    const isUniversalKey = keyType === UniversalSigner;

    if (!isUniversalKey) {
      if (isClaim && keyType !== ClaimsSigner)
        throw new Error(
          `Invalid key index provided (${index}). Index not valid for claim transactions.`,
        );
      if (!isClaim && keyType !== TransferSigner)
        throw new Error(
          `Invalid key index provided (${index}). Index not valid for transfer transactions.`,
        );
    }
  }

  public equals(addressBech32: string): boolean {
    return this.bech32 === addressBech32;
  }

  public toJSON(): IAddressJson {
    return {
      settings: this.addressSettings,
      bech32: this.bech32,
      merkleLeaves: this.ownersMerkleTree.leaves,
      loadedKeysAtIndexes: this.loadedIdentitiesAtIndexes.map(x => (x ? x.export() : null)),
    };
  }

  public static verify(
    addressBech32: string,
    hashedMessage: Buffer,
    signature: IAddressSignature,
    isClaim = false,
  ): boolean {
    const treeRoot = this.decodeAddress(addressBech32);
    const addressSignature = new AddressSignature(treeRoot, signature);
    return !addressSignature.isInvalid(hashedMessage, isClaim);
  }

  public static createFromSigningIdentities(
    signingIdentities: Identity[],
    settings?: IAddressSettings,
  ): Address {
    settings ??= { signerTypes: signingIdentities.map(() => UniversalSigner) };

    settings.transferSignatureSettings ??= settings.signerTypes.filter(
      x => x === UniversalSigner || x === TransferSigner,
    ).length;
    settings.claimSignatureSettings ??= 1;

    const merkleTree = AddressOwnersTree.create(
      signingIdentities.map(x => x.bech32),
      settings,
    );
    settings.signerTypes ??= signingIdentities.map(() => UniversalSigner);

    return new Address(merkleTree.leaves, settings, signingIdentities);
  }

  public static fromStored(stored: IAddressJson): Address {
    const { merkleLeaves, loadedKeysAtIndexes, bech32, settings } = stored;

    const address = new Address(
      merkleLeaves,
      settings,
      loadedKeysAtIndexes.map(x => (x ? Identity.loadFromPem(x) : null)),
    );
    if (address.bech32 !== bech32)
      throw new Error(
        `Failed to load Address. Different key calculated. (calculated: ${address.bech32}, stored: ${bech32})`,
      );
    return address;
  }

  public static readFromPath(filepath: string, relativeToDir = process.cwd()): Address {
    if (!path.isAbsolute(filepath)) filepath = path.resolve(relativeToDir, filepath);
    const data = fs.readFileSync(filepath, { encoding: 'utf8' });
    const address = TypeSerializer.parse(data);
    return Address.fromStored(address);
  }

  public static readFromFile(addressBech32: string, relativeToDir = process.cwd()): Address {
    const filepath = path.resolve(relativeToDir, Address.defaultDirname, `${addressBech32}.json`);
    return Address.readFromPath(filepath);
  }

  public static getIdentityIndices(settings: IAddressSettings, isClaim: boolean): number[] {
    const identityIndices: number[] = [];
    for (let i = 0; i < settings.signerTypes.length; i += 1) {
      const type = settings.signerTypes[i];

      if (type === UniversalSigner) identityIndices.push(i);
      else if (isClaim && type === ClaimsSigner) identityIndices.push(i);
      else if (!isClaim && type === TransferSigner) identityIndices.push(i);
    }
    return identityIndices;
  }

  public static encodeAddress(treeRoot: Buffer): string {
    return encodeBuffer(treeRoot, 'ar');
  }

  public static decodeAddress(addressBech32: string): Buffer {
    return decodeBuffer(addressBech32, 'ar');
  }
}

interface IAddressJson {
  bech32: string;
  merkleLeaves: Buffer[];
  settings: IAddressSettings;
  loadedKeysAtIndexes: (string | null)[];
}
