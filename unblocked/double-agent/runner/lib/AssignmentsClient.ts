import fetch from 'node-fetch';
import IAssignment from '@double-agent/collect-controller/interfaces/IAssignment';
import Config from '@double-agent/config';
import * as qs from 'querystring';
import { Stream } from 'stream';
import * as unzipper from 'unzipper';
import { existsAsync } from '@ulixee/commons/lib/fileUtils';
import { promises as Fs } from 'fs';

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

    if (!(await existsAsync(filesDir))) await Fs.mkdir(filesDir, { recursive: true });

    await new Promise<void>((resolve) => {
      filesStream.pipe(unzipper.Extract({ path: filesDir })).on('finish', resolve);
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  async downloadAll(filesDir: string): Promise<void> {
    const filesStream = await this.get<Stream>(`/download`, { userId: this.userId });

    if (!(await existsAsync(filesDir))) await Fs.mkdir(filesDir, { recursive: true });

    await new Promise<void>((resolve) => {
      filesStream.pipe(unzipper.Extract({ path: filesDir })).on('finish', resolve);
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
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
