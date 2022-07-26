import { Command } from 'commander';
import { APIError } from '@ulixee/commons/lib/errors';
import { assert } from '@ulixee/commons/lib/utils';
import { randomBytes } from 'crypto';
import Keypair from '@ulixee/crypto/lib/Keypair';
import * as Path from 'path';
import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';
import Keyring from './lib/Keyring';
import IKeyringSettings, { IKeyType } from './interfaces/IKeyringSettings';

const logError = (err: Error): void => {
  if (err instanceof APIError) {
    console.log(`KEYS API ERROR: ${err.toString()}`); // eslint-disable-line no-console
  } else {
    console.log(`\nKEYS ERROR: ${err.message}\n`); // eslint-disable-line no-console
  }
};

const { version } = require('./package.json');

export default function cliCommands(): Command {
  const cryptoCommands = new Command().version(version);

  cryptoCommands
    .command('keyring')
    .description('Create a new Wallet keyring (multi-capability + multisig keys).')
    .argument(
      '[keyPattern]',
      'The key pattern you wish to create. Specify which actions each key in your Keyring should be used for. T=Transfer, C=Claim, U=Universal. eg, TTC = 3 key ring with 2 transfer keys and 1 claim key',
      'U',
    )
    .argument('[filename]', 'Where do you want to save this Keyring?', 'UlixeeKeyring.json')
    .option(
      '-t, --transfer-signatures <count>',
      'How many signatures should be required for transfers?',
      parseInt,
      1,
    )
    .option(
      '-s, --transfer-salt <salt>',
      'Add salt (noise) to your transfer signatures',
      randomBytes(32).toString('base64'),
    )
    .option(
      '-c, --claim-signatures <count>',
      'How many signatures should be required for claims (coinage claims, voting)?',
      parseInt,
      1,
    )
    .option(
      '-d, --claim-salt <salt>',
      'Add salt (noise) to your claims signatures',
      randomBytes(32).toString('base64'),
    )
    .action(async (keyPattern: string, filename: string, args): Promise<void> => {
      try {
        const { transferSignatures, claimSignatures, transferSalt, claimSalt } = args;
        const keys = keyPattern.length;
        assert(keyPattern.length <= 6, 'A max of 6 keys is allowed in a keyring.');
        assert(keyPattern.length > 0, 'You must specify at least one key');
        assert(
          keyPattern.match(/[TCU]+/i),
          'Valid key options are T=Transfer, C=Claim, U=Universal',
        );
        assert(
          transferSignatures > 0,
          'You must require at least one transfer signature (-t, --transfer-signatures).',
        );
        assert(
          claimSignatures > 0,
          'You must require at least one claim signature  (-c, --claim-signatures)',
        );
        assert(
          transferSignatures <= keys,
          'You cannot have more transfer signatures required than total keys',
        );
        assert(
          claimSignatures <= keys,
          'You cannot have more claim signatures required than total keys',
        );

        const keyTypes = [...keyPattern] as IKeyType[];
        const keypairs = await Promise.all(keyTypes.map(Keypair.create));
        const keyringSettings: IKeyringSettings = {
          keyTypes,
          transferSignatureSettings: transferSignatures,
          transferSignatureSalt: transferSalt ? Buffer.from(transferSalt) : null,
          claimSignatureSettings: claimSignatures,
          claimSignatureSalt: claimSalt ? Buffer.from(claimSalt) : null,
        };

        const keyring = Keyring.createFromKeypairs(keypairs, keyringSettings);

        if (filename.endsWith('.json')) {
          filename = filename.replace(Path.extname(filename), '');
        }
        const filepath = await keyring.save(true, Path.basename(filename), Path.dirname(filename));
        console.log('Wrote address: %s to %s', keyring.address, filepath); // eslint-disable-line no-console
        console.log(TypeSerializer.stringify(keyring.toJSON(), { format: true })); // eslint-disable-line no-console
      } catch (err) {
        logError(err);
      }
    });

  cryptoCommands
    .command('key')
    .description(
      'Create a Network key (ed25519 key). It will be used to anonymously secure your requests.',
    )
    .option('-p, --passphrase <phrase>', 'Save this key with a passphrase (pkcs8 format).')
    .option(
      '-c, --passphrase-cipher <cipher>',
      'Encrypt the key with a cipher (pkcs8 format).',
      Keypair.defaultPkcsCipher,
    )
    .option(
      '-f, --filename <path>',
      'Save this keypair to a filepath. If not specified, will be console logged.',
    )
    .action(async ({ path, passphrase, cipher }) => {
      const keypair = await Keypair.create();

      if (path) {
        await keypair.save(path, { passphrase, cipher });
        const finalPath = await this.lockfile.save(path);
        console.log('Saved to %s', finalPath); // eslint-disable-line no-console
      } else {
        console.log(keypair.export(passphrase, cipher)); // eslint-disable-line no-console
      }
    });

  return cryptoCommands;
}
