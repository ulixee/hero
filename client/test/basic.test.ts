import { Helpers } from '@ulixee/hero-testing';
import UlixeeConfig from '@ulixee/commons/config';
import UlixeeServerConfig from '@ulixee/commons/config/servers';
import * as VersionUtils from '@ulixee/commons/lib/VersionUtils';
import Hero from '../index';
import { scriptInstance } from '../lib/internal';
import ConnectionFactory from '../connections/ConnectionFactory';
import MockConnectionToCore from './_MockConnectionToCore';

const pkg = require('../package.json');

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

const defaultMockedPayload = payload => {
  if (payload.command === 'Core.createSession') {
    return {
      responseId: payload.messageId,
      data: { tabId: 'tab-id', sessionId: 'session-id' },
    };
  }
  return {
    responseId: payload.messageId,
    data: {},
  };
};

describe('basic Hero tests', () => {
  it('creates and closes a hero', async () => {
    const connectionToCore = new MockConnectionToCore(defaultMockedPayload);
    const hero = await new Hero({ connectionToCore });
    await hero.close();

    const outgoingCommands = connectionToCore.outgoingSpy.mock.calls;
    expect(outgoingCommands.map(c => c[0].command)).toMatchObject([
      'Core.connect',
      'Core.createSession',
      'Session.close',
    ]);
  });

  it('emits commandId events', async () => {
    const connectionToCore = new MockConnectionToCore(defaultMockedPayload);
    const hero = await new Hero({ connectionToCore });
    const events = [];

    void hero.on('command', (command, commandId, args) => {
      events.push({ command, commandId, args });
    });

    await hero.close();

    const outgoingCommands = connectionToCore.outgoingSpy.mock.calls;
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
    const connectionToCore = new MockConnectionToCore(defaultMockedPayload);
    const hero = await new Hero({ connectionToCore });
    await hero.close();

    const outgoingCommands = connectionToCore.outgoingSpy.mock.calls;

    // Core.connect doesn't run over a command queue, so never gets callsites
    expect(outgoingCommands.filter(c => c[0].callsite)).toHaveLength(2);
  });
});

describe('Connection tests', () => {
  jest.spyOn(UlixeeServerConfig.global, 'save').mockImplementation(() => Promise.resolve())

  it('connects to a configured server over a started server', async () => {
    UlixeeConfig.global.serverHost = 'localhost:8000';
    await UlixeeServerConfig.global.setVersionHost('1', 'localhost:8080');

    const connectionToCore = ConnectionFactory.createConnection({});
    expect(connectionToCore.transport.host).toBe('ws://localhost:8000');
  });

  it('connects to a started server if the version is compatible', async () => {
    UlixeeConfig.global.serverHost = null;
    const version = pkg.version;
    const next = VersionUtils.nextVersion(version);
    await UlixeeServerConfig.global.setVersionHost(next, 'localhost:8081');

    const connectionToCore = ConnectionFactory.createConnection({});
    expect(connectionToCore.transport.host).toBe('ws://localhost:8081');
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
