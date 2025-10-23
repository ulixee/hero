import Collect from '@double-agent/collect';
export default class Server {
    private activeUsersById;
    private readonly collect;
    private readonly httpServer;
    private readonly httpServerPort;
    private readonly routeMetaByRegexp;
    private favicon;
    private readonly endpointsByRoute;
    constructor(collect: Collect, httpServerPort: number);
    start(): Promise<void>;
    close(): Promise<void>;
    private handleRequest;
    private sendFavicon;
    private createBasicAssignment;
    private createAssignments;
    private createUser;
    private activateAssignment;
    private downloadAssignmentProfiles;
    private downloadAll;
    private finishAssignments;
    private saveMetaFiles;
    private saveFile;
}
