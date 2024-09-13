import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
import PageNames from '../interfaces/PageNames';
import loadDomExtractorScript, { IDomExtractorPageMeta } from './loadDomExtractorScript';

export function loadServiceWorker(ctx: IRequestContext) {
  return `
<script type=text/javascript>
(function serviceWorkerProbe() {
    const run = new Promise(resolve => {
        navigator.serviceWorker.register("${ctx.buildUrl('/service-worker.js')}");
        navigator.serviceWorker.ready.then(registration => {
            const broadcast = new BroadcastChannel('da_channel');
            broadcast.onmessage = () => {
                registration.unregister()
                broadcast.close()
                return resolve()
            }
            return broadcast.postMessage({ type: 'domScript' });
        });
    });
    self.pageQueue.push(run);
})();
</script>
`;
}

export function serviceWorkerScript(ctx: IRequestContext) {
  const pageMeta: IDomExtractorPageMeta = {
    saveToUrl: ctx.buildUrl('/save'),
    pageUrl: ctx.url.href,
    pageHost: ctx.url.host,
    pageName: PageNames.ServiceWorkerDom,
  };
  ctx.res.setHeader('Content-Type', 'application/javascript');
  ctx.res.end(`
    ${loadDomExtractorScript()};
    const broadcast = new BroadcastChannel('da_channel');
    broadcast.onmessage = async event => {
        if (event.data && event.data.type == 'domScript') {
            await self.runDomExtractor('self', ${JSON.stringify(pageMeta)});
            broadcast.postMessage('done');
        }
    }
`);
}
