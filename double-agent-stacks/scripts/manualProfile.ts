import '@ulixee/commons/lib/SourceMapSupport';
import AssignmentsClient from '@double-agent/runner/lib/AssignmentsClient';
import { getLocalDataPath } from '../paths';

async function manualProfile(): Promise<void> {
  const userId = process.argv[2] ?? 'manual';
  const assignmentsClient = new AssignmentsClient(userId);
  const assignment = await assignmentsClient.createSingleUserAgentIdAssignment(
    undefined,
    getLocalDataPath('/3-assignments'),
  );
  console.log('You need to navigate to these urls (or use the links to click through):');
  for (const [pluginId, pages] of Object.entries(assignment.pagesByPlugin)) {
    console.log('\n------------- PLUGIN: %s------------', pluginId);
    console.log(pages.map(x => x.url).join('\n'));
  }

  console.log(
    '\n\nFiles will download to: %s\n\n',
    getLocalDataPath(`/3-assignments/individual/${userId}`),
  );
}

manualProfile().catch(console.error);
