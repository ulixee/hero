import { INodePointer } from '@ulixee/js-path';

class Fetcher {
  public static createRequest(input: string | number, init?: RequestInit): INodePointer {
    let requestOrUrl = input as string | Request;
    if (typeof input === 'number') {
      requestOrUrl = NodeTracker.getWatchedNodeWithId(input) as any;
    }
    const request = new Request(requestOrUrl, init);
    const nodeId = NodeTracker.watchNode(request as any);
    return {
      id: nodeId,
      type: 'Request',
    };
  }

  public static async fetch(input: string | number, init?: RequestInit): Promise<INodePointer> {
    let requestOrUrl = input as string | Request;
    if (typeof input === 'number') {
      requestOrUrl = NodeTracker.getWatchedNodeWithId(input) as any;
    }

    const response = await fetch(requestOrUrl, init);
    const nodeId = NodeTracker.watchNode(response as any);
    return {
      id: nodeId,
      type: response.constructor.name,
    };
  }
}
