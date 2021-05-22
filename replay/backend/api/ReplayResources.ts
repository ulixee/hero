import { ProtocolResponse } from 'electron';
import * as Http from 'http';
import { Readable } from 'stream';
import getResolvable from '~shared/utils/promise';
import { IReplayResource } from '~shared/interfaces/IReplayResource';
import decompress from '~shared/utils/decompress';

const packageJson = require('../../package.json');

type IResolvable<T> = {
  resolve: (resource: T) => void;
  promise: Promise<T>;
};
const resourceWhitelist = new Set<string>([
  'Ico',
  'Image',
  'Media',
  'Font',
  'Stylesheet',
  'Other',
  'Document',
]);

export default class ReplayResources {
  private resourcesByUrl = new Map<string, IResolvable<IReplayResource>>();
  private resourcesById = new Map<number, IReplayResource>();
  private resourceBodyById = new Map<number, Promise<ProtocolResponse>>();

  public onResource(resourceMeta: IReplayResource): void {
    const { url } = resourceMeta;
    this.initResource(url);

    this.resourcesById.set(resourceMeta.id, resourceMeta);
    this.resourcesByUrl.get(url).resolve(resourceMeta);
  }

  public async get(urlStr: string): Promise<IReplayResource> {
    const url = urlStr.split('#').shift();
    this.initResource(url);
    return await this.resourcesByUrl.get(url).promise;
  }

  public async getContent(
    resourceId: number,
    baseHost: string,
    dataDir: string,
  ): Promise<ProtocolResponse> {
    const resource = this.resourcesById.get(resourceId);
    if (!resourceWhitelist.has(resource.type)) {
      console.log('skipping resource', resource);

      return <ProtocolResponse>{
        data: Readable.from([]),
        statusCode: 404,
      };
    }
    if (!this.resourceBodyById.has(resourceId)) {
      const { resolve, reject, promise } = getResolvable<ProtocolResponse>();
      this.resourceBodyById.set(resourceId, promise);
      const reqHeaders = { headers: { 'x-data-location': dataDir } };
      const req = Http.get(`${baseHost}/resource/${resourceId}`, reqHeaders, async res => {
        res.on('error', reject);

        const contentType = res.headers['content-type'];
        const encoding = res.headers['content-encoding'];
        const headers: any = {
          'Cache-Control': 'public, max-age=604800, immutable',
          'Content-Type': contentType,
          'X-Replay-Agent': `Secret Agent Replay v${packageJson.version}`,
        };
        if (res.headers.location) {
          headers.location = res.headers.location;
        }

        const buffer: Buffer[] = [];
        for await (const chunk of res) {
          buffer.push(chunk);
        }

        let body = Buffer.concat(buffer);

        if (encoding) {
          body = await decompress(body, encoding);
        }

        if (resource.type === 'Document' && !isAllowedDocumentContentType(contentType)) {
          const first100 = body.slice(0, 200).toString();

          let doctype = '';
          const match = first100.match(/^\s*<!DOCTYPE([^>]*?)>/i);
          if (match) {
            doctype = `<!DOCTYPE${match[1] ?? ''}>\n`;
          }

          body = Buffer.from(`${doctype}<html><head></head><body></body></html>`);
        }

        resolve(<ProtocolResponse>{
          data: body,
          headers,
          statusCode: res.statusCode,
        });
      });
      req.on('error', reject);
      req.end();
    }
    const cached = await this.resourceBodyById.get(resourceId);
    return {
      ...cached,
      data: Readable.from(cached.data),
    };
  }

  private initResource(url: string) {
    if (!this.resourcesByUrl.has(url)) {
      this.resourcesByUrl.set(url, getResolvable<IReplayResource>());
    }
  }
}

function isAllowedDocumentContentType(contentType: string) {
  if (!contentType) return false;
  return (
    contentType.includes('json') || contentType.includes('svg') || contentType.includes('font')
  );
}
