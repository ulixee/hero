import { IPuppetPage } from '../interfaces/IPuppetPage';
import { IPuppetFrame } from '../interfaces/IPuppetFrame';

export interface ITestPage extends IPuppetPage {
  click(selector: string): Promise<void>;
  attachFrame(frameId: string, url: string): Promise<IPuppetFrame>;
  detachFrame(frameId: string): Promise<void>;
  goto(url: string, waitOnLifecycle?: string): Promise<void>;
  setContent(content: string): Promise<void>;
  waitForPopup(): Promise<IPuppetPage>;
}

export function createTestPage(page: IPuppetPage) {
  const castPage = page as ITestPage;
  castPage.attachFrame = attachFrame.bind(page, page);
  castPage.detachFrame = detachFrame.bind(page, page);
  castPage.click = click.bind(page, page);
  castPage.setContent = setContent.bind(page, page);
  castPage.waitForPopup = waitForPopup.bind(page, page);
  castPage.goto = goto.bind(page, page);
  return castPage;
}

export async function click(page: IPuppetPage, selector: string) {
  const coordinates: any = await page.evaluate(`(()=>{ 
    const rect = document.querySelector('${selector}').getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y
    };
})();`);
  await page.mouse.click(coordinates.x, coordinates.y);
}

export async function attachFrame(page: IPuppetPage, frameId: string, url: string) {
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

export async function detachFrame(page: IPuppetPage, frameId: string) {
  await page.evaluate(`((frameId) => {
        document.getElementById(frameId).remove();
      })('${frameId}')`);
}

export async function goto(page: IPuppetPage, url: string, waitOnLifecycle = 'load') {
  const nav = page.waitOn('frame-lifecycle', event => event.name === waitOnLifecycle);
  await Promise.all([page.navigate(url), nav]);
}

export async function setContent(page: IPuppetPage, content: string) {
  await page.evaluate(`((content) => {
        window.stop();
        document.open();
        document.write(content);
        document.close();
      })(${JSON.stringify(content)})`);
}

export async function waitForPopup(page: IPuppetPage) {
  return new Promise<IPuppetPage>(resolve => {
    page.popupInitializeFn = async popup => resolve(popup);
  });
}
