import '@ulixee/commons/lib/SourceMapSupport';
import SessionReplay from '@ulixee/hero-core/lib/SessionReplay';
import { inspect } from 'util';
import * as Path from 'path';
import * as readline from 'readline';
import Core from '@ulixee/hero-core';
import DirectConnectionToCoreApi from '@ulixee/hero-core/connections/DirectConnectionToCoreApi';

inspect.defaultOptions.depth = null;

(async () => {
  if (process.argv.length <= 2) {
    console.log('Run this script with the path to the script you want to replay');
    process.exit(0);
  }
  let scriptEntrypoint = process.argv[2];
  if (!Path.isAbsolute(scriptEntrypoint)) {
    scriptEntrypoint = Path.resolve(process.cwd(), scriptEntrypoint);
  }
  const connectionToCoreApi = new DirectConnectionToCoreApi();

  const { session } = await connectionToCoreApi.run({
    api: 'Session.find',
    args: {
      scriptEntrypoint,
    },
  });

  const context = await SessionReplay.recreateBrowserContextForSession(session.id, true);

  const sessionReplay = new SessionReplay(session.id, connectionToCoreApi);
  const startTab = await sessionReplay.open(context);

  readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readline.emitKeypressEvents(process.stdin);
  process.stdin.setEncoding('utf8');
  if (process.stdin.isTTY) process.stdin.setRawMode(true);

  function render() {
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);

    const currentLabel = startTab.currentTick?.label ?? startTab.currentTick?.eventType ?? 'Start';

    const input = `${startTab.currentTickIndex} / ${startTab.ticks.length}: ${currentLabel}`;

    const prompt = `Interactive commands: P=${
      startTab.isPlaying ? 'pause' : 'play'
    }, LeftArrow=Back, RightArrow=Forward, C=Close\n\n${input}`;

    process.stdout.write(prompt);
  }

  async function close() {
    await sessionReplay.connection.disconnect();
    await sessionReplay.close(true);
    await Core.shutdown();
  }

  process.on('exit', () => close());

  process.stdin.on('keypress', async (chunk, key) => {
    if (key.name === 'c') {
      await close();
      process.exit(0);
    }

    if (key.name === 'p') {
      if (startTab.isPlaying) {
        startTab.pause();
      } else {
        await startTab.play(() => render());
      }
    }
    if (key.name === 'right') {
      startTab.pause();
      await startTab.goForward();
    }
    if (key.name === 'left') {
      startTab.pause();
      await startTab.goBack();
    }
    render();
  });
  render();
})();
