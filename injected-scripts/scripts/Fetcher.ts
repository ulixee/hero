// eslint-disable-next-line @typescript-eslint/no-unused-vars
class Fetcher {
  public static createRequest(input: string | number, init?: RequestInit) {
    let requestOrUrl = input as string | Request;
    if (typeof input === 'number') {
      requestOrUrl = NodeTracker.getNodeWithId(input) as any;
    }
    const request = new Request(requestOrUrl, init);
    // @ts-ignore
    return TSON.stringify(ObjectAtPath.createAttachedState(request));
  }

  public static async fetch(input: string | number, init?: RequestInit) {
    let requestOrUrl = input as string | Request;
    if (typeof input === 'number') {
      requestOrUrl = NodeTracker.getNodeWithId(input) as any;
    }

    const response = await fetch(requestOrUrl, init);

    // @ts-ignore
    return TSON.stringify(ObjectAtPath.createAttachedState(response));
  }
}
