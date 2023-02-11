import '@ulixee/commons/lib/SourceMapSupport';
import TimetravelPlayer from '@ulixee/hero-timetravel/player/TimetravelPlayer';
import { inspect } from 'util';
import * as Path from 'path';
import * as readline from 'readline';
import Core from '@ulixee/hero-core';
import MirrorPage from '@ulixee/hero-timetravel/lib/MirrorPage';
import MirrorNetwork from '@ulixee/hero-timetravel/lib/MirrorNetwork';
import MirrorContext from '@ulixee/hero-timetravel/lib/MirrorContext';
import ConnectionToHeroApiClient from '@ulixee/hero-core/connections/ConnectionToHeroApiClient';
import ConnectionToHeroApiCore from '@ulixee/hero-core/connections/ConnectionToHeroApiCore';
import SessionDb from '@ulixee/hero-core/dbs/SessionDb';

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
  await Core.start();
  const bridge = ConnectionToHeroApiClient.createBridge();
  const connectionToCoreApi = new ConnectionToHeroApiCore(bridge.transportToCore);

  const { session } = await connectionToCoreApi.sendRequest({
    command: 'Session.find',
    args: [
      {
        scriptEntrypoint,
      },
    ],
  });

  const context = await MirrorContext.createFromSessionDb(session.id, true);
  const db = SessionDb.getCached(session.id);
  const network = await MirrorNetwork.createFromSessionDb(db);

  const player = TimetravelPlayer.create(
    session.id,
    {
      async getMirrorPage(): Promise<MirrorPage> {
        const mirrorPage = new MirrorPage(network, null, true);
        await mirrorPage.openInContext(context, session.id);
        return mirrorPage;
      },
    },
    null,
    connectionToCoreApi,
  );
  const startTab = await player.goto(0);

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
