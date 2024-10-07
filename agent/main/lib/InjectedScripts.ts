import * as fs from 'fs';
import { stringifiedTypeSerializerClass } from '@ulixee/commons/lib/TypeSerializer';
import { IDomPaintEvent } from '@ulixee/unblocked-specification/agent/browser/Location';
import FramesManager from './FramesManager';
import DevtoolsSession from './DevtoolsSession';

const pageScripts = {
  NodeTracker: fs.readFileSync(`${__dirname}/../injected-scripts/NodeTracker.js`, 'utf8'),
  jsPath: fs.readFileSync(`${__dirname}/../injected-scripts/jsPath.js`, 'utf8'),
  MouseEvents: fs.readFileSync(`${__dirname}/../injected-scripts/MouseEvents.js`, 'utf8'),
  PaintEvents: fs.readFileSync(`${__dirname}/../injected-scripts/PaintEvents.js`, 'utf8'),
};

const pageEventsCallbackName = '__ulxPagePaintEventListenerCallback';
export const injectedScript = `(function ulxInjectedScripts(callbackName) {
const exports = {}; // workaround for ts adding an exports variable
${stringifiedTypeSerializerClass};

${pageScripts.NodeTracker};
${pageScripts.jsPath};
${pageScripts.MouseEvents};
${pageScripts.PaintEvents};

window.TypeSerializer = TypeSerializer;
window.ULX = {
  JsPath,
  MouseEvents
};
})('${pageEventsCallbackName}');`.replaceAll(/# sourceMappingURL=.*\.js\.map/g, '');

export default class InjectedScripts {
  public static JsPath = `ULX.JsPath`;
  public static MouseEvents = `ULX.MouseEvents`;

  public static install(
    framesManager: FramesManager,
    devtoolsSession: DevtoolsSession,
    onPaintEvent: (
      frameId: number,
      event: { url: string; event: IDomPaintEvent; timestamp: number },
    ) => void,
  ): Promise<any> {
    return Promise.all([
      framesManager.addPageCallback(
        pageEventsCallbackName,
        (payload, frame) => onPaintEvent(frame.frameId, JSON.parse(payload)),
      ),
      framesManager.addNewDocumentScript(
        injectedScript,
        framesManager.page.installJsPathIntoIsolatedContext,
        devtoolsSession,
      ),
    ]);
  }
}
