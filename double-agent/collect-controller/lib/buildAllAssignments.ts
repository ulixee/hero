import IUserAgentToTest, {
  IUserAgentToTestPickType,
  UserAgentToTestPickType,
} from '@double-agent/config/interfaces/IUserAgentToTest';
import { createUserAgentIdFromIds } from '@double-agent/config';
import buildAssignment from './buildAssignment';
import IAssignment, { AssignmentType } from '../interfaces/IAssignment';

export default async function buildAllAssignments(
  userAgentsToTest: IUserAgentToTest[],
): Promise<IAssignment[]> {
  const assignments: IAssignment[] = [];

  for (const userAgentToTest of userAgentsToTest) {
    const userAgentString = userAgentToTest.string;
    const id = createUserAgentIdFromIds(
      userAgentToTest.operatingSystemId,
      userAgentToTest.browserId,
    );
    const type = AssignmentType.Individual;
    assignments.push(buildAssignment(id, assignments.length, id, type, userAgentString, null));
  }

  assignments.push(
    ...buildAssignmentsOverTime(
      userAgentsToTest,
      UserAgentToTestPickType.popular,
      assignments.length,
    ),
  );
  assignments.push(
    ...buildAssignmentsOverTime(
      userAgentsToTest,
      UserAgentToTestPickType.random,
      assignments.length,
    ),
  );

  return assignments;
}

// HELPERS //////////////////

function buildAssignmentsOverTime(
  userAgentsToTest: IUserAgentToTest[],
  pickType: IUserAgentToTestPickType,
  assignmentCount: number,
): IAssignment[] {
  const type = AssignmentType.OverTime;
  const assignments: IAssignment[] = [];
  const selUserAgents = userAgentsToTest.filter((x) => x.pickTypes.includes(pickType));
  if (!selUserAgents.length) return [];

  const sortedUserAgents = selUserAgents.sort((a: IUserAgentToTest, b: IUserAgentToTest) => {
    return a.usagePercent[pickType] - b.usagePercent[pickType];
  });
  const countByUserAgentId: { [userAgentId: string]: number } = {};

  while (assignments.length < 100) {
    let userAgentToTest: IUserAgentToTest;
    let userAgentString: string;
    let userAgentId: string;
    for (userAgentToTest of sortedUserAgents) {
      userAgentString = userAgentToTest.string;
      userAgentId = createUserAgentIdFromIds(
        userAgentToTest.operatingSystemId,
        userAgentToTest.browserId,
      );
      countByUserAgentId[userAgentId] ??= 0;
      const pctIncluded = (countByUserAgentId[userAgentId] / assignments.length) * 100;
      if (pctIncluded < userAgentToTest.usagePercent[pickType]) break;
    }
    countByUserAgentId[userAgentId] += 1;
    assignments.push(
      buildAssignment(
        createOverTimeSessionKey(pickType, assignments.length, userAgentId),
        assignmentCount + assignments.length,
        userAgentId,
        type,
        userAgentString,
        pickType,
        userAgentToTest.usagePercent[pickType],
      ),
    );
  }

  return assignments;
}

export function createOverTimeSessionKey(
  pickType: IUserAgentToTestPickType,
  indexPos: number,
  userAgentId: string,
): string {
  return `${pickType}-${indexPos.toString().padStart(2, '0')}:${userAgentId}`;
}

export function extractMetaFromOverTimeSessionKey(sessionKey: string): {
  pickType: IUserAgentToTestPickType;
  indexPos: number;
  userAgentId: string;
} {
  // this function is used in ScraperReport
  const [pickType, indexPos, userAgentId] = sessionKey.match(/^([a-z]+)-([0-9]+):(.+)$/).slice(1);
  return {
    pickType: pickType as IUserAgentToTestPickType,
    indexPos: Number(indexPos),
    userAgentId,
  };
}
