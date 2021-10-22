import '@ulixee/commons/lib/SourceMapSupport';
import TimetravelPlayer from '@ulixee/hero-timetravel/player/TimetravelPlayer';
import { inspect } from 'util';
import * as Path from 'path';
import * as readline from 'readline';
import Core from '@ulixee/hero-core';
import DirectConnectionToCoreApi from '@ulixee/hero-core/connections/DirectConnectionToCoreApi';
import MirrorContext from '@ulixee/hero-timetravel/lib/MirrorContext';

inspect.defaultOptions.depth = null;

(async () => {
  if (process.argv.length <= 2) {
    console.log('Run this script with the path to the script you want to load in Timetravel');
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

  const context = await MirrorContext.createFromSessionDb(session.id, true);

  const player = TimetravelPlayer.create(
    session.id,
    { browserContext: context },
    null,
    connectionToCoreApi,
  );
  const startTab = await player.goto(100);

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
    await player.connection.disconnect();
    await player.close();
    await context.close();
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
      const nextTick = startTab.nextTick;
      if (nextTick) await startTab.loadTick(nextTick);
    }
    if (key.name === 'left') {
      startTab.pause();
      const prevTick = startTab.previousTick;
      if (prevTick) await startTab.loadTick(prevTick);
    }
    render();
  });
  render();
})();
