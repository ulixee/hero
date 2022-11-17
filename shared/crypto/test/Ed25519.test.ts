import Ed25519 from '../lib/Ed25519';

test('can create and restore public ed25519 key bytes', async () => {
  const keys = await Ed25519.create();
  const publicKeyBytes = Ed25519.getPublicKeyBytes(keys.privateKey);
  expect(keys.publicKey).toEqual(Ed25519.createPublicKeyFromBytes(publicKeyBytes));
});

test('can create and restore private ed25519 key bytes', async () => {
  const keys = await Ed25519.create();
  const privateKeyBytes = Ed25519.getPrivateKeyBytes(keys.privateKey);
  const privateKeyString = keys.privateKey.export({ format: 'der', type: 'pkcs8' }).toString('hex');
  const recreatedPk = Ed25519.createPrivateKeyFromBytes(privateKeyBytes);
  expect(recreatedPk.export({ format: 'der', type: 'pkcs8' }).toString('hex')).toBe(
    privateKeyString,
  );
  expect(Ed25519.getPrivateKeyBytes(recreatedPk)).toEqual(privateKeyBytes);
});
