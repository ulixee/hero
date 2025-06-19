import IAssignment from '@double-agent/collect-controller/interfaces/IAssignment';
export { IAssignment };
export default class AssignmentsClient {
    readonly userId: string;
    private readonly baseUrl;
    constructor(userId: string);
    downloadAssignmentProfiles(assignmentId: string, filesDir: string): Promise<void>;
    downloadAll(filesDir: string): Promise<void>;
    activate(assignmentId: string): Promise<IAssignment>;
    /**
     * Create and activate a single assignment
     */
    createSingleUserAgentIdAssignment(userAgentId: string, dataDir?: string): Promise<IAssignment>;
    start(params: {
        dataDir: string;
        userAgentsToTestPath: string;
    }): Promise<IAssignment[]>;
    finish(): Promise<void>;
    private get;
}
