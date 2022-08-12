import Identity from '@ulixee/crypto/lib/Identity';
import Address from '../lib/Address';
import AddressSignature from '../lib/AddressSignature';
import { ClaimsSigner, UniversalSigner } from '../interfaces/IAddressSettings';

let address: Address;
let identity1: Identity;
let identity2: Identity;

beforeAll(async () => {
  [identity1, identity2] = await Promise.all([Identity.create(), Identity.create()]);
  address = Address.createFromSigningIdentities([identity1, identity2], {
    claimSignatureSettings: 1,
    transferSignatureSettings: 1,
    signerTypes: [UniversalSigner, ClaimsSigner],
  });
});

test('should validate the keys match the allowed keys', async () => {
  expect(address.bech32).toBeTruthy();
  expect(address.transferSigners).toHaveLength(1);
  expect(address.claimSigners).toHaveLength(2);
  const hash = Buffer.from('hash');
  jest.spyOn(address, 'verifyKeyType').mockImplementationOnce(() => null);
  const signature = address.sign(hash, [1]);

  expect(AddressSignature.verify(address.bech32, signature, hash, false)).toBe(
    'Invalid public key provided',
  );
});

test('should allow the proper keys if provided', async () => {
  const signature = address.sign(Buffer.from('hash'), [0]);

  expect(
    AddressSignature.verify(address.bech32, signature, Buffer.from('hash'), false),
  ).toBeNull();
});

test('should be able to save to a file and recreate', async () => {
  const filePath = await address.save();
  expect(filePath.endsWith(`${address.bech32}.json`)).toBe(true);

  const wallet2 = Address.readFromFile(address.bech32);

  expect(wallet2.ownersMerkleTree).toBeTruthy();
  expect(wallet2.transferSigners.map(x => x.publicKey.toString('hex'))).toEqual(
    address.transferSigners.map(x => x.publicKey.toString('hex')),
  );
  const signature = wallet2.sign(Buffer.from('claim'), [0], true);

  expect(Address.verify(wallet2.bech32, Buffer.from('claim'), signature, true)).toBe(true);
});
