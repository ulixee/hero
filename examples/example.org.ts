import Hero from '@ulixee/hero';

async function run() {
  const hero = new Hero({ showReplay: true });
  await hero.goto('https://example.org/');
  await hero.waitForPaintingStable();

  console.log('\n-- PRINTING location.href ---------');
  console.log(await hero.url);

  const html = await hero.document.documentElement.outerHTML;
  console.log('-- PRINTING outerHTML ---------------');
  console.log(html);
  hero.output.html = html;
  hero.output.title = await hero.document.title;
  hero.output.intro = await hero.document.querySelector('p').textContent;

  console.log('-------------------------------------');

  await hero.close();

  console.log('OUTPUT from https://example.org', hero.output);
}

run().catch(error => console.log(error));
