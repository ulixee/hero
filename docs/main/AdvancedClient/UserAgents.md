# User Agents

> Hero automatically rotates through real UserAgent strings. There's a selector language to indicate your Operating System and Browser version preference.

## Background

User Agent rotation is one of the ways developers have traditionally provided "noise" into the browser fingerprint acrss a series of scraping sessions. This is still a viable strategy, albeit less and less so as Chrome, Firefox and other browsers have begun to "freeze" the details of the UserAgent in the normal user-agent string (eg: Chrome 105+ no longer includes the build or patch release of the Browser Version, Mac OS 10.15.17 is the maximum Mac Operating System version shared, etc). These browsers have pushed many settings to the `Accept-CH` headers, where details are provided when a website requests them in the first HTTP Document request, or in a first TLS ClientHello message (via ApplicationSettings). All this to say, you now need to align your User Agent across many settings.

## Real User Agent Strings

As the versions of browsers have gotten easier to differentiate, it is also becoming more common for a website to decide you are saying you run a Chrome version, but your features indicate otherwise. For this reason, Hero defaults to round-robining between real UserAgent strings that have been extracted by watching Chrome's auto-update tooling. A user can install multiple browsers:

```bash
yarn add @ulixee/chrome-104-0 @ulixee/chrome-105-0 @ulixee/chrome-106-0
```

When those browsers are installed, they will be automatically added to the round-robin of UserAgents. Whenever a new Hero instance is created, one of the installed Browsers is chosen at random, and a UserAgent string created by the [Unblocked RealUserAgents](https://github.com/ulixee/unblocked/main/tree/real-user-agents) project will be selected at random as well. Operating systems are rotated through Mac OS 10.10 to Mac OS 12, and Windows 7-11.

This means anytime you use Hero, you're getting randomized UserAgent strings. The only exception to this is if you load a [UserProfile](/docs/hero/basic-client/hero#export-profile), Hero will consistently use the same UserAgent string and Operating system.

## Selecting an Agent

When you initiate a new [Hero](/docs/hero/basic-client/hero) instance, one of the constructor options is a `userAgent`. You can provide two options:

1. A full UserAgent string. In this case, Hero will try to load the Browser provided and substitute anything that can't be matched (eg, Linux as an Operating System). If a compatible browser cannot be found, the system will throw an Error to install a matching/compatible browser.
2. A Selector can be provided indicating the version(s) of Chrome you'd like to use, and/or an Operating System. 
 
Selectors are indicated by starting a `userAgent` parameter with a `~`
  - You may limit to a type of browser `~ chrome`
  - You may select an exact browser `~ chrome = 105`
  - You may select a minimum browser version `~ chrome > 105`
  - You may select a range of browser versions `~ chrome >= 105 && chrome <= 106`
  - You may also combine a browser and operating system choice `~ chrome = 105 && mac`
  - You may also combine a browser and operating system version `~ chrome = 105 && mac 10.15`

```typescript
new Hero({
  userAgent: '~ chrome >= 105 && windows >= 10'
});
const meta = await hero.meta;
console.log(meta.userAgentString); // will be Chrome >= 105 and Windows 10 or 11
// This is the underlying Chrome "executable" version that the UserAgent is emulating. 
// Will usually be same Major version and different Patch version.
console.log(meta.renderingEngineVersion); 
```
