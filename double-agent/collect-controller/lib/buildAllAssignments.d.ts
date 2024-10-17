import IUserAgentToTest, { IUserAgentToTestPickType } from '@double-agent/config/interfaces/IUserAgentToTest';
import IAssignment from '../interfaces/IAssignment';
export default function buildAllAssignments(userAgentsToTest: IUserAgentToTest[]): Promise<IAssignment[]>;
export declare function createOverTimeSessionKey(pickType: IUserAgentToTestPickType, indexPos: number, userAgentId: string): string;
export declare function extractMetaFromOverTimeSessionKey(sessionKey: string): {
    pickType: IUserAgentToTestPickType;
    indexPos: number;
    userAgentId: string;
};
