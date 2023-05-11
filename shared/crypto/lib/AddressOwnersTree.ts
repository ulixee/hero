import { sha256 } from '@ulixee/commons/lib/hashUtils';
import assert = require('assert');
import MerkleTree from '@ulixee/crypto/lib/MerkleTree';
import { IMerkleProof } from '@ulixee/specification';
import IAddressSettings, {
  ClaimsSigner,
  TransferSigner,
  UniversalSigner,
} from '../interfaces/IAddressSettings';

export default class AddressOwnersTree {
  public static getProof(
    identity: string,
    isClaim: boolean,
    merkleTree: MerkleTree,
  ): {
    signatureSettings: IMerkleProof[];
    ownerIdentityProof: IMerkleProof[];
  } {
    const signatureSettings = AddressOwnersTree.getSignatureSettingsProof(merkleTree, isClaim);
    const ownerIdentityProof = AddressOwnersTree.getIdentityIsOwnerProof(merkleTree, identity);
    return {
      signatureSettings,
      ownerIdentityProof,
    };
  }

  public static getIdentityIsOwnerProof(merkleTree: MerkleTree, identity: string): IMerkleProof[] {
    return merkleTree.getProof(sha256(identity));
  }

  public static getSignatureSettingsProof(
    merkleTree: MerkleTree,
    isClaim: boolean,
  ): IMerkleProof[] {
    return merkleTree.getProofForIndex(isClaim ? -1 : -2);
  }

  public static create(identities: string[], details: IAddressSettings): MerkleTree {
    const { claimSignatureSettings } = details;

    let signatureSettings = details.transferSignatureSettings;

    assert(identities.length > 0 && identities.length <= 6, 'Must provide 1-6 valid public key(s)');
    assert(
      signatureSettings ? signatureSettings < 7 : true,
      'Must require 6 or less signatures in a multisig',
    );
    if (!signatureSettings) {
      signatureSettings = identities.length;
    }

    const claimKeyIndices: number[] = [];
    const transferKeyIndices: number[] = [];
    for (let i = 0; i < details.signerTypes.length; i += 1) {
      const type = details.signerTypes[i];
      if (type === UniversalSigner || type === ClaimsSigner) claimKeyIndices.push(i);
      if (type === UniversalSigner || type === TransferSigner) transferKeyIndices.push(i);
    }

    if (claimKeyIndices && claimKeyIndices.length) {
      assert(
        claimKeyIndices.length >= details.claimSignatureSettings,
        'Must provide enough valid public key indices to make claims',
      );
      for (const index of claimKeyIndices) {
        assert(index < identities.length, 'Claim index must be within range of public keys');
      }
    }

    if (transferKeyIndices && transferKeyIndices.length) {
      assert(
        transferKeyIndices.length >= signatureSettings,
        'Must provide enough valid public key indices to make transfers',
      );
      for (const index of transferKeyIndices) {
        assert(index < identities.length, 'Transfer index must be within range of public keys');
      }
    }

    const leaves = identities.map(sha256);
    let fillLeaves = 2;
    if (leaves.length > 2) {
      fillLeaves = 6;
    }
    // fill up to 4 or 8 leaves so tree is balanced
    while (leaves.length < fillLeaves) {
      leaves.push(
        // empty string hashed
        Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex'),
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
    return sha256(parts.join(''));
  }
}
