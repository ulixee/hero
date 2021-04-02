# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.4.1-alpha.2](https://github.com/ulixee/secret-agent/compare/v1.4.1-alpha.1...v1.4.1-alpha.2) (2021-04-02)


### Bug Fixes

* **human:** fix re-hovering over current location ([7eb202a](https://github.com/ulixee/secret-agent/commit/7eb202ab19c43af8642a395351db6debdf0eb83d)), closes [#209](https://github.com/ulixee/secret-agent/issues/209)
* **mitm:** websockets use http1 in chrome ([0643003](https://github.com/ulixee/secret-agent/commit/0643003d5878913b9439cc013cc2e6533711d423))


### Features

* **core:** return null for non-existent elements ([871c2fa](https://github.com/ulixee/secret-agent/commit/871c2fa22d761e37836b3ecb1d765c6a5fc7cdee))
* **emulate:** wait 3 seconds after load ([1dd0fd5](https://github.com/ulixee/secret-agent/commit/1dd0fd5b6d151339b8c19ea95db43eef60998b00))
* **replay:** show nodes running execJsPath ([bb1a270](https://github.com/ulixee/secret-agent/commit/bb1a270aa44e5965443fdfa7640cdedb70ff005a))





## [1.4.1-alpha.1](https://github.com/ulixee/secret-agent/compare/v1.4.1-alpha.0...v1.4.1-alpha.1) (2021-03-31)


### Bug Fixes

* **client:** adjust return error pattern to throw ([884e87d](https://github.com/ulixee/secret-agent/commit/884e87db16a5706dc50416e3df0defa67f0606e2))
* **client:** fix logging dependency error ([22900c4](https://github.com/ulixee/secret-agent/commit/22900c49da47e8ce0d910c255d9b535527ce040d))
* **core:** block resources not working ([5488b34](https://github.com/ulixee/secret-agent/commit/5488b34230e85209c428469b9ed2356077443120))
* **core:** fix failing interact test ([d0993e6](https://github.com/ulixee/secret-agent/commit/d0993e6539cdb10d502e8eec396414e04f6ad03c))
* **core:** hang closing ([233ff06](https://github.com/ulixee/secret-agent/commit/233ff0678de8abd181e989ce849b21c0d9cbff6a))
* **emulate:** mask widevine checks ([65e8655](https://github.com/ulixee/secret-agent/commit/65e8655e5d906ba538f9ebc84f21f7d6a5356f47))
* **mitm:** directly handle reused socket closing ([8651445](https://github.com/ulixee/secret-agent/commit/86514453fe8e12314f61a28c7fcf1ffd673585e7))
* **mitm:** fix reusing sockets ([5d56597](https://github.com/ulixee/secret-agent/commit/5d565975554fa8d8c3603031977efe99494a19f9))
* **mitm:** invalid header char bugs ([2d794d9](https://github.com/ulixee/secret-agent/commit/2d794d928c74d36b1e8530e8350fe1aa8a51d656))
* **mitm:** store resources if tab not found ([60c76d0](https://github.com/ulixee/secret-agent/commit/60c76d0bbca07cf1d1338d2ba1593f9725beae6f))
* **puppet:** enable gpu by default ([9a06165](https://github.com/ulixee/secret-agent/commit/9a061657eaf844a385e17953cb7436181fadad6a))
* **puppet:** record logs for failing tests ([3d7ee18](https://github.com/ulixee/secret-agent/commit/3d7ee18101bf6c913438901d9191caf1116de35f))


### Features

* **handler:** re-q unstarted agents on disconnect ([b0ece5b](https://github.com/ulixee/secret-agent/commit/b0ece5bdaa203352932dd524b1eddc082df6fb31))
* **interact:** peg nodeid for interactions ([8a4db76](https://github.com/ulixee/secret-agent/commit/8a4db764b11cd9b0fae0acde44ee7887d7c9f2ef))





## [1.4.1-alpha.0](https://github.com/ulixee/secret-agent/compare/v1.4.0-alpha.1...v1.4.1-alpha.0) (2021-03-23)


### Bug Fixes

* **client:** properly handle unhandled disconnect ([e3afedd](https://github.com/ulixee/secret-agent/commit/e3afedd90f0c614dab8ed5a02ba40de013e24b1d))
* **core:** stop writing to db if it goes readonly ([9fc9e2f](https://github.com/ulixee/secret-agent/commit/9fc9e2f67ea5a5dd495fbfcb6946698c279c118c))
* **core:** type serializer, fix null headers issue ([e4d832b](https://github.com/ulixee/secret-agent/commit/e4d832b62278c67c59edb7bb6d0b2097a6b8669b))
* **emulator:** polyfill setAppBadge/clearAppBadge ([5cfa400](https://github.com/ulixee/secret-agent/commit/5cfa40082de419458656370622552c668b0a071f))
* **ghost:** fix oom error ([7ec100f](https://github.com/ulixee/secret-agent/commit/7ec100f2070223a9172855fa23cedfcc61537755))
* **mitm:** cached resources to use cached status ([26079b5](https://github.com/ulixee/secret-agent/commit/26079b5ee040efc7abbc57a422bb356f9b41a39e))
* **mitm:** empty headers bug, clean errors ([3170688](https://github.com/ulixee/secret-agent/commit/3170688287dce2cc3d431a26da027e11e33049cd))
* **mitm:** fix url error ([d53ae18](https://github.com/ulixee/secret-agent/commit/d53ae18a905fce3fea45a1e19edd9498ed4c54bd))
* **mitm:** some WHATWG urls failing to parse ([4e29bbb](https://github.com/ulixee/secret-agent/commit/4e29bbb5c88d8ba25badf38021ff9f443c32ff29))
* **puppet:** don’t emit timeouts ([1dd386f](https://github.com/ulixee/secret-agent/commit/1dd386f7cde45a66c7976a63b1e162b5b93863f1))
* **puppet:** handle crashed windows ([290e923](https://github.com/ulixee/secret-agent/commit/290e923544008c3cd84b568c2d8a7c2f0de38437))


### Features

* **client:** expose frames ([44a6b12](https://github.com/ulixee/secret-agent/commit/44a6b129fef6f541cffc24e8913fd76defcf3aef))





# [1.4.0-alpha.1](https://github.com/ulixee/secret-agent/compare/v1.4.0-alpha.0...v1.4.0-alpha.1) (2021-03-11)


### Bug Fixes

* test timeout ([b7b6af2](https://github.com/ulixee/secret-agent/commit/b7b6af2a28d349df8e7e9aed49ca3bfe67ad08e1))





# [1.4.0-alpha.0](https://github.com/ulixee/secret-agent/compare/v1.3.1-alpha.1...v1.4.0-alpha.0) (2021-03-11)


### Bug Fixes

* **client:** fix close handling ([f413ea8](https://github.com/ulixee/secret-agent/commit/f413ea8c66b0e07512a7b6fbd0d9857bebad1d7c))
* **client:** resource timeout + blank new tab ([4fdd378](https://github.com/ulixee/secret-agent/commit/4fdd3789edf9c2a7290b4deb660aa2d7194ec9c8))
* **client:** translate errors when session n/a ([6c15793](https://github.com/ulixee/secret-agent/commit/6c15793f67cadfcf7d62e270848fbef895e397af))
* **core:** exports not working <= node 14.12 ([d793601](https://github.com/ulixee/secret-agent/commit/d793601a052c243a541cf0331c79d00bc1332d1e))
* **core:** handle canceled navigation redirect ([348c058](https://github.com/ulixee/secret-agent/commit/348c05863519ad6daaf8386c35a2b021883bd386))
* **core:** try to fix tab test ([2f74a1e](https://github.com/ulixee/secret-agent/commit/2f74a1e48f2aa04d05c9826ac654de88686af597))
* **docs:** reference Chrome vs Chromium ([94226b2](https://github.com/ulixee/secret-agent/commit/94226b20aff716f150a8d1134052ddef7b188378))
* **ghost:** fix oom in bezierjs ([1d4ab06](https://github.com/ulixee/secret-agent/commit/1d4ab06c572f1d9aff7b8edd00ba9603c7da1f45))
* **mitm:** don’t let dns errors go unhandled ([c8d8ac0](https://github.com/ulixee/secret-agent/commit/c8d8ac08e9cf1923f14e47318857bccdab85504e))
* **mitm:** don’t wait for browser resources ([4c70bd5](https://github.com/ulixee/secret-agent/commit/4c70bd5ae89bf38cda80049d522e0b25f842240d)), closes [#176](https://github.com/ulixee/secret-agent/issues/176)
* **mitm:** enable cache handler for test ([79e069b](https://github.com/ulixee/secret-agent/commit/79e069b71798fd5fa53fe1927db8729a75a7e61a))
* **mitm:** handle http2 push canceled errors ([f1fbe4d](https://github.com/ulixee/secret-agent/commit/f1fbe4de5277c603af894b30a917157b39873b90))
* **mitm:** try/catch around mitm throw areas ([e58b7a2](https://github.com/ulixee/secret-agent/commit/e58b7a2ba67ab6c5a435b83fa2b69b3ecc8f3465))
* **replay:** don’t remove preserved tags ([fe023d5](https://github.com/ulixee/secret-agent/commit/fe023d5707fb9b1c7e1bed987bbde4ba0dd6511d))
* failing test ([a6ae58d](https://github.com/ulixee/secret-agent/commit/a6ae58dc02940fce6a9184d0d5adc1b2ee29bd45))
* failing test ([9064518](https://github.com/ulixee/secret-agent/commit/906451802f31f362c7e82bf2b094a03bfcf74420))
* lerna config ([77a1810](https://github.com/ulixee/secret-agent/commit/77a18100ba1e29576323b35e1e947bf83d96b5e5))
* removed unnecessary browserVersionDir in EngineFetcher ([9daa98a](https://github.com/ulixee/secret-agent/commit/9daa98a42234b27898e2e2c2bada3815a5826ba6))
* renamed some vars, removed chromium blocks, and modified BrowserFetcher ([60955b2](https://github.com/ulixee/secret-agent/commit/60955b259c15c887e20ae423ed8683caed80751d))
* test reliability ([76aea40](https://github.com/ulixee/secret-agent/commit/76aea4051f71f489a62c15385a337b17a19afaf2))
* **puppet:** extract linux chrome ([55f8ef5](https://github.com/ulixee/secret-agent/commit/55f8ef57ba410685697f5dc73f923026c8b0c4a6))
* **puppet:** no chrome launch errors to client ([1e636a6](https://github.com/ulixee/secret-agent/commit/1e636a6625c47c67ee8a4e7d5be05ce99b513a5f))


### Features

* **client:** coreHost & disconnecting errors ([aed9fc3](https://github.com/ulixee/secret-agent/commit/aed9fc3f49996a661ab6b70e5446c9442649802a)), closes [#165](https://github.com/ulixee/secret-agent/issues/165)
* **client:** waitForAllDispatchesSettled ([cf3e6b5](https://github.com/ulixee/secret-agent/commit/cf3e6b540fd312e771f72ff27a08bf3ee9f6212a))
* **puppet:** switch to chrome ([d064e53](https://github.com/ulixee/secret-agent/commit/d064e53ace2107ac95348cf721c3cc35afe07efc))
* **puppet:** unsupported linux install message ([fe6e634](https://github.com/ulixee/secret-agent/commit/fe6e63472a813c6275433b8dfb00e094c49c8a6a))
* **puppet:** update docker to for new installs ([19351b5](https://github.com/ulixee/secret-agent/commit/19351b556718161c885b5dfb12f7fa80af8daf46))
* **replay:** update for mac silicon + deps ([30ffec7](https://github.com/ulixee/secret-agent/commit/30ffec74fc06485b56344f17374a082d2055c1f1))
* **website:** blog post about chrome + atom ([b6dc12b](https://github.com/ulixee/secret-agent/commit/b6dc12b4eb008100d30c58699468b877ce1e86ff))
* **website:** blog post about chrome + atom ([5f0cafa](https://github.com/ulixee/secret-agent/commit/5f0cafa633f50aa0757dc3627ec6b06c27fd8f99))





## [1.3.1-alpha.1](https://github.com/ulixee/secret-agent/compare/v1.3.1-alpha.0...v1.3.1-alpha.1) (2021-02-19)


### Bug Fixes

* os version should fallback to major if no minor exists ([374cf76](https://github.com/ulixee/secret-agent/commit/374cf7601060350df985f2ff41bde56c6cd8b824))
* pass all node vars to CoreProcess ([821a438](https://github.com/ulixee/secret-agent/commit/821a4381e1a79717b19e1a95ce3e2bbb1cc6177c))





# [1.3.0-alpha.4](https://github.com/ulixee/secret-agent/compare/v1.3.0-alpha.3...v1.3.0-alpha.4) (2021-02-15)


### Bug Fixes

* **core:** fix core shutdown test ([28dd09a](https://github.com/ulixee/secret-agent/commit/28dd09af20572a1ac2962abcde20599f119a3508))
* **core:** only reject navigation with errors ([7e7cfd3](https://github.com/ulixee/secret-agent/commit/7e7cfd37cff860422d8c46bed90eba31652df9d5)), closes [#153](https://github.com/ulixee/secret-agent/issues/153)
* **core/client:** export usable mjs/cjs ([ca149ef](https://github.com/ulixee/secret-agent/commit/ca149efbfbdf03da0fda7d127348e5de6f2a4f8b))
* **emulate:** clean toString stack trace ([21582b3](https://github.com/ulixee/secret-agent/commit/21582b31d891d19299c22ddf30e15a6c38bf242a))
* **logger:** don’t use colors if disalbed in node ([c3af5a0](https://github.com/ulixee/secret-agent/commit/c3af5a07984865bfa6f5278fe442bea80f00166f))
* **mitm:** change log level of mitm request errors ([da9f98f](https://github.com/ulixee/secret-agent/commit/da9f98fe3df7feb79585b686ab9fe0474dea9e27))
* **puppet:** fix waiting for worker ready ([e511009](https://github.com/ulixee/secret-agent/commit/e51100900dd52c6962639bab240f1cdac24f5d50))


### Features

* **client:** add http cache and load failures ([571e64f](https://github.com/ulixee/secret-agent/commit/571e64f108df7a0cbfd32609c37ff76261014dc6))
* **emulate:** workers run stealth scripts ([e6e845e](https://github.com/ulixee/secret-agent/commit/e6e845e68654c73ddaefe2110065a20d044f773d))





# [1.3.0-alpha.3](https://github.com/ulixee/secret-agent/compare/v1.3.0-alpha.2...v1.3.0-alpha.3) (2021-02-11)


### Bug Fixes

* **core:** cancel interaction on navigate ([eaa6605](https://github.com/ulixee/secret-agent/commit/eaa6605d9325618cde2a281aa699ab4a6d82be83))
* **core:** only wait for main frame ([52d36d8](https://github.com/ulixee/secret-agent/commit/52d36d81609f65105cc30667378d67155b271f76))
* **docs:** fix port param in remote docs ([3b452d8](https://github.com/ulixee/secret-agent/commit/3b452d871e3778c6ca6fb1d19ec0b44bdbec4da7))
* **puppet:** non-popups getting opener ([e79584f](https://github.com/ulixee/secret-agent/commit/e79584f5b71557bebe86b0301a8a0e9e55d8ac8f))





# [1.3.0-alpha.2](https://github.com/ulixee/secret-agent/compare/v1.3.0-alpha.1...v1.3.0-alpha.2) (2021-02-09)


### Bug Fixes

* **blog:** fix some blog typos ([e85efb6](https://github.com/ulixee/secret-agent/commit/e85efb686a99bd1f9395e107aa528703de7b9259))
* **client:** correctly catch some canceled promise ([1d5906f](https://github.com/ulixee/secret-agent/commit/1d5906f5bff7e757bd084bb98883b56f3cf22bbe))
* **client:** fix reviving stack traces in typeson ([7a0e38b](https://github.com/ulixee/secret-agent/commit/7a0e38b6e8efd30a2d70c0c3c73d8fc121e316a9))
* **dist:** copy .mjs files properly to npm dist ([cc717e0](https://github.com/ulixee/secret-agent/commit/cc717e02ef94233ad867393640fc740b26038a95))
* **docs:** document missing props ([58e6a68](https://github.com/ulixee/secret-agent/commit/58e6a68d1d1755fe459e9a1cb1151ce959e8c143)), closes [#156](https://github.com/ulixee/secret-agent/issues/156)
* **mitm:** error reading destroyed from scoket ([f09e67f](https://github.com/ulixee/secret-agent/commit/f09e67f95ffa70c96e2c4a1c24fc4883c4aa2c50))
* **mitm:** read failed/cached browser resources ([150db8b](https://github.com/ulixee/secret-agent/commit/150db8b3785705afdc54b915684ae0c828a5ecf8))





# [1.3.0-alpha.1](https://github.com/ulixee/secret-agent/compare/v1.3.0-alpha.0...v1.3.0-alpha.1) (2021-02-06)


### Bug Fixes

* ejs modules not being copied to dist ([606102e](https://github.com/ulixee/secret-agent/commit/606102e1a671b9a3dbab16b4411af8499aed3820))
* fix some linting in DomExtractor + added it to eslint ignore ([952943f](https://github.com/ulixee/secret-agent/commit/952943ff3f7d50c475dc0c9de78bcf4b206f526a))
* pulled latest DomExtractor from DA ([a599e05](https://github.com/ulixee/secret-agent/commit/a599e058560732aa6a83f2994d4b3dc9628e2d6f))
* sessionId should be set on browserEmulator regardless of user Profile ([083260d](https://github.com/ulixee/secret-agent/commit/083260dcfd47037879bf2bec8bed56f47eae8a41))
* some tests were failing ([91217b2](https://github.com/ulixee/secret-agent/commit/91217b2e7d79a0d8a1a9b9c2e388b5dab7af3372))


### Features

* replaced chrome 80, 81, 83 emulators with more robust os-level data ([276b269](https://github.com/ulixee/secret-agent/commit/276b26923368c5ed5636f65ad14fb2b3a9f87e9e))
* **core:** friendly message setting cookies ([a9d9ecf](https://github.com/ulixee/secret-agent/commit/a9d9ecf054f6e21db037093fc255ae8fc26da3a7)), closes [#142](https://github.com/ulixee/secret-agent/issues/142)
* **core:** tweak logging for not-really-errors ([bd5f9eb](https://github.com/ulixee/secret-agent/commit/bd5f9ebf38eb58adc14542dc4e32737b0ad8ff9e))
* **replay:** don’t hang if screen not available ([22edc84](https://github.com/ulixee/secret-agent/commit/22edc8412216a50b98b7cf99f6a32e0bc4687e1d)), closes [#146](https://github.com/ulixee/secret-agent/issues/146)
* **replay:** fix ubuntu loading dashboard over replay ([a9e633a](https://github.com/ulixee/secret-agent/commit/a9e633a19099d36385cc3cc5e90108543caa9867))





# [1.3.0-alpha.0](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.5...v1.3.0-alpha.0) (2021-02-02)


### Bug Fixes

* **build:** ignore emulator json files for ts ([b64f208](https://github.com/ulixee/secret-agent/commit/b64f2087003502383643056f6db9257b98b231c8))
* **client:** allow waiting on resources ([d3414a8](https://github.com/ulixee/secret-agent/commit/d3414a8f82b3c31c012953bf739d493076f0a759))
* **client:** error handling for session connect ([82e58b8](https://github.com/ulixee/secret-agent/commit/82e58b826908d7e14d21f58673b1eb0044b4b9a2))
* **core:** elements offscreen fail isVisible ([f0042fc](https://github.com/ulixee/secret-agent/commit/f0042fc79bc8006c34c2eae408e193ad3eea7fb7))
* **core:** full close down of on premature exit ([aa53e85](https://github.com/ulixee/secret-agent/commit/aa53e85782a57da4d69f8750a5c3719c60683f5b))
* **core:** handle visible for height > innerHeight ([b7a1e65](https://github.com/ulixee/secret-agent/commit/b7a1e65dced687fb3df0677a26e6b56cc1e34c97))
* **core:** isVisible fix, scroll below 0 fix ([7c0c451](https://github.com/ulixee/secret-agent/commit/7c0c451a2bf4675fc07205649ca78bc56fe7890c))
* **emulators:** safari cookie handling fix ([3507c26](https://github.com/ulixee/secret-agent/commit/3507c2665afd6e94b5f99633e748fa4d455d81db))
* **mitm:** preflight requests not always sent ([45ebe22](https://github.com/ulixee/secret-agent/commit/45ebe224cd60c9e518139ff40786b90ee640be52))
* **puppet:** assigning wrong id to network fetches ([c4b6746](https://github.com/ulixee/secret-agent/commit/c4b674655ceff4a4642fe9aada355709dc243e22))
* **puppet:** fallback to requestid in fetch ([28ad324](https://github.com/ulixee/secret-agent/commit/28ad3242d679c8fa1d67e2f278f559a61fdd46ff))
* **puppet:** launch non-default (83) headed chrome ([84a02aa](https://github.com/ulixee/secret-agent/commit/84a02aa48db41ecb3a1e831e56a4bf1fb805486e))
* **replay:** fix replay launch in new setup on win ([add1b97](https://github.com/ulixee/secret-agent/commit/add1b97084d9d83f0cdad77362a238aeef92cf68))
* added userAgentOptions() to @BrowserEmulatorClassDecorator ([0a2187c](https://github.com/ulixee/secret-agent/commit/0a2187ca3937618aa59f87045e03c34d13ff7cf0))
* converted some props of IBrowserEmulator to optional ([8e74bed](https://github.com/ulixee/secret-agent/commit/8e74bed69d03bbc961292d4a3b89f9706cb1d555))
* emulators only had partial data ([3dd86db](https://github.com/ulixee/secret-agent/commit/3dd86db74cdc6e3e02afc7556e1ba41716c37293))
* mitm session ports were getting reused and conflicting ([0e11465](https://github.com/ulixee/secret-agent/commit/0e11465d3882234e1cc650f372155458ea8bd6e1))
* **replay:** upgrade axios (dependabot) ([2f55df9](https://github.com/ulixee/secret-agent/commit/2f55df902cd7d3cf5e542c57c7df01f869340cf8))
* added url in comments to show where darwinToMacOsVersionMap was pulled ([ed873b1](https://github.com/ulixee/secret-agent/commit/ed873b11965ab7255e32202b1b9e84d754178d89))
* allow setting SA_SHOW_REPLAY in a script ([18d63d6](https://github.com/ulixee/secret-agent/commit/18d63d640dc69e83512908bbdec1263aba87d953))
* disabled eslint rule for a failing line ([749ae1e](https://github.com/ulixee/secret-agent/commit/749ae1e65b86338ff9666b9e3e7dc9dadf114677))
* increase node memory limit for yarn lint on github ([9c8a914](https://github.com/ulixee/secret-agent/commit/9c8a914d3b4b63aaa31812e014631770fbf95977))
* tweaked a few lint issues ([ad9f17d](https://github.com/ulixee/secret-agent/commit/ad9f17da63bad824a7e2dba8d77c0ec0fe9ea9da))
* updated dom diffs to include all oses supported by browserstack ([686a2e2](https://github.com/ulixee/secret-agent/commit/686a2e2c00dd4191db79824f29ac119a1e99715e))
* updated some things to work with Slab ([51dada5](https://github.com/ulixee/secret-agent/commit/51dada5d267ec05a6dbe3d1da9f62b4f3754d5a1))
* viewports window width/height must include frame border width/height ([cca0c8e](https://github.com/ulixee/secret-agent/commit/cca0c8ec66bee1eafd7dcac2564eb8e0fc18747c))


### Features

* **client:** add ability to get agent metadata ([55df775](https://github.com/ulixee/secret-agent/commit/55df775b3b9e78db99bc726ae54a683cc701a7e2))
* **client:** add sessionid/name to logs + errors ([7d88f35](https://github.com/ulixee/secret-agent/commit/7d88f3555076647307dc1e9e6cea9b102033c756))
* **client:** built-in remote + handlers ([bfaa739](https://github.com/ulixee/secret-agent/commit/bfaa739517a458db9dd1bd6374770840eb95b847))
* **client:** coreConnection as configuration ([ac284ca](https://github.com/ulixee/secret-agent/commit/ac284cac3fa867a9623fd841edf96d04906e3072))
* **client:** export required enums and consts ([4cce3a7](https://github.com/ulixee/secret-agent/commit/4cce3a769e41bba49ad8a8bc8c83de53711f091b))
* **core:** add getComputedStyles to tab ([0e3bccd](https://github.com/ulixee/secret-agent/commit/0e3bccd9c27ac1e6b122238ca7292182c169ebe6))
* **core:** add screenshot capability ([f075f89](https://github.com/ulixee/secret-agent/commit/f075f89636edb81c4626c51929665373069de31a))
* **core:** confirm mouse clicks hit targets ([bf2b047](https://github.com/ulixee/secret-agent/commit/bf2b047ca9e49665f7f150e66780b79fd02b7972))
* **core:** convert all connections to server ([a27fafd](https://github.com/ulixee/secret-agent/commit/a27fafd9a04e52f602a557f7304164c2308006c6))
* **core:** convert closing logs to stats ([382979d](https://github.com/ulixee/secret-agent/commit/382979df1a758de82297169465be0e57c2c87b53))
* **core:** convert server to use websockets ([2d1804c](https://github.com/ulixee/secret-agent/commit/2d1804ce7521fe065c01491e3f5e084852369f55))
* **core:** merge injected scripts into core ([f674f7b](https://github.com/ulixee/secret-agent/commit/f674f7b85a9cf66dd3558d849a78f6b9aa1099dc))
* **core:** merge session-state and core ([dcc6002](https://github.com/ulixee/secret-agent/commit/dcc6002c2003d981267e51c8dacf5201fe3b9fda))
* **core:** timeouts for back/fwd/goto, add reload ([bae2a8e](https://github.com/ulixee/secret-agent/commit/bae2a8eaf20b2a855c98986d5c2c9b5e11b004ec))
* **core:** waitForLocation/Load takes a timeout ([02758c7](https://github.com/ulixee/secret-agent/commit/02758c7fc1e5394db84f91aa8235c3364b6c0692))
* **core:** waitForPaintingStable ([1955b79](https://github.com/ulixee/secret-agent/commit/1955b791ce8a7cf20a679986e63885950efa6813))
* **dns:** global cache for dns ([55f253d](https://github.com/ulixee/secret-agent/commit/55f253d9be1fb8fb9e3bd410cc6bc58bb69fedba))
* **replay:** ability to launch via bin ([518d320](https://github.com/ulixee/secret-agent/commit/518d320e157b4d28e0ce99864c4f53aa5fa439a8))
* **replay:** allow running out of a dist dir ([e5bfe21](https://github.com/ulixee/secret-agent/commit/e5bfe211e0388bd4b1be1da97356046b983b80ea))
* **replay:** convert api to use web sockets ([18c8008](https://github.com/ulixee/secret-agent/commit/18c80087d22f3ee95ee2eb5853b422219da6ceb1))
* **replay:** move to lighter semver lib ([5c4d1dc](https://github.com/ulixee/secret-agent/commit/5c4d1dcfaf4a79d6457857647203addbbda8eba5))
* **replay:** prefer local build to binary ([71589cf](https://github.com/ulixee/secret-agent/commit/71589cfc0ae8f31911e72b9f3e1fd3bcc4254c35))
* **replay:** single install of replay ([5425bee](https://github.com/ulixee/secret-agent/commit/5425bee76488ac5bff4f46d8b99eb874dd7f5a35))
* browser window size now takes into calculation os nav bars ([ab65a65](https://github.com/ulixee/secret-agent/commit/ab65a650e4b63e77ad5e165f7a60e3e024140f66))
* emulators pull roundRobinPercent from config ([2590387](https://github.com/ulixee/secret-agent/commit/2590387d4ca7f79e6916e3321b5d27e19c6a1341))
* mv renderingOptions => blockedResourceTypes ([ffa1b74](https://github.com/ulixee/secret-agent/commit/ffa1b74d0b470387ec104027667e8523a51bfa15)), closes [#113](https://github.com/ulixee/secret-agent/issues/113)
* **website:** blog post on handlers ([8024f03](https://github.com/ulixee/secret-agent/commit/8024f0343e63689afd9aba589e80816a5880f838))
* pull in os-version maps from Slab to reduce chance of stale data ([201b3c9](https://github.com/ulixee/secret-agent/commit/201b3c9d028b798ce4a88ec05fd9833c95d89a0b))
* randomize the Viewports browser positionX/Y ([66c1f4a](https://github.com/ulixee/secret-agent/commit/66c1f4a89a434352ae5c8add46481c1f6d28f03f))
* updated emulator data to handle more runtime OSes ([f57f3b5](https://github.com/ulixee/secret-agent/commit/f57f3b5f1b18bcdaf56bf7e9a4475bf2e0c0b1c6))


### BREAKING CHANGES

* renames “renderingOptions” to “blockedResourceTypes”. Default is now “None”





# [1.2.0-alpha.5](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.4...v1.2.0-alpha.5) (2020-12-29)


### Bug Fixes

* **emulate-browsers:** fix cross frame tostring ([27a69d9](https://github.com/ulixee/secret-agent/commit/27a69d9703766d653c0e841e6d69458e643faba2))
* **mitm:** bug with duplicate header on response ([ba3c015](https://github.com/ulixee/secret-agent/commit/ba3c015db4f62af5c7e77d6694fec9ad7679882c)), closes [#111](https://github.com/ulixee/secret-agent/issues/111)
* **puppet:** workers not tracking devtools calls ([b339758](https://github.com/ulixee/secret-agent/commit/b339758c8bb5b2076f1337dee3d0deefaf3fb7ad))





# [1.2.0-alpha.4](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.3...v1.2.0-alpha.4) (2020-12-22)


### Bug Fixes

* **replay:** replay crashes on win10 during load ([b6e517b](https://github.com/ulixee/secret-agent/commit/b6e517bcd6a66bf206c8a2436374cca401f5b00d))
* **replay:** shutting down before example load ([937fd9b](https://github.com/ulixee/secret-agent/commit/937fd9b3452053687c13760c643141b7eab6534a))





# [1.2.0-alpha.3](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.2...v1.2.0-alpha.3) (2020-12-16)


### Bug Fixes

* **mitm:** bubble proxy errors properly to client ([b6a72f5](https://github.com/ulixee/secret-agent/commit/b6a72f59ef8e7739654ab82b170aa0e15d38ebd0)), closes [#98](https://github.com/ulixee/secret-agent/issues/98)
* **replay:** multiple sessions showing incorrectly ([20ba30c](https://github.com/ulixee/secret-agent/commit/20ba30caebcef42de65dee18e6b82d92c7193d9c))


### Features

* **client:** update awaited dom to 1.1.8 ([a1b9b68](https://github.com/ulixee/secret-agent/commit/a1b9b68e735ee54ceaef3436c43df0d0744c8f47))





# [1.2.0-alpha.2](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.1...v1.2.0-alpha.2) (2020-12-01)


### Bug Fixes

* **core:** don’t wait to scroll past bottom ([9f8877b](https://github.com/ulixee/secret-agent/commit/9f8877b0b78924c8cf364b891ec2ed0ca6167d92))
* **core:** fix errors on goto bubbling up ([30d4208](https://github.com/ulixee/secret-agent/commit/30d4208c079e171fd6e0640810a4812e0a9a3d59))
* **docs:** secret agent.md url broken ([167fe5a](https://github.com/ulixee/secret-agent/commit/167fe5a37b7f32257b59ddd38e5142728ffc768c))
* **emulate-humans:** fix some tests ([b1e05d7](https://github.com/ulixee/secret-agent/commit/b1e05d79168fdf60f4ba6c63b8b74441c5c52f56))
* **eslint:** add return types to client code ([c2e31cc](https://github.com/ulixee/secret-agent/commit/c2e31ccba4974f2bda269e77e6df9b82a2695d4f))
* **mitm:** remove auth as separate proxy param ([ec14b30](https://github.com/ulixee/secret-agent/commit/ec14b302ed6389769b61e77337ba9fe873a647ed))
* **mitm-socket:** fix cpu spiking sockets ([b71e141](https://github.com/ulixee/secret-agent/commit/b71e14158c1bb948e9ce33abf01b4522930caafe))
* **replay:** fix stalling loads ([7ca1dbd](https://github.com/ulixee/secret-agent/commit/7ca1dbd91e59d5c5d6812ba62bec517f746b2374))
* don’t use vertical screen orientations ([7121e94](https://github.com/ulixee/secret-agent/commit/7121e940e331e8a15fa9b67dfc3b3d0322ddb161))


### Features

* **proxy:** configure proxy via client + socks5 ([880c938](https://github.com/ulixee/secret-agent/commit/880c93803bebc78b835a8f2fb5133d633a315337))





# [1.2.0-alpha.1](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.0...v1.2.0-alpha.1) (2020-11-20)


### Bug Fixes

* emulators should not use accept-language values from json if using custom locale ([fc00660](https://github.com/ulixee/secret-agent/commit/fc0066009a95bba60df2d7de6ed9a5435a807d4b))
* emulators were failing some double-agent tests ([5ae4f55](https://github.com/ulixee/secret-agent/commit/5ae4f5507662ed91d19086d9dbab192e50a8f5c5))
* unwind some dependencies ([240bea6](https://github.com/ulixee/secret-agent/commit/240bea6ac7cb87bfcccbc56fb54043f5c2ff7b4b))


### Features

* **human-emulators:** ghost emulator ([70bcf27](https://github.com/ulixee/secret-agent/commit/70bcf273a2e995f8168dced9797d441b6eaec80b))





# [1.2.0-alpha.0](https://github.com/ulixee/secret-agent/compare/v1.1.0-alpha.1...v1.2.0-alpha.0) (2020-11-11)


### Bug Fixes

* **emulator:** bug fix for Error.toString ([d23704a](https://github.com/ulixee/secret-agent/commit/d23704a3731d2f5617d0493064c8c9593793b4df))


### Features

* **awaited-dom:** documentation for props ([029a1f5](https://github.com/ulixee/secret-agent/commit/029a1f5b10cc13119d4bb808d35f80cce4aeb3dd))
* **browser-emulators:** refactor emulator filenames ([b5da042](https://github.com/ulixee/secret-agent/commit/b5da0426e39aad64178659cc93f441f781f917ba))
* **core:** store data files in a single location ([c3299b6](https://github.com/ulixee/secret-agent/commit/c3299b6a0dc2fc42d7a7df3746ab34c2d8b15ea0))





# [1.1.0-alpha.1](https://github.com/ulixee/secret-agent/compare/v1.1.0-alpha.0...v1.1.0-alpha.1) (2020-11-05)


### Bug Fixes

* **mitm:** should add host to http1 headers ([b655ea9](https://github.com/ulixee/secret-agent/commit/b655ea925b531a53bb9b55271df5150881783bcf))


### Features

* **client:** get/set/delete cookies + domstorage ([2e2de6b](https://github.com/ulixee/secret-agent/commit/2e2de6b9f2debf5eadf54b03b3f8d9db7cace269))
* **client:** split out ISecretAgentClass ([8765900](https://github.com/ulixee/secret-agent/commit/876590001e62598daaad71d9a236e94600717c72))





# [1.1.0-alpha.0](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.21...v1.1.0-alpha.0) (2020-11-03)


### Bug Fixes

* **puppet:** incorrect reuse of executionContextId ([e5d8f8d](https://github.com/ulixee/secret-agent/commit/e5d8f8d1e90c7cebefae51b570ddb743ea8f39fe))


### chore

* **client:** merge Browser/User into SecretAgent ([364ed8a](https://github.com/ulixee/secret-agent/commit/364ed8ab9c16cdf40c8ad1f151de4b06efcc557d))


### BREAKING CHANGES

* **client:** this change modifies the core interface for interacting with SecretAgent, as createBrowser is removed.





# [1.0.0-alpha.21](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.20...v1.0.0-alpha.21) (2020-11-02)


### Bug Fixes

* **core:** improved waitForElement ([4d139b3](https://github.com/ulixee/secret-agent/commit/4d139b3aa920dc400691eb035f61936948e187b0))
* **mitm:** cache content-type ([68d7384](https://github.com/ulixee/secret-agent/commit/68d7384305e46106830f1a548d6de77c7b9deb07))
* **replay:** cross domain iframes ([db65711](https://github.com/ulixee/secret-agent/commit/db6571120ccf1c5fa59c091bde6d752706c5c2e6))
* **replay:** loading resources ([747f4ff](https://github.com/ulixee/secret-agent/commit/747f4ff24ba7ef1b162f0a2a5f1327ebd39cf18e))
* bugs in replay ([2bf8808](https://github.com/ulixee/secret-agent/commit/2bf8808ae115ba9ea9f3cc64f3eba673fcb311aa))


### Features

* **core:** improve jspath waitForElement perf ([435576a](https://github.com/ulixee/secret-agent/commit/435576a47a31dfedcfd3307c090e23b63998c716))
* **locale:** add locale emulation + tests ([57cc7ff](https://github.com/ulixee/secret-agent/commit/57cc7ff8c342dc27a477b16cca066dffb9687e2f))
* **replay:** add support for iframe and shadows ([0978fd5](https://github.com/ulixee/secret-agent/commit/0978fd55802ebf4285a48ef1ce0d208e2d21aeba))
* **replay:** record heirarchy of elements ([89310c0](https://github.com/ulixee/secret-agent/commit/89310c0ba186d02e01b246dfa9c56f89d7a651af))
* **replay:** set screen viewport ([f818ff5](https://github.com/ulixee/secret-agent/commit/f818ff5577d49d284a4116d328e78dc1d235824a))
* **session:** support CSSOM for recorder/playback ([0cbe7c8](https://github.com/ulixee/secret-agent/commit/0cbe7c81aa6e6111a82db4bcbff5bf2efbc6d5b9))
* **session:** track frame dom node ids ([a41d678](https://github.com/ulixee/secret-agent/commit/a41d6786d6fd10a386d9c2739713a26b6063b127))
* **session-state:** record and playback shadows ([508fd39](https://github.com/ulixee/secret-agent/commit/508fd3988eb5e25d2c11a713a99f3f6a5a78ed5b))





# [1.0.0-alpha.20](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.19...v1.0.0-alpha.20) (2020-10-23)


### Bug Fixes

* **mitm:** tweak stored msg for connect errors ([6c819d5](https://github.com/ulixee/secret-agent/commit/6c819d5cd5315028a8f6b49337d2beed8aef20dd))
* order of session closing ([046243b](https://github.com/ulixee/secret-agent/commit/046243b7b2f84f633674dbe23122eb1d58ca431c))
* **puppet:** stabilize chained nav ([7a99f69](https://github.com/ulixee/secret-agent/commit/7a99f693da6f03c6c77d2b604e55b6f70dd25adc))
* mitmRequestAgent tests ([d93b4fa](https://github.com/ulixee/secret-agent/commit/d93b4fa72bd0aceea70079777f1f6c3bdcfae630))


### Features

* **client:** add scrollTo shortcut ([a1613f1](https://github.com/ulixee/secret-agent/commit/a1613f15907c6eaea30e597bdabc3238eb7c96c1))
* **mitm:** dns over tls lookups ([8797847](https://github.com/ulixee/secret-agent/commit/8797847fd5388ee6e4165c02390d45587799edbf))
* **mitm:** store ca/keys in network.db ([fd69f97](https://github.com/ulixee/secret-agent/commit/fd69f97cee898720d5e5a5b30e0697b728c6e8d4))
* **puppet:** use mouse wheel events ([1efea8a](https://github.com/ulixee/secret-agent/commit/1efea8abcf094d8c6644ecdedd5f0069b2fd909c))
* **session-state:** record devtools logs ([784da7f](https://github.com/ulixee/secret-agent/commit/784da7f7728671485bce55b877fa350981c88ea2))
* **session-state:** record mitm resource states ([08976df](https://github.com/ulixee/secret-agent/commit/08976dfa95f3b2629aedaca3002cc07b97e5bd2e))





# [1.0.0-alpha.19](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.18...v1.0.0-alpha.19) (2020-10-13)


### Bug Fixes

* **replay:** install script broke ([b79c572](https://github.com/ulixee/secret-agent/commit/b79c572883a8c7b0240c97c13ca1d0cf9ef8cc43))





# [1.0.0-alpha.18](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.17...v1.0.0-alpha.18) (2020-10-13)


### Bug Fixes

* **replay:** bug with monorepo replay versions ([05aa786](https://github.com/ulixee/secret-agent/commit/05aa786527d0b65d7097cbba623633294c615627))





# [1.0.0-alpha.17](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.16...v1.0.0-alpha.17) (2020-10-13)


### Bug Fixes

* publish latest replay ([62d1ef0](https://github.com/ulixee/secret-agent/commit/62d1ef046bccb2d90df206d5425999a80b7d4fd8))





# [1.0.0-alpha.16](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.15...v1.0.0-alpha.16) (2020-10-13)


### Bug Fixes

* extend tests for emulate test ([71764b7](https://github.com/ulixee/secret-agent/commit/71764b7c52b46d47e3a0334c94a97429ad375703))
* **core:** dont close client on promise rejections ([37f1169](https://github.com/ulixee/secret-agent/commit/37f11690131c4bf08e481c803cdb3fba68c7985f))
* **core:** wait for location change on new tab ([0c70d6e](https://github.com/ulixee/secret-agent/commit/0c70d6e7553025222b9fe4139407be4d69ee20b9))
* **mitm:** catch exceptions on closed h2 session ([6b5c7d4](https://github.com/ulixee/secret-agent/commit/6b5c7d455c06d21f59ad4674199d76d73a5373d2))
* **mitm:** don’t send duplicated headers to h2 ([ece1b1f](https://github.com/ulixee/secret-agent/commit/ece1b1fe421d2b7aa2728f1031b30c5efa1e4948))
* **mitm:** duplicate if-none-match header ([1cbe1f1](https://github.com/ulixee/secret-agent/commit/1cbe1f1cecacaac9c99af040ddbf39c72c959a4a))
* **replay:** fix command overlays ([926dcba](https://github.com/ulixee/secret-agent/commit/926dcba7e10635c3917ffa9dca72c6fb6fe29016))


### Features

* **client:** xpath support, array index access ([c59ccbc](https://github.com/ulixee/secret-agent/commit/c59ccbc47eda9c61c360f04beb00a6a8e032f31e))
* **core:** isElementVisible - can user see elem ([213c351](https://github.com/ulixee/secret-agent/commit/213c351cbc9bf4c6e8852fe0694bfafcdd602cbe))





# [1.0.0-alpha.15](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.14...v1.0.0-alpha.15) (2020-10-06)


### Bug Fixes

* **mitm:** filter response headers ([828dc94](https://github.com/ulixee/secret-agent/commit/828dc94bdb880713567fb2629eec79c2c6f0d6ed))





# [1.0.0-alpha.14](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.13...v1.0.0-alpha.14) (2020-10-06)


### Bug Fixes

* **client:** don’t shutdown on rejected promises ([86a331b](https://github.com/ulixee/secret-agent/commit/86a331bede88daca8b17c079f23910ff776fb4c4))
* **mitm:** change headers after alpn is set ([a21d4ca](https://github.com/ulixee/secret-agent/commit/a21d4cab3f3adcc9e413f976ac6864ae85cb053e))
* **mitm:** push headers + header arrays ([f411b93](https://github.com/ulixee/secret-agent/commit/f411b936c98219d1b57740f3504322fd5de6037c))
* **replay:** fix http2 push headers ([755667f](https://github.com/ulixee/secret-agent/commit/755667f4ec4b32c9e22b2541fa7ef08aa613d063))
* **replay:** resetting navigation needs to clear ([daf9431](https://github.com/ulixee/secret-agent/commit/daf94318029f2d6ddf0ce88686f7748bc1d28f0c))
* **replay:** use shadow dom for replay elements ([b19b382](https://github.com/ulixee/secret-agent/commit/b19b3820eb93fd7302e7fd416dde6e5aad988209))







**Note:** Version bump only for package @secret-agent/monorepo





# [1.0.0-alpha.12](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.11...v1.0.0-alpha.12) (2020-09-29)


### Bug Fixes

* **puppet:** chrome 80 test flakiness ([9f16cd1](https://github.com/ulixee/secret-agent/commit/9f16cd1993e0bd038f748b2b986bd69a311b11f6))
* lint and puppet test chrome 80 ([0ce09ac](https://github.com/ulixee/secret-agent/commit/0ce09ac71e3f9a9a802ba90f9c7aab9021f07e5c))
* refactor to pause debugger on attach ([63a9bd1](https://github.com/ulixee/secret-agent/commit/63a9bd125e7f334a85a2dedc2490f4e66366ea6d))
* **mitm:** simplify errors, handle not caught ([27820ac](https://github.com/ulixee/secret-agent/commit/27820ac784771b4c58e3f07bd96f15209f82f28c))
* **replay:** playback on page 2 ([005bed8](https://github.com/ulixee/secret-agent/commit/005bed89efd198b434e947d21390678eceef5eee))


### Features

* **core:** back/forward api ([805af3d](https://github.com/ulixee/secret-agent/commit/805af3d48822c1306b73f5c084d65b0855819213)), closes [#32](https://github.com/ulixee/secret-agent/issues/32)
* **docs:** Update documentation ([2295725](https://github.com/ulixee/secret-agent/commit/2295725dceed7026bee9a4a291d551c75fe5279f)), closes [#56](https://github.com/ulixee/secret-agent/issues/56)
* **mitm:** switch mitm to use authorization ([fade6e8](https://github.com/ulixee/secret-agent/commit/fade6e81d58d947c03a7b54e37a887bbc0bba5a2))
* **puppet:** add puppet interfaces abstraction ([69bae38](https://github.com/ulixee/secret-agent/commit/69bae38a03afaae3455de2a4928abd13031af662))
* **puppet:** import playwright tests ([e2b9bf5](https://github.com/ulixee/secret-agent/commit/e2b9bf546af1ed899a01f460977e362b676c02e1))
* **replay:** remove ui tabs; nav to session tabs ([df8e21c](https://github.com/ulixee/secret-agent/commit/df8e21cefc71ff6ad8db7d1498a1352cc71618a9))
* **replay:** spawned child tabs ([8ae0d75](https://github.com/ulixee/secret-agent/commit/8ae0d754a8e263a6cae20815338532da84906a7b))
* **replay:** split session state by tab ([9367f2d](https://github.com/ulixee/secret-agent/commit/9367f2d8796fda709bc8185374a5e07d4b6f78ab))
* import and shrink puppeteer ([b1816b8](https://github.com/ulixee/secret-agent/commit/b1816b8f7b1a60edd456626e3c818e4ebe3c022f))
* wait for tab ([0961e97](https://github.com/ulixee/secret-agent/commit/0961e97ecc4418c21536be92e1f3787aa1692117))





# [1.0.0-alpha.11](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.10...v1.0.0-alpha.11) (2020-08-25)


### Bug Fixes

* copy engine to deployed emulators ([98ea24c](https://github.com/ulixee/secret-agent/commit/98ea24ca25d0cebbc1b6f6d572134e63318ce941))





# [1.0.0-alpha.10](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.9...v1.0.0-alpha.10) (2020-08-25)


### Bug Fixes

* dependency/path issues ([17a6813](https://github.com/ulixee/secret-agent/commit/17a681335a3cd28cf7a668f5efd58229fa1cc59e))





# [1.0.0-alpha.9](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.8...v1.0.0-alpha.9) (2020-08-25)


### Bug Fixes

* humanoid keys => ids ([a30652e](https://github.com/ulixee/secret-agent/commit/a30652e5e664955e2f337799a986447e18f25f3a))
* **emulators:** wait for doc element ([c67fbf8](https://github.com/ulixee/secret-agent/commit/c67fbf8cc089881a2bf4a5def83dcac67630e4f2))
* **mitm-socket:** chrome 83 tls signature ([a699212](https://github.com/ulixee/secret-agent/commit/a6992121ba7a7ee8e4f42ca1f78c4f1335c281b7)), closes [#48](https://github.com/ulixee/secret-agent/issues/48) [#23](https://github.com/ulixee/secret-agent/issues/23)
* **replay:** fix realtime not loading correctly ([29ff447](https://github.com/ulixee/secret-agent/commit/29ff4471073a15505d27d5453cb1c13daf824f83))
* **replay:** fix rendering doctype + svg ([ac36c79](https://github.com/ulixee/secret-agent/commit/ac36c791c9d3611874900c65e8180b7daa1ed232))
* vue structure for replay ([0e38bfa](https://github.com/ulixee/secret-agent/commit/0e38bfa5f16c63a7900136e2300214bda395a5cf))


### Features

* **ci:** windows tests ([fd5e9db](https://github.com/ulixee/secret-agent/commit/fd5e9dbd2bdd1ac4fcba94f46e8cba4eb2ce7319))
* **core:** enhance logs ([a5b6d58](https://github.com/ulixee/secret-agent/commit/a5b6d58a7fbf74415d7094b374f040ab1ca2890a))
* **emulators:** add windows runtime polyfills ([51ebb11](https://github.com/ulixee/secret-agent/commit/51ebb1107ff42f19a453a268c243b19c2d0f2644))
* **emulators:** enable multi-engine support ([1e008c9](https://github.com/ulixee/secret-agent/commit/1e008c9fe26c977ebf85c665d0891023342a58b5))
* **mitm:** support push streams ([1b2af06](https://github.com/ulixee/secret-agent/commit/1b2af0655445929ac1f4fb8dcac011b9623a75d4))
* **replay:** stream data and simplify tick tracker ([91c350c](https://github.com/ulixee/secret-agent/commit/91c350cdbf9f99c19754fbb5598afe62a13fb497))
* restructure frontend to match vue project ([f3348a0](https://github.com/ulixee/secret-agent/commit/f3348a01650e2747a26fa0b2ab9bd4c082300f37))





# [1.0.0-alpha.8](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.6...v1.0.0-alpha.8) (2020-08-05)


### Bug Fixes

* **emulator-plugins:** include origin for cors ([b1449c1](https://github.com/ulixee/secret-agent/commit/b1449c1233dc692ccfc68d3b81070e5ff7b9fcba))
* **replay:** handle frames and page source changes ([fc703d5](https://github.com/ulixee/secret-agent/commit/fc703d5181eb961307b44553aa02a62f4faf98c0))
* circleci configs ([7d8e213](https://github.com/ulixee/secret-agent/commit/7d8e213032baa58a14d9f9eb6f161b4b2996b5c0))
* pool socket connections per origin ([0075f18](https://github.com/ulixee/secret-agent/commit/0075f18a64a2761f0979c072e42958002664b2df))
* **ci:** circle ci fixes ([24596b5](https://github.com/ulixee/secret-agent/commit/24596b5b8903d4857e60aac964a1c7f5e43731c6))
* **core:** core should autoclose if not started ([8d46a77](https://github.com/ulixee/secret-agent/commit/8d46a775573733aa53cef1723fb71d60485fae9f)), closes [#41](https://github.com/ulixee/secret-agent/issues/41)
* **mitm:** windows sockets ([dc3cf7d](https://github.com/ulixee/secret-agent/commit/dc3cf7df9dc6ad829ed21323cb8a7ab6a2cbf9b7))
* **replay:** fix launch path to replay ([8d7059b](https://github.com/ulixee/secret-agent/commit/8d7059b476ea65b440b18f6e8fe59ecc6ba95bd3))
* **socket:** http2 requests not reusing sockets ([3cbf853](https://github.com/ulixee/secret-agent/commit/3cbf8531589536c763525086cfea407c3435ca9b))
* use os tmp directory ([e1f5a2b](https://github.com/ulixee/secret-agent/commit/e1f5a2b7e63470b626ed906170b5c0337f5e0c43))
* windows tests ([c2943e8](https://github.com/ulixee/secret-agent/commit/c2943e844d53c11f829baed60c449604e81544c8))


### Features

* **mitm:** record blocked and cached http ([bd47738](https://github.com/ulixee/secret-agent/commit/bd47738e010c962e529a048d4ee33211d67a6d8f))
* **replay:** fix picker ([50d7885](https://github.com/ulixee/secret-agent/commit/50d7885f836067d51dc1ef50b41376cd9e3b9508))
* **replay:** replay individual ticks on interval ([e1c29f4](https://github.com/ulixee/secret-agent/commit/e1c29f443169ca4d141dcd0943ae8b493b31d6c8))
* **replay:** split app/replay in electron backend ([3b66eec](https://github.com/ulixee/secret-agent/commit/3b66eec372900e764872857b67f80817f4ba2b9e))
* **session-state:** capture requests before send ([9607793](https://github.com/ulixee/secret-agent/commit/960779370fa439d1c173e855bb8bdf907de9abc6))
* circle-ci fixes ([aac9a30](https://github.com/ulixee/secret-agent/commit/aac9a30a3d9b6352e2e845cc2cd4ac6eca6bdd7a))





# [1.0.0-alpha.7](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.6...v1.0.0-alpha.7) (2020-07-27)


### Bug Fixes

* **ci:** circle ci fixes ([24596b5](https://github.com/ulixee/secret-agent/commit/24596b5b8903d4857e60aac964a1c7f5e43731c6))
* windows tests ([c2943e8](https://github.com/ulixee/secret-agent/commit/c2943e844d53c11f829baed60c449604e81544c8))
* **mitm:** windows sockets ([dc3cf7d](https://github.com/ulixee/secret-agent/commit/dc3cf7df9dc6ad829ed21323cb8a7ab6a2cbf9b7))
* **replay:** fix launch path to replay ([8d7059b](https://github.com/ulixee/secret-agent/commit/8d7059b476ea65b440b18f6e8fe59ecc6ba95bd3))
* use os tmp directory ([e1f5a2b](https://github.com/ulixee/secret-agent/commit/e1f5a2b7e63470b626ed906170b5c0337f5e0c43))


### Features

* circle-ci fixes ([aac9a30](https://github.com/ulixee/secret-agent/commit/aac9a30a3d9b6352e2e845cc2cd4ac6eca6bdd7a))





# [1.0.0-alpha.6](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.5...v1.0.0-alpha.6) (2020-07-22)


### Bug Fixes

* lerna packages ([92798e8](https://github.com/ulixee/secret-agent/commit/92798e8c9a017754ec86edf3dfe09de90828cb00))
* packaging issues with mitm and replay ([520a912](https://github.com/ulixee/secret-agent/commit/520a912d50b935270b75f2d6ef1faf5fed796e85))





# [1.0.0-alpha.5](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.4...v1.0.0-alpha.5) (2020-07-21)


### Bug Fixes

* **replay:** fix replay api usage ([c54fe64](https://github.com/ulixee/secret-agent/commit/c54fe64b710519088cda4638c7ad2b16a5313e13))





# [1.0.0-alpha.4](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.3...v1.0.0-alpha.4) (2020-07-20)


### Bug Fixes

* **replay:** cover last tick on playbar ([baf12e7](https://github.com/ulixee/secret-agent/commit/baf12e795fade634e60c64a342ea339ac6e8aa5c))
* **replay:** record close date when errors occcur ([2ce94dd](https://github.com/ulixee/secret-agent/commit/2ce94dd694bba172028e8b7b00f0b3e0df0e0163)), closes [#31](https://github.com/ulixee/secret-agent/issues/31)
* change shared package names ([d6181a7](https://github.com/ulixee/secret-agent/commit/d6181a75a0387797177eb9aa2f71553bb7d31432))
* publish README.md with next build ([4c8b942](https://github.com/ulixee/secret-agent/commit/4c8b9428616c743a1282ad2f67a42ed74a3ebd60))


### Features

* **replay:** add mouse/focus/scroll events ([efec55c](https://github.com/ulixee/secret-agent/commit/efec55cf093bd4207164abd304a64f73620c45a9))
* **replay:** add session logs, detect errors ([f1865c0](https://github.com/ulixee/secret-agent/commit/f1865c0aef38f6722bbcdee0244288f0f6040c5a)), closes [#31](https://github.com/ulixee/secret-agent/issues/31)
* **replay:** autoplay replay ([bd13ef5](https://github.com/ulixee/secret-agent/commit/bd13ef56728d4582a3e4827e21f1688e6269fbb2))
* **replay:** show commands in playbar ([58b9f7a](https://github.com/ulixee/secret-agent/commit/58b9f7ac153480382cbd2f4c2f00aec64e7e852b))
* **replay:** start api from process ([403716b](https://github.com/ulixee/secret-agent/commit/403716b3ba853c67ef15868fd6fb9fe1f60dbc1f))
* flatten shared workspaces ([d53da16](https://github.com/ulixee/secret-agent/commit/d53da165d649163dcb724225a2ea43ce88d7eacc))





# 1.0.0-alpha.3 (2020-07-07)


### Bug Fixes

* **mitm:** small tweak for mitm tests hanging ([c969870](https://github.com/ulixee/secret-agent/commit/c969870dc2f86fc107f5cc9b342b36b831ac906a))
* **session-state:** Improve page recorder perf ([14f78b9](https://github.com/ulixee/secret-agent/commit/14f78b9ede550ded32594dc0a773cc880bf02783)), closes [#8](https://github.com/ulixee/secret-agent/issues/8)
* .gitignore was ignoring files that were needed for website ([4b9a2e4](https://github.com/ulixee/secret-agent/commit/4b9a2e4d12c88a44a78c39c0872556990cb1bb74))
* mitm timing out large bodies ([d38e78f](https://github.com/ulixee/secret-agent/commit/d38e78ff0536996eefa32eb6aace848a06350f53)), closes [#8](https://github.com/ulixee/secret-agent/issues/8)


### Features

* **dist:** improve packaging for double agent ([df195b6](https://github.com/ulixee/secret-agent/commit/df195b630b90aea343e4bd3005d41b34c4d5431a))
* **emulators:** Emulator plugins - set agent ([e53cedb](https://github.com/ulixee/secret-agent/commit/e53cedbfca077239d36116f22d5be2d1ab9ec7a3)), closes [#8](https://github.com/ulixee/secret-agent/issues/8)
* **emulators:** improve page logging ([cb73806](https://github.com/ulixee/secret-agent/commit/cb73806408ef7c235e4ff70539c8cc49e5cd5d90))





# 1.0.0-alpha.2 (2020-06-27)


### Bug Fixes

* Emulator plugin referencing relative paths ([f26feab](https://github.com/ulixee/secret-agent/commit/f26feab5899fa11e73ad55d6239912b798aa0e79))
* missing dependencies ([67504f0](https://github.com/ulixee/secret-agent/commit/67504f0f070f35ded261ec3c9734d60422b75a96))





# 1.0.0-alpha.1 (2020-06-27)


### Bug Fixes

* Emulator plugin referencing relative paths ([f26feab](https://github.com/ulixee/secret-agent/commit/f26feab5899fa11e73ad55d6239912b798aa0e79))





# 1.0.0-alpha.0 (2020-06-27)

**Note:** Version bump only for package secret-agent
