import { createReadStream, createWriteStream, promises as Fs } from 'fs';
import * as Path from 'path';
import Analyze from '@double-agent/analyze';
import { IResultFlag } from '@double-agent/analyze/lib/Plugin';
import { probesDataDir } from '@double-agent/config/paths';
import { UserAgentToTestPickType } from '@double-agent/config/interfaces/IUserAgentToTest';
import { createOverTimeSessionKey } from '@double-agent/collect-controller/lib/buildAllAssignments';
import { createGunzip } from 'zlib';

export default async function analyzeAssignmentResults(
  assignmentsDataDir: string,
  resultsDir: string,
): Promise<void> {
  const userAgentIds = await Fs.readdir(`${assignmentsDataDir}/individual`);
  const analyze = new Analyze(userAgentIds.length, probesDataDir);

  for (const userAgentId of userAgentIds) {
    const dir = `${assignmentsDataDir}/individual/${userAgentId}/raw-data`;
    const files = await Fs.readdir(dir);
    for (const compressed of files.filter(x => x.endsWith('.gz'))) {
      await new Promise(resolve =>
        createReadStream(Path.join(dir, compressed))
          .pipe(createGunzip())
          .pipe(createWriteStream(`${dir}/${compressed.replace('.gz', '')}`))
          .on('finish', resolve),
      );
    }
  }

  for (const userAgentId of userAgentIds) {
    const flags = analyze.addIndividual(`${assignmentsDataDir}/individual`, userAgentId);
    const saveFlagsToDir = Path.resolve(resultsDir, userAgentId);
    await saveFlagsToPluginFiles(saveFlagsToDir, flags);
  }

  for (const pickType of [UserAgentToTestPickType.popular, UserAgentToTestPickType.random]) {
    const sessionsDir = Path.resolve(assignmentsDataDir, `overtime-${pickType}`);
    const userAgentIdFlagsMapping = analyze.addOverTime(sessionsDir, pickType);
    let i = 0;
    for (const userAgentId of Object.keys(userAgentIdFlagsMapping)) {
      const flags = userAgentIdFlagsMapping[userAgentId];
      const sessionKey = createOverTimeSessionKey(pickType, i, userAgentId);
      const flagsDir = Path.resolve(sessionsDir, sessionKey, `flags`);
      await saveFlagsToPluginFiles(flagsDir, [flags]);
      i++;
    }
  }

  const testResults = analyze.generateTestResults();
  (testResults as any).__SCORING__ =
    'Scores are on scale of 0 (low) to 100 (high) on how "human" the traffic looks. 0 are fails.';
  (testResults as any).__NOTE__ =
    'The Total Scores are output of tests that are currently not active that test fingerprints "over time" for various agents. Ie, if you use Chrome 104 100 times, what common signatures are emitted.';

  const testResultsPath = Path.resolve(resultsDir, `testResults.json`);
  await Fs.writeFile(testResultsPath, JSON.stringify(testResults, null, 2));
}

async function saveFlagsToPluginFiles(saveToDir: string, flags: IResultFlag[]): Promise<void> {
  const flagsByPluginId: { [pluginId: string]: IResultFlag[] } = {};
  flags.forEach(flag => {
    flagsByPluginId[flag.pluginId] = flagsByPluginId[flag.pluginId] || [];
    flagsByPluginId[flag.pluginId].push(flag);
  });
  await Fs.mkdir(saveToDir, { recursive: true });

  for (const pluginId of Object.keys(flagsByPluginId)) {
    const filePath = Path.resolve(saveToDir, `${pluginId}.json`);
    await Fs.writeFile(filePath, JSON.stringify(flagsByPluginId[pluginId], null, 2));

    const signaturesFilePath = Path.resolve(saveToDir, `${pluginId}-signatures.json`);
    await Fs.writeFile(
      signaturesFilePath,
      JSON.stringify(
        flagsByPluginId[pluginId].map(x => x.checkSignature),
        null,
        2,
      ),
    );
  }
}
