declare let ObjectAtPath: any;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class Fetcher {
  public static createRequest(input: string | number, init?: RequestInit) {
    let requestOrUrl = input as string | Request;
    if (typeof input === 'number') {
      requestOrUrl = NodeTracker.getWatchedNodeWithId(input) as any;
    }
    const request = new Request(requestOrUrl, init);
    return ObjectAtPath.createNodePointer(request);
  }

  public static async fetch(input: string | number, init?: RequestInit) {
    let requestOrUrl = input as string | Request;
    if (typeof input === 'number') {
      requestOrUrl = NodeTracker.getWatchedNodeWithId(input) as any;
    }

    const response = await fetch(requestOrUrl, init);

    return ObjectAtPath.createNodePointer(response);
  }
}
