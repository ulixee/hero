---
title: 'Moving from Chromium to Chrome'
path: /blog/chromium-chrome
date: 2021-02-19
summary: "We're moving our underlying engine from Chromium to Chrome in the coming weeks."
---

We're moving our underlying engine from Chromium to Chrome in the coming weeks. 

## Why?
There are a few reasons we decided to go this direction:
1. Chrome is the actual browser being used in the wild by consumers.
2. Chrome has increasingly diverged from Chromium. In our DoubleAgent testing, we're seeing Chrome 85-89 steadily diverge features. This makes it harder and harder to emulate Chrome when using Chromium as the engine.
3. Chrome has certain features that aren't in Chromium that will be nearly impossible to emulate (x-headers to Google sites, Widevine, etc). In theory, you could use DRM as a way to weed out Chromium users masking themselves as Chrome users.

## Chrome Version-Specific Installers 
This switch was somewhat challenging, primarily because the Chrome team doesn't openly publish versions of Chrome that stay on the version you want them on. Even on Ubuntu, if you install the .deb release, it will install an apt updater, and if you're not careful, your engine will swap out underneath you.

Our first task was to go out and find stable Chrome installations for each version. We created a new project called [chrome-versions](https://github.com/ulixee/chrome-versions) that downloads, extracts, and stores versions of Chrome for Linux, Windows and Mac. 

For each version, we stripped out the auto-update features and converted them to .tar archives that can be extracted side-by-side. They're then published on Github as release assets for each Chrome version (eg, https://github.com/ulixee/chrome-versions/releases/tag/88.0.4324.182)

On Debian/Ubuntu, Chrome often needs packages to be installed. We re-bundled the .deb control file into a new installer that can be run after you extract the chrome executable - this makes setting up CI or docker very simple for 1 or more Chrome installations.

## Ulixee Hero
Hero has been updated to use Chrome everywhere. Our emulators have "polyfills" auto-generated for how to resemble Chrome headed when running each version headless. The changes are significant enough from Chromium that you need to actually use Chrome underneath. 

No changes should be visible in your scripts, but you might see some installation changes as you go to upgrade. We also experienced some changes in no-sandbox features when running on Docker. Your mileage here may vary. 

This new release will have an updated Dockerfile and files under `tools/docker/*` showing how to get up and running on Docker-slim.
