import { IUserAgentToTestPickType } from '@double-agent/config/interfaces/IUserAgentToTest';
import IAssignment, { IAssignmentType } from '../interfaces/IAssignment';
export default function buildAssignment(id: string, num: number, userAgentId: string, type?: IAssignmentType, userAgentString?: string, pickType?: IUserAgentToTestPickType, usagePercent?: number): IAssignment;
