import Keypair from '../lib/Keypair';

test('can create a keypair', async () => {
  await expect(Keypair.create()).resolves.toBeTruthy();
});

test('can reload a keypair', async () => {
  const keypair = await Keypair.create();
  const pem = keypair.export();

  const keypair2 = Keypair.loadFromPem(pem);
  expect(keypair2.publicKey).toEqual(keypair.publicKey);
  expect(keypair2.publicKey).toHaveLength(32);
  expect(keypair2.privateKey.type).toBe(keypair.privateKey.type);
  expect(keypair2.privateKey.asymmetricKeyType).toBe(keypair.privateKey.asymmetricKeyType);
  expect(keypair2.privateKey.asymmetricKeySize).toBe(keypair.privateKey.asymmetricKeySize);
});

test('can create a passphrase protected private key', async () => {
  const keypair = await Keypair.create();
  const pem = keypair.export('password1');

  expect(() => {
    Keypair.loadFromPem(pem, { keyPassphrase: 'p' });
  }).toThrow();

  const keypair2 = Keypair.loadFromPem(pem, { keyPassphrase: 'password1' });
  expect(keypair2.publicKey).toEqual(keypair.publicKey);
});
