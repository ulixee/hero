import '@ulixee/commons/lib/SourceMapSupport';
import analyzeAssignmentResults from '@double-agent/runner/lib/analyzeAssignmentResults';
import * as Fs from 'fs';
import { getExternalDataPath } from '../paths';

const assignmentsDataDir = getExternalDataPath(`/3-assignments`);
const resultsDir = getExternalDataPath(`/4-assignment-results`);

Fs.rmdirSync(resultsDir, { recursive: true });
analyzeAssignmentResults(assignmentsDataDir, resultsDir).catch(console.log);
