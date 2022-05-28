# TimeTravel

> TimeTravel lets you replay every click, key press, mouse movement and dom change from your session in high fidelity.

#### High Fidelity

Everytime you create a new [Hero](/docs/hero/basic-client/hero), a [Session](/docs/hero/advanced-concepts/sessions) records every DOM change, click, mouse movement, "value" change for elements, Shadow DOM changes, IFrame updates, and everything else we can measure on the page. 

TimeTravel "reconstructs" your page using all these events from every single micro-tick that occurred during your scrape.

#### Devtools At Any Point in Your Script

You get at a scrubber to move back and forth in your session, and you can use a DevTools javascript console to run selectors at any point in the script. This can help to identify those troublesome popups that run only every 10th run of your scrape.

#### Offline

TimeTravel operates by replaying recorded assets and changes. It does not require any connection to the original website, so you can try things out without any impact to the end site.
