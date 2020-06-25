<template lang="pug">
BasicLayout.Why
  Section(container="md" dots="true")
    .post-header.container-md.mb-x2
      h1 Why Another Headless Browser?

      h2 Open-Data is Still Out of Reach
      .mission
        p.
          The goal of SecretAgent is to move the world toward data openness.
          <a href="https://dataliberationfoundation.org">We</a> believe data openness is essential for the
          startup ecosystem and innovation in general.

        p.
          We've seen significant tooling in scraping over the last several years (i.e., Puppeteer, mitmproxy, Diffbot, Apify, etc),
          but too much of it is closed source and/or not directly aimed at scrapers.

        p.
          We want to make it <b><i>dead simple</i></b> for developers to write <i>undetectable</i> scraper scripts.

      h2 Existing Scrapers are Easy to Detect

      p.
        Did you know there are <a href="https://stateofscraping.org/" target="_blank">76,697</a> checks websites can use to
        detect and block 99% of existing scrapers?

      p.
        We created a <a href="https://stateofscraping.org/">full spectrum bot-detector</a> that looks at every layer of a web page request
        to figure out how to differentiate bots from real users using real browsers.

      p.
        SecretAgent can fully emulate human browsers at every layer of the TCP/HTTP stack. Out of the box, the
        <a href="https://gs.statcounter.com/browser-version-market-share/desktop/worldwide/">top 3</a> most popular browsers are ready to plug-in.


      h2 Writing Scraper Scripts is Still too Complicated

      p.
        Puppeteer was a big improvement in interacting with modern websites, but introduced a subtle mess: the browser is a
        fully separate code environment from your script. You can access the power of the DOM, but
        <a href="https://github.com/puppeteer/puppeteer/issues/5192">you can't write</a>
        reusable code to do so.

      prism(language="js").
          import extractor from 'smart-link-extractor';

          // ...load page

          const extractedLinks = await page.evaluate(function() {
             const links = document.querySelectorAll('a');
             // ERROR! Not available
             return extractor(links);
          });

      p.
        SecretAgent lets developers directly access the full DOM spec running in a real browser, without any context switching.

      p.
        Use the DOM API you already know:

      prism(language="js").
          import extractor from 'smart-link-extractor';

          // ...load document

          const links = await document.querySelectorAll('a');
          const extracted = extractor(links);


      h2 Debugging Scrapers is Soul Stealing

      p.
        Your script stopped working. Was it because of a website change, a single network hiccup, a captcha, a bot blocker?

      p.
        If you've ever tried to debug a broken script, you've run into this wall. Once that single failure is gone, it's very
        hard to get back and figure out how to work around it for the next time.

      p.
        SecretAgent comes with Replay - a high fidelity visual replay of every single scraping session. It's a full HTML based replica
        of all the page assets, DOM, http requests, etc. You can pull up the Replay agent and watch until the script breaks..
        then <i>fix it</i> inside Replay until you're back up and running.

      video(width="100%", height=500, style="background:black")
</template>

<style lang="scss">
.Why {
  h2 {
    margin-top: 40px;
  }
}
</style>
