import SessionDb from '../dbs/SessionDb';

export default function sessionTabsApi(args: ISessionTabsArgs): ISessionTabsResult {
  const sessionDb = SessionDb.getCached(args.sessionId, true);

  const tabs = sessionDb.tabs.all();
  const frames = sessionDb.frames.all();
  // don't take redirects
  const frameNavigations = sessionDb.frameNavigations.all().filter(x => !x.httpRedirectedTime);

  const result: ISessionTabsResult = {
    tabs: [],
  };

  for (const tab of tabs) {
    const tabFrames = frames.filter(x => x.tabId === tab.id);
    const mainFrame = frames.find(x => !x.parentId && x.tabId === tab.id);
    const startNavigation = frameNavigations.find(x => x.frameId === mainFrame.id);
    result.tabs.push({
      id: tab.id,
      width: tab.viewportWidth,
      height: tab.viewportHeight,
      startUrl: startNavigation.finalUrl ?? startNavigation.requestedUrl,
      createdTime: tab.createdTime,
      frames: tabFrames.map(x => {
        return {
          id: x.id,
          isMainFrame: !x.parentId,
          domNodePath: sessionDb.frames.frameDomNodePathsById[x.id],
        };
      }),
    });
  }

  return result;
}

interface ISessionTabsArgs {
  sessionId: string;
}

interface ISessionTabsResult {
  tabs: ISessionTab[];
}

export interface ISessionTab {
  id: number;
  createdTime: number;
  startUrl: string;
  width: number;
  height: number;
  frames: ISessionFrame[];
}

export interface ISessionFrame {
  id: number;
  isMainFrame: boolean;
  domNodePath: string;
}
