import Keypair from '@ulixee/crypto/lib/Keypair';
import Keyring from '../lib/Keyring';
import KeyringSignature from '../lib/KeyringSignature';
import { ClaimsKey, UniversalKey } from '../interfaces/IKeyringSettings';

let address: Keyring;
let keypair1: Keypair;
let keypair2: Keypair;

beforeAll(async () => {
  [keypair1, keypair2] = await Promise.all([Keypair.create(), Keypair.create()]);
  address = Keyring.createFromKeypairs([keypair1, keypair2], {
    claimSignatureSettings: 1,
    transferSignatureSettings: 1,
    keyTypes: [UniversalKey, ClaimsKey],
  });
});

test('should validate the keys match the allowed keys', async () => {
  expect(address.address).toBeTruthy();
  expect(address.transferKeys).toHaveLength(1);
  expect(address.claimKeys).toHaveLength(2);
  const hash = Buffer.from('hash');
  jest.spyOn(address, 'verifyKeyType').mockImplementationOnce(() => null);
  const signature = address.sign(hash, [1]);

  expect(KeyringSignature.verify(address.address, signature, hash, false)).toBe(
    'Invalid public key provided',
  );
});

test('should allow the proper keys if provided', async () => {
  const signature = address.sign(Buffer.from('hash'), [0]);

  expect(
    KeyringSignature.verify(address.address, signature, Buffer.from('hash'), false),
  ).toBeNull();
});

test('should be able to save to a file and recreate', async () => {
  const filePath = await address.save();
  expect(filePath.endsWith(`${address.address}.json`)).toBe(true);

  const wallet2 = Keyring.readFromFile(address.address);

  expect(wallet2.keyringMerkleTree).toBeTruthy();
  expect(wallet2.transferKeys.map(x => x.publicKey.toString('hex'))).toEqual(
    address.transferKeys.map(x => x.publicKey.toString('hex')),
  );
  const signature = wallet2.sign(Buffer.from('claim'), [0], true);

  expect(Keyring.verify(wallet2.address, Buffer.from('claim'), signature, true)).toBe(true);
});
