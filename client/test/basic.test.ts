import ICoreRequestPayload from '@ulixee/hero-interfaces/ICoreRequestPayload';
import ICoreResponsePayload from '@ulixee/hero-interfaces/ICoreResponsePayload';
import { Helpers } from '@ulixee/hero-testing';
import Hero, { ConnectionToRemoteCoreServer } from '../index';
import ConnectionToCore from '../connections/ConnectionToCore';
import { scriptInstance } from '../lib/internal';
import UlixeeConfig from '@ulixee/commons/config';
import UlixeeServerConfig from '@ulixee/commons/config/servers';
import ConnectionFactory from '../connections/ConnectionFactory';
import * as VersionUtils from '@ulixee/commons/lib/VersionUtils';

const pkg = require('../package.json');

afterAll(Helpers.afterAll);

jest
  .spyOn(ConnectionToRemoteCoreServer.prototype, 'connect')
  .mockImplementation(() => Promise.resolve(null));
class MockedConnectionToCore extends ConnectionToCore {
  public outgoing = jest.fn(async (payload: ICoreRequestPayload): Promise<ICoreResponsePayload> => {
    const { command } = payload;
    if (command === 'Core.createSession') {
      return {
        data: { tabId: 'tab-id', sessionId: 'session-id' },
      };
    }
  });

  async internalSendRequest(payload: ICoreRequestPayload): Promise<void> {
    const response = await this.outgoing(payload);
    this.onMessage({
      responseId: payload.messageId,
      data: response?.data ?? {},
      ...(response ?? {}),
    });
  }

  protected createConnection = () => Promise.resolve(null);
  protected destroyConnection = () => Promise.resolve(null);
}

describe('basic Hero tests', () => {
  it('creates and closes a hero', async () => {
    const connectionToCore = new MockedConnectionToCore();
    const hero = await new Hero({ connectionToCore });
    await hero.close();

    const outgoingCommands = connectionToCore.outgoing.mock.calls;
    expect(outgoingCommands.map(c => c[0].command)).toMatchObject([
      'Core.connect',
      'Core.createSession',
      'Session.close',
    ]);
  });

  it('emits commandId events', async () => {
    const connectionToCore = new MockedConnectionToCore();
    const hero = await new Hero({ connectionToCore });
    const events = [];

    void hero.on('command', (command, commandId, args) => {
      events.push({ command, commandId, args });
    });

    await hero.close();

    const outgoingCommands = connectionToCore.outgoing.mock.calls;
    expect(outgoingCommands.map(c => c[0].command)).toMatchObject([
      'Core.connect',
      'Core.createSession',
      'Session.close',
    ]);

    expect(events).toMatchObject([
      {
        command: 'Session.close',
        commandId: 1,
        args: [false],
      },
    ]);
  });

  it('includes callsites for commands', async () => {
    const connectionToCore = new MockedConnectionToCore();
    const hero = await new Hero({ connectionToCore });
    await hero.close();

    const outgoingCommands = connectionToCore.outgoing.mock.calls;

    // Core.connect doesn't run over a command queue, so never gets callsites
    expect(outgoingCommands.filter(c => c[0].callsite)).toHaveLength(2);
  });
});

describe('Connection tests', function () {
  it('connects to a configured server over a started server', async () => {
    UlixeeConfig.global.serverHost = 'localhost:8000';
    await UlixeeServerConfig.global.setVersionHost('1', 'localhost:8080');

    const connectionToCore = ConnectionFactory.createConnection({});
    await expect(connectionToCore.hostOrError).resolves.toBe('ws://localhost:8000');
  });
  it('connects to a started server if the version is compatible', async () => {
    UlixeeConfig.global.serverHost = null;
    const version = pkg.version;
    const next = VersionUtils.nextVersion(version);
    await UlixeeServerConfig.global.setVersionHost(next, 'localhost:8081');
    const connectionToCore = ConnectionFactory.createConnection({});
    await expect(connectionToCore.hostOrError).resolves.toBe('ws://localhost:8081');
  });
  it('should inform a user if a server needs to be started', async () => {
    const version = pkg.version;
    const next = VersionUtils.nextVersion(version);
    await UlixeeServerConfig.global.setVersionHost(next, null);
    ConnectionFactory.hasLocalServerPackage = true;
    expect(() => ConnectionFactory.createConnection({})).toThrowError(
      'Ulixee Server is not started',
    );
  });
  it('should inform a user if a server needs to be installed', async () => {
    const version = pkg.version;
    const next = VersionUtils.nextVersion(version);
    await UlixeeServerConfig.global.setVersionHost(next, null);
    ConnectionFactory.hasLocalServerPackage = false;
    expect(() => ConnectionFactory.createConnection({})).toThrowError(
      'compatible Ulixee Server was not found',
    );
  });
});

describe('ScriptInstance tests', () => {
  it('should be able to properly get a script location', () => {
    expect(scriptInstance.getScriptCallsite()).toHaveLength(1);

    (function testNested() {
      expect(scriptInstance.getScriptCallsite()).toHaveLength(2);
    })();
  });
});
