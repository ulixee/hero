import Hero from '@ulixee/hero';

async function run() {
  const hero = new Hero({ showReplay: true });
  await hero.goto('https://example.org/');
  await hero.waitForPaintingStable();

  console.log('\n-- PRINTING location.href ---------');
  console.log(await hero.url);

  const outerHtml = await hero.document.documentElement.outerHTML;
  console.log('-- PRINTING outerHTML ---------------');
  console.log(outerHtml);
  console.log('OUTPUT from https://example.org', {
    outerHtml,
    title: await hero.document.title,
    intro: await hero.document.querySelector('p').textContent,
  });
  console.log('-------------------------------------');

  await hero.close();

}

run().catch(error => console.log(error));
