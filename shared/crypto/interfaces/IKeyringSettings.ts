export default interface IKeyringSettings {
  keyTypes: IKeyType[];
  transferSignatureSettings?: number; // default is all public keys
  transferSignatureSalt?: Buffer;
  claimSignatureSettings?: number; // default is only 1 key for claims
  claimSignatureSalt?: Buffer;
}

const UniversalKey = 'U';
const ClaimsKey = 'C';
const TransferKey = 'T';
type IKeyType = typeof UniversalKey | typeof ClaimsKey | typeof TransferKey;
export { UniversalKey, ClaimsKey, IKeyType, TransferKey };
