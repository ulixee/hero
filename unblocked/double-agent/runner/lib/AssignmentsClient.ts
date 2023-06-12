import IAssignment from '@double-agent/collect-controller/interfaces/IAssignment';
import Config from '@double-agent/config';
import { promises as Fs } from 'fs';
import fetch from 'node-fetch';
import * as qs from 'querystring';
import { Stream } from 'stream';
import * as Tar from 'tar';

export { IAssignment };

export default class AssignmentsClient {
  private readonly baseUrl: string;

  constructor(readonly userId: string) {
    this.baseUrl = Config.runner.assignmentsHost;
  }

  async downloadAssignmentProfiles(assignmentId: string, filesDir: string): Promise<void> {
    const filesStream = await this.get<Stream>(`/download/${assignmentId}`, {
      userId: this.userId,
    });

    await Fs.mkdir(filesDir, { recursive: true }).catch(() => null);
    await new Promise((resolve, reject) => {
      filesStream
        .pipe(
          Tar.extract({
            cwd: filesDir,
            preserveOwner: false,
          }),
        )
        .on('finish', resolve)
        .on('error', reject);
    });
  }

  async downloadAll(filesDir: string): Promise<void> {
    const filesStream = await this.get<Stream>(`/download`, { userId: this.userId });

    await Fs.mkdir(filesDir, { recursive: true }).catch(() => null);

    await new Promise((resolve, reject) => {
      filesStream
        .pipe(
          Tar.extract({
            cwd: filesDir,
            preserveOwner: false,
          }),
        )
        .on('finish', resolve)
        .on('error', reject);
    });
  }

  async activate(assignmentId: string): Promise<IAssignment> {
    const result = await this.get<{ assignment: IAssignment }>(`/activate/${assignmentId}`, {
      userId: this.userId,
    });
    return result.assignment;
  }

  /**
   * Create and activate a single assignment
   */
  async createSingleUserAgentIdAssignment(
    userAgentId: string,
    dataDir?: string,
  ): Promise<IAssignment> {
    const { assignment } = await this.get<{ assignment: IAssignment }>('/', {
      userId: this.userId,
      userAgentId,
      dataDir,
    });
    return assignment;
  }

  async start(params: { dataDir: string; userAgentsToTestPath: string }): Promise<IAssignment[]> {
    const result = await this.get<{ assignments: IAssignment[] }>('/create', {
      userId: this.userId,
      ...params,
    });
    return result.assignments;
  }

  async finish(): Promise<void> {
    await this.get('/finish', { userId: this.userId });
  }

  private async get<T>(path: string, params: any): Promise<T> {
    const paramStrs = qs.stringify(params as any);

    const res = await fetch(`${this.baseUrl}${path}?${paramStrs}`);
    const contentType = res.headers.get('content-type');

    if (contentType === 'application/json') {
      const data = await res.json();
      if (res.status >= 400) {
        throw new Error(data.message);
      }
      return data;
    }

    return res.body;
  }
}
