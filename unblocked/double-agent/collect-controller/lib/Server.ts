import * as url from 'url';
import { createReadStream, createWriteStream, existsSync, promises as Fs, rmdirSync } from 'fs';
import * as Path from 'path';
import * as http from 'http';
import { pathToRegexp } from 'path-to-regexp';
import Collect from '@double-agent/collect';
import Plugin from '@double-agent/collect/lib/Plugin';
import IUserAgentToTest from '@double-agent/config/interfaces/IUserAgentToTest';
import { createGzip } from 'zlib';
import { PassThrough } from 'stream';
import archiver = require('archiver');
import IAssignment, { AssignmentType } from '../interfaces/IAssignment';
import buildAssignment from './buildAssignment';
import buildAllAssignments from './buildAllAssignments';

interface IRequestParams {
  userId: string;
  userAgentId?: string;
  assignmentId?: string;
  dataDir?: string;
  userAgentsToTestPath?: string;
}

interface IAssignmentsById {
  [id: string]: IAssignment;
}

interface IActiveUser {
  id: string;
  assignmentsById: IAssignmentsById;
  dataDir?: string;
  isBasic?: boolean;
}

const DOWNLOAD = 'download';
const downloadDir = '/tmp/double-agent-download-data';
const MB = 1028 * 1028;
if (existsSync(downloadDir)) rmdirSync(downloadDir, { recursive: true });

export default class Server {
  private activeUsersById: { [id: string]: IActiveUser } = {};
  private readonly collect: Collect;
  private readonly httpServer: http.Server;
  private readonly httpServerPort: number;
  private readonly routeMetaByRegexp: Map<RegExp, any> = new Map();
  private favicon: Buffer;

  private readonly endpointsByRoute = {
    '/': this.createBasicAssignment.bind(this),
    '/create': this.createAssignments.bind(this),
    '/activate/:assignmentId': this.activateAssignment.bind(this),
    '/download': this.downloadAll.bind(this),
    '/download/:assignmentId': this.downloadAssignmentProfiles.bind(this),
    '/finish': this.finishAssignments.bind(this),
    '/favicon.ico': this.sendFavicon.bind(this),
  };

  constructor(collect: Collect, httpServerPort: number) {
    this.collect = collect;
    this.httpServerPort = httpServerPort;
    this.httpServer = new http.Server(this.handleRequest.bind(this));

    Object.keys(this.endpointsByRoute).forEach(route => {
      const keys = [];
      const regexp = pathToRegexp(route, keys);
      this.routeMetaByRegexp.set(regexp, { route, keys });
    });
  }

  public start(): Promise<void> {
    return new Promise<void>(resolve => {
      this.httpServer.listen(this.httpServerPort, resolve).on('error', err => console.log(err));
    });
  }

  public async close(): Promise<void> {
    this.httpServer.close();
    await this.collect.shutdown();
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
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

  private async sendFavicon(_, res: http.ServerResponse): Promise<void> {
    this.favicon ??= await Fs.readFile(`${__dirname}/../public/favicon.ico`);

    res.writeHead(200, { 'Content-Type': 'image/x-icon' });
    res.end(this.favicon);
  }

  private async createBasicAssignment(
    _,
    res: http.ServerResponse,
    params: IRequestParams,
  ): Promise<void> {
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

    const assignment = buildAssignment(userId, 0, params.userAgentId);
    activeScraper.assignmentsById = { [assignment.id]: assignment };

    params.assignmentId = assignment.id.toString();
    await this.activateAssignment(_, res, params);
  }

  private async createAssignments(
    _,
    res: http.ServerResponse,
    params: IRequestParams,
  ): Promise<void> {
    console.log('CREATE ASSIGNMENT');
    const { userId, dataDir } = params;
    if (!userId) {
      return sendJson(res, { message: 'Please provide a userId header or query param' }, 500);
    }
    if (!params.userAgentsToTestPath) {
      return sendJson(res, { message: 'Please provide a userAgentsToTestPath query param' }, 500);
    }

    const userAgentsToTestData = await Fs.readFile(params.userAgentsToTestPath, 'utf8');
    const userAgentsToTest = JSON.parse(userAgentsToTestData) as IUserAgentToTest[];
    this.activeUsersById[userId] = await this.createUser(userId, dataDir, userAgentsToTest);

    const assignments = Object.values(this.activeUsersById[userId].assignmentsById).map(
      assignment => {
        return { ...assignment, pagesByPlugin: undefined };
      },
    );

    sendJson(res, { assignments });
  }

  private async createUser(
    id: string,
    dataDir: string,
    userAgentsToTest: IUserAgentToTest[],
  ): Promise<{ id: string; dataDir: string; assignmentsById: IAssignmentsById }> {
    const assignments = await buildAllAssignments(userAgentsToTest);
    const assignmentsById: IAssignmentsById = {};

    for (const assignment of assignments) {
      assignmentsById[assignment.id] = assignment;
    }

    return {
      id,
      dataDir: dataDir || DOWNLOAD,
      assignmentsById,
    };
  }

  private async activateAssignment(
    _,
    res: http.ServerResponse,
    params: IRequestParams,
  ): Promise<void> {
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
    if (!assignment) return sendJson(res, { message: 'Assignment not found' }, 500);
    if (assignment.sessionId)
      return sendJson(res, { message: 'Assignment already activated' }, 500);

    const session = await this.collect.createSession(
      assignment.type,
      assignment.userAgentId,
      assignment.userAgentString,
    );
    assignment.sessionId = session.id;
    assignment.pagesByPlugin = session.generatePages();

    if (activeScraper.dataDir) {
      session.onSavePluginProfile = (plugin: Plugin, data: any, filenameSuffix: string) => {
        const profilesDir = extractAssignmentProfilesDir(activeScraper, assignment);
        const filename = `${plugin.id}${filenameSuffix ? `--${filenameSuffix}` : ''}`;
        void this.saveFile(profilesDir, `${filename}.json`, data);
      };
    }

    const dataDir = extractAssignmentDir(activeScraper, assignment);
    sendJson(res, { assignment: { dataDir, ...assignment } });
  }

  private async downloadAssignmentProfiles(
    _,
    res: http.ServerResponse,
    params: Pick<IRequestParams, 'userId' | 'assignmentId'>,
  ): Promise<void> {
    const { userId, assignmentId } = params;
    if (!userId)
      return sendJson(res, { message: 'Please provide a userId header or query param' }, 500);
    if (!assignmentId)
      return sendJson(res, { message: 'Please provide a assignmentId header or query param' }, 500);

    const activeScraper = this.activeUsersById[userId];
    const assignmentsById = activeScraper?.assignmentsById;
    const assignment = assignmentsById ? assignmentsById[assignmentId] : null;
    if (!assignment) return sendJson(res, { message: 'Assignment not found' }, 500);

    await this.saveMetaFiles(activeScraper, assignment);
    const profilesDir = extractAssignmentProfilesDir(activeScraper, assignment);
    await pipeDirToStream(profilesDir, res);

    const session = this.collect.getSession(assignment.sessionId);
    await this.collect.deleteSession(session);

    delete this.activeUsersById[userId];
  }

  private async downloadAll(
    _,
    res: http.ServerResponse,
    params: Pick<IRequestParams, 'userId'>,
  ): Promise<void> {
    const { userId } = params;
    if (!userId) return sendJson(res, { message: 'Please provide a userId query param' }, 500);

    const activeScraper = this.activeUsersById[userId];
    for (const assignmentId of Object.keys(activeScraper.assignmentsById)) {
      const assignment = activeScraper.assignmentsById[assignmentId];
      this.saveMetaFiles(activeScraper, assignment);
    }

    const profilesDir = extractBaseDir(activeScraper);
    await pipeDirToStream(profilesDir, res).catch(console.error);
  }

  private async finishAssignments(
    _,
    res: http.ServerResponse,
    params: Pick<IRequestParams, 'userId'>,
  ): Promise<void> {
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
      await Fs.rm(dataDir, { recursive: true });
    }

    sendJson(res, { finished: true });
  }

  private saveMetaFiles(activeScraper: IActiveUser, assignment: IAssignment): void {
    const baseDirPath = extractAssignmentDir(activeScraper, assignment);
    void this.saveFile(baseDirPath, 'assignment.json', assignment);

    // TODO: We need to save session.json but without the DOM export (and other unneeded data) -- too large
    // this.saveFile(baseDirPath, 'session.json', session.toJSON());
  }

  private async saveFile(dirPath: string, fileName: string, data: any): Promise<void> {
    try {
      const prevUmask = process.umask();
      process.umask(0);
      if (!(await existsAsync(dirPath))) {
        await Fs.mkdir(dirPath, { recursive: true, mode: 0o775 });
      }
      const json = JSON.stringify(data, null, 2);
      // greater than 1mb
      if (Buffer.byteLength(json) > 1 * MB) {
        fileName += '.gz';
        const content = new PassThrough().end(json);
        const writeStream = createWriteStream(`${dirPath}/${fileName}`);
        await new Promise(resolve =>
          content.pipe(createGzip()).pipe(writeStream).once('finish', resolve),
        );
      } else {
        await Fs.writeFile(`${dirPath}/${fileName}`, json);
      }
      console.log(`SAVED ${dirPath}/${fileName}`);
      process.umask(prevUmask);
    } catch (error) {
      console.log('ERROR trying to save file', { dirPath, fileName, error });
    }
  }
}

async function existsAsync(path: string): Promise<boolean> {
  try {
    await Fs.access(path);
    return true;
  } catch (_) {
    return false;
  }
}
function sendJson(res: http.ServerResponse, json: any, status = 200): void {
  res.writeHead(status, {
    'content-type': 'application/json',
  });
  res.end(JSON.stringify(json));
}

function extractBaseDir(activeScraper: IActiveUser): string {
  if (activeScraper.dataDir === DOWNLOAD) {
    return Path.join(downloadDir, activeScraper.id);
  }
  return activeScraper.dataDir;
}

function extractAssignmentDir(activeScraper: IActiveUser, assignment: IAssignment): string {
  const baseDir = extractBaseDir(activeScraper);
  const isIndividual = assignment.type === AssignmentType.Individual;
  const folder = (
    isIndividual ? assignment.type : `${assignment.type}-${assignment.pickType}`
  ).toLowerCase();
  return `${baseDir}/${folder}/${assignment.id}`;
}

function extractAssignmentProfilesDir(activeScraper: IActiveUser, assignment: IAssignment): string {
  const baseDirPath = extractAssignmentDir(activeScraper, assignment);
  return `${baseDirPath}/raw-data`;
}

async function pipeDirToStream(dirPath: string, stream: any): Promise<void> {
  const archive = archiver('zip', { gzip: true, zlib: { level: 9 } });
  if (await existsAsync(dirPath)) {
    const fileNames = await Fs.readdir(dirPath);
    for (const fileName of fileNames) {
      archive.append(createReadStream(`${dirPath}/${fileName}`), { name: fileName });
    }
  }
  archive.pipe(stream);
  const isFinished = new Promise<void>(resolve => archive.on('close', resolve));
  await archive.finalize();
  await isFinished;
}
