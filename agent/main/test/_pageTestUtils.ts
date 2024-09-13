import INodeVisibility from '@ulixee/js-path/interfaces/INodeVisibility';
import { Page } from '../index';
import Frame from '../lib/Frame';
import ConsoleMessage from '../lib/ConsoleMessage';

export async function attachFrame(
  pageOrFrame: Page | Frame,
  frameId: string,
  url: string,
): Promise<Frame> {
  const frameCreatedPromise =
    pageOrFrame instanceof Page
      ? pageOrFrame.waitOn('frame-created')
      : pageOrFrame.page.waitOn('frame-created');

  await pageOrFrame.evaluate(`
        (async () => {
          const frame = document.createElement('iframe');
          frame.src = '${url}';
          frame.id = '${frameId}';
          document.body.appendChild(frame);
          await new Promise(x => (frame.onload = x));
        })()`);
  const { frame } = await frameCreatedPromise;
  if (pageOrFrame instanceof Page) return pageOrFrame.frames.find(x => x.id === frame.id);
  return pageOrFrame.childFrames.find(x => x.id === frame.id);
}

export async function setContent(page: Page, content: string) {
  await page.devtoolsSession.send('Page.setDocumentContent', {
    html: content,
    frameId: page.mainFrame.id,
  });
}

export async function detachFrame(pageOrFrame: Page | Frame, frameId: string): Promise<void> {
  await pageOrFrame.evaluate(`document.getElementById('${frameId}').remove()`);
}

export async function navigateFrame(
  pageOrFrame: Page | Frame,
  frameId: string,
  url: string,
): Promise<void> {
  const result = await pageOrFrame.devtoolsSession.send('Runtime.evaluate', {
    expression: `(() => {
      const frame = document.getElementById('${frameId}')
      frame.src = '${url}';
      return new Promise(x => {
        return (frame.onload = x);
      });
    })()`,
    awaitPromise: true,
  });
  if (result.exceptionDetails) {
    throw ConsoleMessage.exceptionToError(result.exceptionDetails);
  }
}

export async function waitForVisible(frame: Frame, selector: string, timeoutMs = 10e3): Promise<INodeVisibility> {
  let visibility: INodeVisibility;
  await wait(
    async () => {
      visibility = await frame.jsPath.getNodeVisibility(['document', ['querySelector', selector]]);
      if (visibility.isVisible) {
        return true;
      }
    },
    { loopDelayMs: 100, timeoutMs },
  );
  return visibility;
}

export async function waitForExists(frame: Frame, selector: string, timeoutMs = 10e3): Promise<void> {
  await wait(
    async () => {
      const visibility = await frame.jsPath.getNodeVisibility(['document', ['querySelector', selector]]);
      if (visibility.nodeExists) {
        return true;
      }
    },
    { loopDelayMs: 100, timeoutMs },
  );
}

function wait(
  callbackFn: () => Promise<boolean>,
  options: { timeoutMs?: number; loopDelayMs?: number } = {},
): Promise<boolean> {
  options.timeoutMs ??= 30e3;
  const end = Date.now() + options.timeoutMs;

  return new Promise<boolean>(async (resolve, reject) => {
    while (Date.now() <= end) {
      const isComplete = await callbackFn().catch(reject);
      if (isComplete) {
        resolve(true);
        return;
      }
      if (options.loopDelayMs) {
        await delay(options.loopDelayMs);
      }
    }
    resolve(false);
  });
}

function delay(millis: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, millis));
}
