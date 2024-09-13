import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';

export default function script(ctx: IRequestContext) {
  return `
<script type="text/javascript">

(function uaProbe() {
  async function getVoices() {
    let voices = [];
    await new Promise(resolve => window.addEventListener('load', resolve))
    if (typeof speechSynthesis !== 'undefined') {
      if (speechSynthesis.getVoices().filter(x=>!!x.name).length === 0) {
        let retryInterval;
        await Promise.race([
          new Promise(resolve => 'addEventListener' in speechSynthesis ? speechSynthesis.addEventListener("voiceschanged", resolve) : resolve()),
          new Promise(resolve => {
            retryInterval = setInterval(() => {
              if (speechSynthesis.getVoices().filter(x=>!!x.name).length) resolve();
            }, 100);
          }),
          new Promise(resolve => setTimeout(resolve, 15e3))
        ]);
        
        clearInterval(retryInterval);
      }
      // wait a few seconds for other voices to come through
      await new Promise(resolve => setTimeout(resolve, 3e3));
      for (const { default: de,lang,localService,name,voiceURI } of speechSynthesis.getVoices()) {
        if (!name) continue;
        voices.push({ 'default': de,lang,localService,name,voiceURI })
      }
    }
    return fetch('${ctx.buildUrl('/save')}', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({voices}),
    });
  }
  
  window.pageQueue.push(getVoices().catch(console.error));
})();
</script>`;
}
