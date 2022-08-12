import Identity from '../lib/Identity';

test('can create an identity', async () => {
  await expect(Identity.create()).resolves.toBeTruthy();
});

test('can reload an identity', async () => {
  const identity = await Identity.create();
  const pem = identity.export();

  const identity2 = Identity.loadFromPem(pem);
  expect(identity2.publicKey).toEqual(identity.publicKey);
  expect(identity2.bech32).toEqual(identity.bech32);
  expect(identity2.publicKey).toHaveLength(32);
  expect(identity2.privateKey.type).toBe(identity.privateKey.type);
  expect(identity2.privateKey.asymmetricKeyType).toBe(identity.privateKey.asymmetricKeyType);
  expect(identity2.privateKey.asymmetricKeySize).toBe(identity.privateKey.asymmetricKeySize);
});

test('can create a passphrase protected private key', async () => {
  const identity = await Identity.create();
  const pem = identity.export('password1');

  expect(() => {
    Identity.loadFromPem(pem, { keyPassphrase: 'p' });
  }).toThrow();

  const identity2 = Identity.loadFromPem(pem, { keyPassphrase: 'password1' });
  expect(identity2.bech32).toEqual(identity.bech32);
});
