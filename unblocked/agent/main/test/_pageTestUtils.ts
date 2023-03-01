import { Page } from '../index';
import Frame from '../lib/Frame';

export async function attachFrame(page: Page, frameId: string, url: string): Promise<Frame> {
  const framePromise = page.waitOn('frame-created');
  await page.evaluate(`
        (async () => {
          const frame = document.createElement('iframe');
          frame.src = '${url}';
          frame.id = '${frameId}';
          document.body.appendChild(frame);
          await new Promise(x => (frame.onload = x));
        })()`);
  const { frame } = await framePromise;
  return page.frames.find(x => x.id === frame.id);
}

export async function setContent(page: Page, content: string) {
  await page.devtoolsSession.send('Page.setDocumentContent', {
    html: content,
    frameId: page.mainFrame.id,
  });
}
