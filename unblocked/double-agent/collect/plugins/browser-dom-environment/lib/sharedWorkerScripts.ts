import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
import PageNames from '../interfaces/PageNames';
import loadDomExtractorScript, { IDomExtractorPageMeta } from './loadDomExtractorScript';

export function loadSharedWorker(ctx: IRequestContext) {
  return `
<script type=text/javascript>
(function sharedWorkerProbe() {
    const run = new Promise(resolve => {
        const sharedWorker = new SharedWorker('${ctx.buildUrl('/shared-worker.js')}');
        sharedWorker.port.start()
        sharedWorker.port.addEventListener('message', message => {
            sharedWorker.port.close()
            return resolve()
        })
    });
    self.pageQueue.push(run);
})();
</script>
`;
}

export function sharedWorkerScript(ctx: IRequestContext) {
  const pageMeta: IDomExtractorPageMeta = {
    saveToUrl: ctx.buildUrl('/save'),
    pageUrl: ctx.url.href,
    pageHost: ctx.url.host,
    pageName: PageNames.SharedWorkerDom,
  };
  ctx.res.setHeader('Content-Type', 'application/javascript');
  ctx.res.end(`
    ${loadDomExtractorScript()};
    onconnect = async message => {
		  const port = message.ports[0];
      await runDomExtractor('self', ${JSON.stringify(pageMeta)}');
		  port.postMessage('done');
	  }
  `);
}
