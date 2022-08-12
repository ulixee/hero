export default interface IAddressSettings {
  signerTypes: ISignerType[];
  transferSignatureSettings?: number; // default is all public keys
  transferSignatureSalt?: Buffer;
  claimSignatureSettings?: number; // default is only 1 key for claims
  claimSignatureSalt?: Buffer;
}

const UniversalSigner = 'U';
const ClaimsSigner = 'C';
const TransferSigner = 'T';
type ISignerType = typeof UniversalSigner | typeof ClaimsSigner | typeof TransferSigner;
export { UniversalSigner, ClaimsSigner, ISignerType, TransferSigner };
