# SessionReplay

> SessionReplay lets you replay every click, key press, mouse movement and dom change from your session in high fidelity.

#### High Fidelity

Everytime you create a new [Hero](/docs/basic-interfaces/hero), a [Session](/docs/advanced/session) records every DOM change, click, mouse movement, "value" change for elements, Shadow DOM changes, iFrame updates, and everything else we can measure on the page. 

Replay "reconstructs" your page using all these events from every single micro-tick that occurred during your scrape.

#### Devtools At Any Point in Your Script

You get at a scrubber to move back and forth in your session, and you can use a DevTools javascript console to run selectors at any point in the script. This can help to identify those troublesome popups that run only every 10th run of your scrape.

#### Offline

Replay operates by replaying recorded assets and changes. It does not require any connection to the original website, so you can try things out without any impact to the end site.


#### Realtime or Recorded

When you launch a Hero script, Replay launches to show you what's happening right as it occurs in your script. There's some delay recording, transferring and replaying, but it can be a really useful tool to try changes out and run them.

Remote recordings are also easy to download and play in Replay to find the source of errors or unexpected results.

![Session Replay](@/assets/replay@2x.png)
