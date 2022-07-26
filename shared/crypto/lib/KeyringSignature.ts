import { IWalletOwnershipProof, IWalletSignature } from '@ulixee/specification';
import Keypair from '@ulixee/crypto/lib/Keypair';
import MerkleTree from '@ulixee/crypto/lib/MerkleTree';
import { sha3 } from '@ulixee/commons/lib/hashUtils';
import { MerklePosition } from '@ulixee/specification/types/IMerkleProof';
import IKeyringSettings from '../interfaces/IKeyringSettings';
import KeyringTree from './KeyringTree';
import Keyring from './Keyring';

export default class KeyringSignature {
  public get signatureSettings(): IWalletSignature['signatureSettings'] {
    return this.signature.signatureSettings;
  }

  constructor(readonly treeRoot: Buffer, readonly signature: IWalletSignature) {}

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

  public isValidPublicKeyProof(owner: IWalletOwnershipProof): boolean {
    const isValidProof = MerkleTree.verify(
      owner.ownershipMerkleProofs,
      sha3(owner.publicKey),
      this.treeRoot,
    );
    if (!isValidProof) return false;

    const publicKeyIndices = this.signature.signatureSettings.publicKeyIndices;
    if (publicKeyIndices && publicKeyIndices.length) {
      const index = MerkleTree.getLeafIndex(owner.ownershipMerkleProofs);
      if (publicKeyIndices.includes(index) === false) {
        return false;
      }
    }
    return true;
  }

  public isValidSignatureSettingsProof(): boolean {
    // verify the signature count location
    return MerkleTree.verify(
      this.signatureSettings.settingsMerkleProofs,
      KeyringTree.createLeaf(
        this.signatureSettings.countRequired,
        this.signatureSettings.salt,
        this.signatureSettings.publicKeyIndices,
      ),
      this.treeRoot,
    );
  }

  public isInvalid(messageHash: Buffer, isClaim: boolean): string {
    const isValidSignatureSettings =
      this.isValidSignatureSettingsProof() && this.isValidSignaturePosition(isClaim);
    if (!isValidSignatureSettings) {
      return 'Invalid signature required proof provided';
    }

    const signatures: Buffer[] = [];
    const seenPublicKeys = new Set<string>();
    for (const signer of this.signature.signers) {
      const publicKey = signer.publicKey.toString('hex');
      if (seenPublicKeys.has(publicKey)) {
        continue;
      }
      seenPublicKeys.add(publicKey);
      const isValidPublicKey = this.isValidPublicKeyProof(signer);
      if (isValidPublicKey === false) {
        return 'Invalid public key provided';
      }

      /**
       * verify signatures of each public key
       */
      const isMatch = Keypair.verify(
        signer.publicKey,
        sha3(Buffer.concat([messageHash, ...signatures])),
        signer.signature,
      );
      if (isMatch === false) {
        return 'Invalid signature provided';
      }
      signatures.push(signer.signature);
    }

    // ensure signatures are unique
    if (seenPublicKeys.size < this.signatureSettings.countRequired) {
      return `Insufficient public key signatures provided ${seenPublicKeys.size} vs ${this.signatureSettings.countRequired} required`;
    }
    return null;
  }

  public static buildSignatureSettings(
    addressTree: MerkleTree,
    keyringSettings: IKeyringSettings,
    isClaim = false,
  ): IWalletSignature['signatureSettings'] {
    return {
      countRequired: isClaim
        ? keyringSettings.claimSignatureSettings
        : keyringSettings.transferSignatureSettings,
      settingsMerkleProofs: addressTree.getProofForIndex(isClaim ? -1 : -2), // notes are all transfers
      salt: isClaim ? keyringSettings.claimSignatureSalt : keyringSettings.transferSignatureSalt,
      publicKeyIndices: Keyring.getKeyIndices(keyringSettings, isClaim),
    };
  }

  public static create(
    hash: Buffer,
    keypairs: Keypair[],
    addressTree: MerkleTree,
    keyringSettings: IKeyringSettings,
    isClaim = false,
  ): IWalletSignature {
    const signatures: Buffer[] = [];
    return {
      signers: keypairs.map(key => {
        const publicKeyProof = KeyringTree.getPublicKeyProof(addressTree, key.publicKey);
        const ownerProof: IWalletOwnershipProof = {
          ownershipMerkleProofs: publicKeyProof,
          publicKey: key.publicKey,
          signature: key.sign(sha3(Buffer.concat([hash, ...signatures]))),
        };
        signatures.push(ownerProof.signature);
        return ownerProof;
      }),
      signatureSettings: KeyringSignature.buildSignatureSettings(
        addressTree,
        keyringSettings,
        isClaim,
      ),
    };
  }

  public static verify(
    address: string,
    signature: IWalletSignature,
    messageHash: Buffer,
    isClaim: boolean,
  ): string | null {
    const root = Keyring.decodeAddress(address);
    return new KeyringSignature(root, signature).isInvalid(messageHash, isClaim);
  }
}
