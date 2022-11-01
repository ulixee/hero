import * as fs from 'fs';
import { stringifiedTypeSerializerClass } from '@ulixee/commons/lib/TypeSerializer';
import { IDomPaintEvent } from '@ulixee/unblocked-specification/agent/browser/Location';
import FramesManager from './FramesManager';

const pageScripts = {
  NodeTracker: fs.readFileSync(`${__dirname}/../injected-scripts/NodeTracker.js`, 'utf8'),
  jsPath: fs.readFileSync(`${__dirname}/../injected-scripts/jsPath.js`, 'utf8'),
  MouseEvents: fs.readFileSync(`${__dirname}/../injected-scripts/MouseEvents.js`, 'utf8'),
  PaintEvents: fs.readFileSync(`${__dirname}/../injected-scripts/PaintEvents.js`, 'utf8'),
};

const pageEventsCallbackName = '__ubkPagePaintEventListenerCallback';
export const injectedScript = `(function ubkInjectedScripts(runtimeFunction) {
const exports = {}; // workaround for ts adding an exports variable
${stringifiedTypeSerializerClass};

${pageScripts.NodeTracker};
${pageScripts.jsPath};
${pageScripts.MouseEvents};
${pageScripts.PaintEvents};

window.TypeSerializer = TypeSerializer;
window.UBK = {
  JsPath,
  MouseEvents
};
})('${pageEventsCallbackName}');`;

export default class InjectedScripts {
  public static JsPath = `UBK.JsPath`;
  public static MouseEvents = `UBK.MouseEvents`;

  public static install(
    framesManager: FramesManager,
    onPaintEvent: (
      frameId: number,
      event: { url: string; event: IDomPaintEvent; timestamp: number },
    ) => void,
  ): Promise<any> {
    return Promise.all([
      framesManager.addPageCallback(
        pageEventsCallbackName,
        (payload, frame) => onPaintEvent(frame.frameId, JSON.parse(payload)),
        framesManager.page.installJsPathIntoIsolatedContext,
      ),
      framesManager.addNewDocumentScript(
        injectedScript,
        framesManager.page.installJsPathIntoIsolatedContext,
      ),
    ]);
  }
}
