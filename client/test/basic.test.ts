import { Helpers } from '@ulixee/hero-testing';
import UlixeeHostsConfig from '@ulixee/commons/config/hosts';
import * as VersionUtils from '@ulixee/commons/lib/VersionUtils';
import Callsite from '@ulixee/commons/lib/Callsite';
import Hero from '../index';
import ConnectionFactory from '../connections/ConnectionFactory';
import MockConnectionToCore from './_MockConnectionToCore';
import CallsiteLocator from '../lib/CallsiteLocator';

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
    const hero = new Hero({ connectionToCore });
    await hero.connect();
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
    const hero = new Hero({ connectionToCore });
    await hero.connect();
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
    const hero = new Hero({ connectionToCore });
    await hero.connect();
    await hero.close();

    const outgoingCommands = connectionToCore.outgoingSpy.mock.calls;

    // Core.connect doesn't run over a command queue, so never gets callsites
    expect(outgoingCommands.filter(c => c[0].callsite)).toHaveLength(2);
  });
});

describe('Connection tests', () => {
  jest.spyOn<any, any>(UlixeeHostsConfig.global, 'save').mockImplementation(() => null);
  UlixeeHostsConfig.global.setVersionHost('1', 'localhost:8080');

  it('connects to a started Cloud if the version is compatible', async () => {
    const version = pkg.version;
    const next = VersionUtils.nextVersion(version);
    await UlixeeHostsConfig.global.setVersionHost(next, 'localhost:8081');

    const connectionToCore = ConnectionFactory.createConnection({});
    expect(connectionToCore.transport.host).toContain('ws://localhost:8081');
  });

  it('should inform a user if a Cloud needs to be started', async () => {
    const version = pkg.version;
    const next = VersionUtils.nextVersion(version);
    await UlixeeHostsConfig.global.setVersionHost(next, null);
    ConnectionFactory.hasLocalCloudPackage = true;
    expect(() => ConnectionFactory.createConnection({})).toThrow(
      'Ulixee Cloud is not started',
    );
  });

  it('should inform a user if a Cloud needs to be installed', async () => {
    const version = pkg.version;
    const next = VersionUtils.nextVersion(version);
    await UlixeeHostsConfig.global.setVersionHost(next, null);
    ConnectionFactory.hasLocalCloudPackage = false;
    expect(() => ConnectionFactory.createConnection({})).toThrow(
      'compatible Hero Core was not found',
    );
  });
});

describe('CallsiteLocator tests', () => {
  it('should be able to properly get a script location', () => {
    const scriptInstance = new CallsiteLocator(Callsite.getEntrypoint());
    expect(scriptInstance.getCurrent()).toHaveLength(1);

    (function testNested() {
      expect(scriptInstance.getCurrent()).toHaveLength(2);
    })();
  });
});
