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
  const sessionReplay = new SessionReplay(connectionToCoreApi);
  await sessionReplay.load({
    scriptEntrypoint,
  });
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

    const currentLabel =
      sessionReplay.startTab.currentTick?.label ??
      sessionReplay.startTab.currentTick?.eventType ??
      'Start';

    const input = `${sessionReplay.startTab.currentTickIndex} / ${sessionReplay.startTab.ticks.length}: ${currentLabel}`;

    const prompt = `Interactive commands: P=${
      sessionReplay.startTab.isPlaying ? 'pause' : 'play'
    }, LeftArrow=Back, RightArrow=Forward, C=Close\n\n${input}`;

    process.stdout.write(prompt);
  }

  async function close() {
    await sessionReplay.connection.disconnect();
    await sessionReplay.close();
    await Core.shutdown();
  }

  process.on('exit', () => close());

  process.stdin.on('keypress', async (chunk, key) => {
    if (key.name === 'c') {
      await close();
      process.exit(0);
    }

    if (key.name === 'p') {
      if (sessionReplay.startTab.isPlaying) {
        sessionReplay.startTab.pause();
      } else {
        await sessionReplay.startTab.play(() => render());
      }
    }
    if (key.name === 'right') {
      sessionReplay.startTab.pause();
      await sessionReplay.startTab.goForward();
    }
    if (key.name === 'left') {
      sessionReplay.startTab.pause();
      await sessionReplay.startTab.goBack();
    }
    render();
  });
  render();
})();
