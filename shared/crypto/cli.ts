import { Command } from 'commander';
import { APIError } from '@ulixee/commons/lib/errors';
import { assert } from '@ulixee/commons/lib/utils';
import { randomBytes } from 'crypto';
import Identity from '@ulixee/crypto/lib/Identity';
import * as Path from 'path';
import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';
import Address from './lib/Address';
import IAddressSettings, { ISignerType } from './interfaces/IAddressSettings';

const logError = (err: Error): void => {
  if (err instanceof APIError) {
    console.log(`IDENTITIES API ERROR: ${err.toString()}`); // eslint-disable-line no-console
  } else {
    console.log(`\nIDENTITIES ERROR: ${err.message}\n`); // eslint-disable-line no-console
  }
};

const { version } = require('./package.json');

export default function cliCommands(): Command {
  const cryptoCommands = new Command().version(version);

  cryptoCommands
    .command('address')
    .description('Create a new address.')
    .argument(
      '[signerPattern]',
      'The pattern of signing Identities you wish to create. Specify which actions each identity should be used for. T=Transfer, C=Claim, U=Universal. eg, TTC = 3 key ring with 2 transfer identities and 1 claim key',
      'U',
    )
    .argument('[filename]', 'Where do you want to save this Address?', 'UlixeeAddress.json')
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
    .action(async (signerPattern: string, filename: string, args): Promise<void> => {
      try {
        const { transferSignatures, claimSignatures, transferSalt, claimSalt } = args;
        const signersCount = signerPattern.length;
        assert(signerPattern.length <= 6, 'A max of 6 signing Identities is allowed in an Address.');
        assert(signerPattern.length > 0, 'You must specify at least one key');
        assert(
          signerPattern.match(/[TCU]+/i),
          'Valid signer options are T=Transfer, C=Claim, U=Universal',
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
          transferSignatures <= signersCount,
          'You cannot have more transfer signatures required than total identities',
        );
        assert(
          claimSignatures <= signersCount,
          'You cannot have more claim signatures required than total identities',
        );

        const signerTypes = [...signerPattern] as ISignerType[];
        const identities = await Promise.all(signerTypes.map(Identity.create));
        const addressSettings: IAddressSettings = {
          signerTypes,
          transferSignatureSettings: transferSignatures,
          transferSignatureSalt: transferSalt ? Buffer.from(transferSalt) : null,
          claimSignatureSettings: claimSignatures,
          claimSignatureSalt: claimSalt ? Buffer.from(claimSalt) : null,
        };

        const address = Address.createFromSigningIdentities(identities, addressSettings);

        if (filename.endsWith('.json')) {
          filename = filename.replace(Path.extname(filename), '');
        }
        const filepath = await address.save(true, Path.basename(filename), Path.dirname(filename));
        console.log('Wrote address: %s to %s', address.bech32, filepath); // eslint-disable-line no-console
        console.log(TypeSerializer.stringify(address.toJSON(), { format: true })); // eslint-disable-line no-console
      } catch (err) {
        logError(err);
      }
    });

  cryptoCommands
    .command('identity')
    .description(
      'Create an Identity (ed25519 key). It will be used to anonymously secure your network requests.',
    )
    .option('-p, --passphrase <phrase>', 'Save the private key with a passphrase (pkcs8 format).')
    .option(
      '-c, --passphrase-cipher <cipher>',
      'Encrypt the internal key with a cipher (pkcs8 format).',
      Identity.defaultPkcsCipher,
    )
    .option(
      '-f, --filename <path>',
      'Save this Identity to a filepath. If not specified, will be console logged.',
    )
    .action(async ({ path, passphrase, cipher }) => {
      const identity = await Identity.create();

      if (path) {
        await identity.save(path, { passphrase, cipher });
        const finalPath = await this.lockfile.save(path);
        console.log('Saved to %s', finalPath); // eslint-disable-line no-console
      } else {
        console.log(identity.export(passphrase, cipher)); // eslint-disable-line no-console
      }
    });

  return cryptoCommands;
}
