"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const http = require("http");
const Tar = require("tar");
const Path = require("path");
const path_to_regexp_1 = require("path-to-regexp");
const stream_1 = require("stream");
const url = require("url");
const zlib_1 = require("zlib");
const IAssignment_1 = require("../interfaces/IAssignment");
const buildAllAssignments_1 = require("./buildAllAssignments");
const buildAssignment_1 = require("./buildAssignment");
const DOWNLOAD = 'download';
const downloadDir = '/tmp/double-agent-download-data';
const MB = 1028 * 1028;
if ((0, fs_1.existsSync)(downloadDir))
    (0, fs_1.rmSync)(downloadDir, { recursive: true });
class Server {
    constructor(collect, httpServerPort) {
        this.activeUsersById = {};
        this.routeMetaByRegexp = new Map();
        this.endpointsByRoute = {
            '/': this.createBasicAssignment.bind(this),
            '/create': this.createAssignments.bind(this),
            '/activate/:assignmentId': this.activateAssignment.bind(this),
            '/download': this.downloadAll.bind(this),
            '/download/:assignmentId': this.downloadAssignmentProfiles.bind(this),
            '/finish': this.finishAssignments.bind(this),
            '/favicon.ico': this.sendFavicon.bind(this),
        };
        this.collect = collect;
        this.httpServerPort = httpServerPort;
        this.httpServer = new http.Server(this.handleRequest.bind(this));
        Object.keys(this.endpointsByRoute).forEach(route => {
            const keys = [];
            const regexp = (0, path_to_regexp_1.pathToRegexp)(route, keys);
            this.routeMetaByRegexp.set(regexp, { route, keys });
        });
    }
    start() {
        return new Promise(resolve => {
            this.httpServer.listen(this.httpServerPort, resolve).on('error', err => console.log(err));
        });
    }
    async close() {
        this.httpServer.close();
        await this.collect.shutdown();
    }
    async handleRequest(req, res) {
        const requestUrl = url.parse(req.url, true);
        console.log('Assignment %s', `${req.headers.host}${req.url}`);
        let endpoint;
        const params = {};
        // pull from url query string
        Object.entries(requestUrl.query).forEach(([key, value]) => {
            params[key] = value;
        });
        // match endpoint and pull from url parameters
        for (const [regexp, meta] of this.routeMetaByRegexp.entries()) {
            const matches = requestUrl.pathname.match(regexp);
            if (matches) {
                endpoint = this.endpointsByRoute[meta.route];
                meta.keys.forEach((key, index) => {
                    params[key.name] = matches[index + 1];
                });
                break;
            }
        }
        if (!endpoint) {
            return sendJson(res, { message: 'Not Found' }, 404);
        }
        await endpoint(req, res, params);
    }
    async sendFavicon(_, res) {
        this.favicon ??= await fs_1.promises.readFile(`${__dirname}/../public/favicon.ico`);
        res.writeHead(200, { 'Content-Type': 'image/x-icon' });
        res.end(this.favicon);
    }
    async createBasicAssignment(_, res, params) {
        const { userId, dataDir } = params;
        if (!userId)
            return sendJson(res, { message: 'Please provide a userId header or query param' }, 500);
        if (!this.activeUsersById[userId]) {
            this.activeUsersById[userId] = {
                id: userId,
                dataDir: dataDir || DOWNLOAD,
                assignmentsById: {},
                isBasic: true,
            };
        }
        const activeScraper = this.activeUsersById[userId];
        for (const assignmentId of Object.keys(activeScraper.assignmentsById)) {
            const assignment = activeScraper.assignmentsById[assignmentId];
            const session = this.collect.getSession(assignment.sessionId);
            await this.collect.deleteSession(session);
            delete activeScraper.assignmentsById[assignmentId];
        }
        const assignment = (0, buildAssignment_1.default)(userId, 0, params.userAgentId);
        activeScraper.assignmentsById = { [assignment.id]: assignment };
        params.assignmentId = assignment.id.toString();
        await this.activateAssignment(_, res, params);
    }
    async createAssignments(_, res, params) {
        console.log('CREATE ASSIGNMENT');
        const { userId, dataDir } = params;
        if (!userId) {
            return sendJson(res, { message: 'Please provide a userId header or query param' }, 500);
        }
        if (!params.userAgentsToTestPath) {
            return sendJson(res, { message: 'Please provide a userAgentsToTestPath query param' }, 500);
        }
        const userAgentsToTestData = await fs_1.promises.readFile(params.userAgentsToTestPath, 'utf8');
        const userAgentsToTest = JSON.parse(userAgentsToTestData);
        this.activeUsersById[userId] = await this.createUser(userId, dataDir, userAgentsToTest);
        const assignments = Object.values(this.activeUsersById[userId].assignmentsById).map(assignment => {
            return { ...assignment, pagesByPlugin: undefined };
        });
        sendJson(res, { assignments });
    }
    async createUser(id, dataDir, userAgentsToTest) {
        const assignments = await (0, buildAllAssignments_1.default)(userAgentsToTest);
        const assignmentsById = {};
        for (const assignment of assignments) {
            assignmentsById[assignment.id] = assignment;
        }
        return {
            id,
            dataDir: dataDir || DOWNLOAD,
            assignmentsById,
        };
    }
    async activateAssignment(_, res, params) {
        const { userId, assignmentId } = params;
        if (!userId) {
            return sendJson(res, { message: 'Please provide a userId header or query param' }, 500);
        }
        if (!assignmentId) {
            return sendJson(res, { message: 'Please provide a assignmentId header or query param' }, 500);
        }
        const activeScraper = this.activeUsersById[userId];
        const assignmentsById = activeScraper?.assignmentsById;
        const assignment = assignmentsById ? assignmentsById[assignmentId] : null;
        if (!assignment)
            return sendJson(res, { message: 'Assignment not found' }, 500);
        if (assignment.sessionId)
            return sendJson(res, { message: 'Assignment already activated' }, 500);
        const session = await this.collect.createSession(assignment.type, assignment.userAgentId, assignment.userAgentString);
        assignment.sessionId = session.id;
        assignment.pagesByPlugin = session.generatePages();
        if (activeScraper.dataDir) {
            session.onSavePluginProfile = (plugin, data, filenameSuffix) => {
                const profilesDir = extractAssignmentProfilesDir(activeScraper, assignment);
                const filename = `${plugin.id}${filenameSuffix ? `--${filenameSuffix}` : ''}`;
                void this.saveFile(profilesDir, `${filename}.json`, data);
            };
        }
        const dataDir = extractAssignmentDir(activeScraper, assignment);
        sendJson(res, { assignment: { dataDir, ...assignment } });
    }
    async downloadAssignmentProfiles(_, res, params) {
        const { userId, assignmentId } = params;
        if (!userId)
            return sendJson(res, { message: 'Please provide a userId header or query param' }, 500);
        if (!assignmentId)
            return sendJson(res, { message: 'Please provide a assignmentId header or query param' }, 500);
        const activeScraper = this.activeUsersById[userId];
        const assignmentsById = activeScraper?.assignmentsById;
        const assignment = assignmentsById ? assignmentsById[assignmentId] : null;
        if (!assignment)
            return sendJson(res, { message: 'Assignment not found' }, 500);
        await this.saveMetaFiles(activeScraper, assignment);
        const profilesDir = extractAssignmentProfilesDir(activeScraper, assignment);
        await pipeDirToStream(profilesDir, res);
        const session = this.collect.getSession(assignment.sessionId);
        await this.collect.deleteSession(session);
        delete this.activeUsersById[userId];
    }
    async downloadAll(_, res, params) {
        const { userId } = params;
        if (!userId)
            return sendJson(res, { message: 'Please provide a userId query param' }, 500);
        const activeScraper = this.activeUsersById[userId];
        for (const assignmentId of Object.keys(activeScraper.assignmentsById)) {
            const assignment = activeScraper.assignmentsById[assignmentId];
            this.saveMetaFiles(activeScraper, assignment);
        }
        const profilesDir = extractBaseDir(activeScraper);
        await pipeDirToStream(profilesDir, res).catch(console.error);
    }
    async finishAssignments(_, res, params) {
        const { userId } = params;
        if (!userId)
            return sendJson(res, { message: 'Please provide a userId header or query param' }, 500);
        const activeScraper = this.activeUsersById[userId];
        const assignments = activeScraper ? Object.values(activeScraper.assignmentsById) : [];
        if (!activeScraper) {
            return sendJson(res, { message: `No assignments were found for ${userId}` }, 500);
        }
        console.log('Finish assignments %s', `${userId}`);
        for (const assignment of assignments) {
            const session = this.collect.getSession(assignment.sessionId);
            void this.saveMetaFiles(activeScraper, assignment);
            await this.collect.deleteSession(session);
        }
        delete this.activeUsersById[userId];
        if (activeScraper.dataDir === DOWNLOAD) {
            const dataDir = extractBaseDir(activeScraper);
            await fs_1.promises.rm(dataDir, { recursive: true });
        }
        sendJson(res, { finished: true });
    }
    saveMetaFiles(activeScraper, assignment) {
        const baseDirPath = extractAssignmentDir(activeScraper, assignment);
        void this.saveFile(baseDirPath, 'assignment.json', assignment);
        // TODO: We need to save session.json but without the DOM export (and other unneeded data) -- too large
        // this.saveFile(baseDirPath, 'session.json', session.toJSON());
    }
    async saveFile(dirPath, fileName, data) {
        try {
            const prevUmask = process.umask();
            process.umask(0);
            if (!(await existsAsync(dirPath))) {
                await fs_1.promises.mkdir(dirPath, { recursive: true, mode: 0o775 });
            }
            const json = JSON.stringify(data, null, 2);
            // greater than 1mb
            if (Buffer.byteLength(json) > 1 * MB) {
                fileName += '.gz';
                const content = new stream_1.PassThrough().end(json);
                const writeStream = (0, fs_1.createWriteStream)(`${dirPath}/${fileName}`);
                await new Promise(resolve => content.pipe((0, zlib_1.createGzip)()).pipe(writeStream).once('finish', resolve));
            }
            else {
                await fs_1.promises.writeFile(`${dirPath}/${fileName}`, json);
            }
            console.log(`SAVED ${dirPath}/${fileName}`);
            process.umask(prevUmask);
        }
        catch (error) {
            console.log('ERROR trying to save file', { dirPath, fileName, error });
        }
    }
}
exports.default = Server;
async function existsAsync(path) {
    try {
        await fs_1.promises.access(path);
        return true;
    }
    catch (_) {
        return false;
    }
}
function sendJson(res, json, status = 200) {
    res.writeHead(status, {
        'content-type': 'application/json',
    });
    res.end(JSON.stringify(json));
}
function extractBaseDir(activeScraper) {
    if (activeScraper.dataDir === DOWNLOAD) {
        return Path.join(downloadDir, activeScraper.id);
    }
    return activeScraper.dataDir;
}
function extractAssignmentDir(activeScraper, assignment) {
    const baseDir = extractBaseDir(activeScraper);
    const isIndividual = assignment.type === IAssignment_1.AssignmentType.Individual;
    const folder = (isIndividual ? assignment.type : `${assignment.type}-${assignment.pickType}`).toLowerCase();
    return `${baseDir}/${folder}/${assignment.id}`;
}
function extractAssignmentProfilesDir(activeScraper, assignment) {
    const baseDirPath = extractAssignmentDir(activeScraper, assignment);
    return `${baseDirPath}/raw-data`;
}
async function pipeDirToStream(dirPath, stream) {
    await new Promise(async (resolve, reject) => {
        Tar.create({
            gzip: true,
            cwd: dirPath,
            portable: true,
            filter: path => !path.startsWith('.'),
        }, await fs_1.promises.readdir(dirPath))
            .pipe(stream)
            .on('error', reject)
            .on('finish', resolve);
    });
}
//# sourceMappingURL=Server.js.map