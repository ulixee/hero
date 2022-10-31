import ISessionPage from '@double-agent/collect/interfaces/ISessionPage';
import { IUserAgentToTestPickType } from '@double-agent/config/interfaces/IUserAgentToTest';
import { IUserAgentMeta } from '@unblocked-web/real-user-agents';

export default interface IAssignment {
  id: string;
  num: number;
  type: IAssignmentType;
  userAgentId: string;
  userAgentString: string;
  browserMeta: IUserAgentMeta;
  pickType: IUserAgentToTestPickType;
  usagePercent: number;
  pagesByPlugin?: { [pluginId: string]: ISessionPage[] };
  sessionId?: string;
  dataDir?: string;
}

export enum AssignmentType {
  Individual = 'Individual',
  OverTime = 'OverTime',
}

export type IAssignmentType = keyof typeof AssignmentType;
