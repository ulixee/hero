import { sha3 } from '@ulixee/commons/lib/hashUtils';
import * as assert from 'assert';
import MerkleTree from '@ulixee/crypto/lib/MerkleTree';
import { IMerkleProof } from '@ulixee/specification';
import IKeyringSettings, {
  ClaimsKey,
  TransferKey,
  UniversalKey,
} from '../interfaces/IKeyringSettings';

export default class KeyringTree {
  public static getProof(
    publicKey: Buffer,
    isClaim: boolean,
    merkleTree: MerkleTree,
  ): {
    signatureSettings: IMerkleProof[];
    publicKeyProof: IMerkleProof[];
  } {
    const signatureSettings = KeyringTree.getSignatureSettingsProof(merkleTree, isClaim);
    const publicKeyProof = KeyringTree.getPublicKeyProof(merkleTree, publicKey);
    return {
      signatureSettings,
      publicKeyProof,
    };
  }

  public static getPublicKeyProof(merkleTree: MerkleTree, publicKey: Buffer): IMerkleProof[] {
    return merkleTree.getProof(sha3(publicKey));
  }

  public static getSignatureSettingsProof(
    merkleTree: MerkleTree,
    isClaim: boolean,
  ): IMerkleProof[] {
    return merkleTree.getProofForIndex(isClaim ? -1 : -2);
  }

  public static create(publicKeys: Buffer[], details: IKeyringSettings): MerkleTree {
    const { claimSignatureSettings } = details;

    let signatureSettings = details.transferSignatureSettings;

    assert(publicKeys.length > 0 && publicKeys.length <= 6, 'Must provide 1-6 valid public key(s)');
    assert(
      signatureSettings ? signatureSettings < 7 : true,
      'Must require 6 or less signatures in a multisig',
    );
    if (!signatureSettings) {
      signatureSettings = publicKeys.length;
    }

    const claimKeyIndices: number[] = [];
    const transferKeyIndices: number[] = [];
    for (let i = 0; i < details.keyTypes.length; i += 1) {
      const type = details.keyTypes[i];
      if (type === UniversalKey || type === ClaimsKey) claimKeyIndices.push(i);
      if (type === UniversalKey || type === TransferKey) transferKeyIndices.push(i);
    }

    if (claimKeyIndices && claimKeyIndices.length) {
      assert(
        claimKeyIndices.length >= details.claimSignatureSettings,
        'Must provide enough valid public key indices to make claims',
      );
      for (const index of claimKeyIndices) {
        assert(index < publicKeys.length, 'Claim index must be within range of public keys');
      }
    }

    if (transferKeyIndices && transferKeyIndices.length) {
      assert(
        transferKeyIndices.length >= signatureSettings,
        'Must provide enough valid public key indices to make transfers',
      );
      for (const index of transferKeyIndices) {
        assert(index < publicKeys.length, 'Transfer index must be within range of public keys');
      }
    }

    const leaves = publicKeys.map(sha3);
    let fillLeaves = 2;
    if (leaves.length > 2) {
      fillLeaves = 6;
    }
    // fill up to 4 or 8 leaves so tree is balanced
    while (leaves.length < fillLeaves) {
      leaves.push(
        // empty string hashed
        Buffer.from('1111111111111111111111111111111111111111111111111111111111111111', 'hex'),
      );
    }

    leaves.push(
      this.createLeaf(signatureSettings, details.transferSignatureSalt, transferKeyIndices),
    );
    leaves.push(
      this.createLeaf(claimSignatureSettings ?? 1, details.claimSignatureSalt, claimKeyIndices),
    );

    return new MerkleTree(leaves);
  }

  public static createLeaf(
    signatureSettings: number,
    salt: Buffer,
    publicKeyIndices: number[],
  ): Buffer {
    const parts = [
      signatureSettings ?? '',
      salt?.toString('hex') ?? '',
      publicKeyIndices?.join(',') ?? '',
    ];
    return sha3(parts.join(''));
  }
}
