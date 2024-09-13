import * as Path from 'path';
import AssignmentsClient, { IAssignment } from './AssignmentsClient';

export default async function saveAssignmentToProfileDir(
  assignment: IAssignment,
  baseDir: string,
): Promise<string> {
  const userId = assignment.id;

  const filesDir = Path.join(baseDir, userId);
  await new AssignmentsClient(userId).downloadAssignmentProfiles(assignment.id, filesDir);

  return filesDir;
}
