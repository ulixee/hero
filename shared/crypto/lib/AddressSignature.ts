import { IAddressOwnershipProof, IAddressSignature } from '@ulixee/specification';
import Identity from '@ulixee/crypto/lib/Identity';
import MerkleTree from '@ulixee/crypto/lib/MerkleTree';
import { sha3 } from '@ulixee/commons/lib/hashUtils';
import { MerklePosition } from '@ulixee/specification/types/IMerkleProof';
import IAddressSettings from '../interfaces/IAddressSettings';
import AddressOwnersTree from './AddressOwnersTree';
import Address from './Address';

export default class AddressSignature {
  public get signatureSettings(): IAddressSignature['signatureSettings'] {
    return this.signature.signatureSettings;
  }

  constructor(readonly treeRoot: Buffer, readonly signature: IAddressSignature) {}

  public isValidSignaturePosition(isClaim: boolean): boolean {
    const proofsToRight = this.signatureSettings.settingsMerkleProofs.filter(
      x => x.position === MerklePosition.Right,
    ).length;

    // if this is a claim, must have no proofs to the right
    if (isClaim && proofsToRight > 0) {
      return false;
    }
    // if this is a transfer, there must be 1 proof to the right
    if (
      isClaim === false &&
      (proofsToRight !== 1 ||
        this.signatureSettings.settingsMerkleProofs[0].position !== MerklePosition.Right)
    ) {
      return false;
    }
    return true;
  }

  public isValidWalletOwnershipProof(owner: IAddressOwnershipProof): boolean {
    const isValidProof = MerkleTree.verify(
      owner.ownershipMerkleProofs,
      sha3(owner.identity),
      this.treeRoot,
    );
    if (!isValidProof) return false;

    const identityIndices = this.signature.signatureSettings.identityIndices;
    if (identityIndices && identityIndices.length) {
      const index = MerkleTree.getLeafIndex(owner.ownershipMerkleProofs);
      if (identityIndices.includes(index) === false) {
        return false;
      }
    }
    return true;
  }

  public isValidSignatureSettingsProof(): boolean {
    // verify the signature count location
    return MerkleTree.verify(
      this.signatureSettings.settingsMerkleProofs,
      AddressOwnersTree.createLeaf(
        this.signatureSettings.countRequired,
        this.signatureSettings.salt,
        this.signatureSettings.identityIndices,
      ),
      this.treeRoot,
    );
  }

  public isInvalid(messageHash: Buffer, isClaim: boolean): string {
    const isValidSignatureSettings =
      this.isValidSignatureSettingsProof() && this.isValidSignaturePosition(isClaim);
    if (!isValidSignatureSettings) {
      return 'Invalid RequiredSignatureSettings proof provided';
    }

    const signatures: Buffer[] = [];
    const seenIdentities = new Set<string>();
    for (const signer of this.signature.signers) {
      const identity = signer.identity;
      if (seenIdentities.has(identity)) {
        continue;
      }
      seenIdentities.add(identity);
      const isValidIdentity = this.isValidWalletOwnershipProof(signer);
      if (isValidIdentity === false) {
        return 'Invalid public key provided';
      }

      /**
       * verify signatures of each public key
       */
      const isMatch = Identity.verify(
        signer.identity,
        sha3(Buffer.concat([messageHash, ...signatures])),
        signer.signature,
      );
      if (isMatch === false) {
        return 'Invalid signature provided';
      }
      signatures.push(signer.signature);
    }

    // ensure signatures are unique
    if (seenIdentities.size < this.signatureSettings.countRequired) {
      return `Insufficient public key signatures provided ${seenIdentities.size} vs ${this.signatureSettings.countRequired} required`;
    }
    return null;
  }

  public static buildSignatureSettings(
    addressTree: MerkleTree,
    addressSettings: IAddressSettings,
    isClaim = false,
  ): IAddressSignature['signatureSettings'] {
    return {
      countRequired: isClaim
        ? addressSettings.claimSignatureSettings
        : addressSettings.transferSignatureSettings,
      settingsMerkleProofs: addressTree.getProofForIndex(isClaim ? -1 : -2), // notes are all transfers
      salt: isClaim ? addressSettings.claimSignatureSalt : addressSettings.transferSignatureSalt,
      identityIndices: Address.getIdentityIndices(addressSettings, isClaim),
    };
  }

  public static create(
    hash: Buffer,
    identities: Identity[],
    addressOwnersTree: MerkleTree,
    addressSettings: IAddressSettings,
    isClaim = false,
  ): IAddressSignature {
    const signatures: Buffer[] = [];
    return {
      signers: identities.map(identity => {
        const identityProof = AddressOwnersTree.getIdentityIsOwnerProof(
          addressOwnersTree,
          identity.bech32,
        );
        const ownerProof: IAddressOwnershipProof = {
          ownershipMerkleProofs: identityProof,
          identity: identity.bech32,
          signature: identity.sign(sha3(Buffer.concat([hash, ...signatures]))),
        };
        signatures.push(ownerProof.signature);
        return ownerProof;
      }),
      signatureSettings: AddressSignature.buildSignatureSettings(
        addressOwnersTree,
        addressSettings,
        isClaim,
      ),
    };
  }

  public static verify(
    address: string,
    signature: IAddressSignature,
    messageHash: Buffer,
    isClaim: boolean,
  ): string | null {
    const root = Address.decodeAddress(address);
    return new AddressSignature(root, signature).isInvalid(messageHash, isClaim);
  }
}
