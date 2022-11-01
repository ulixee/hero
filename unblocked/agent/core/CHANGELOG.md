# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.0.0-alpha.12](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.11...v2.0.0-alpha.12) (2022-10-31)


### Bug Fixes

* **mitm:** try to handle socket timeouts ([27adbb0](https://github.com/ulixee/unblocked/commit/27adbb0f27e7b6a2efab156c1221201c84d3d85e))


### Features

* **core:** convert to use .env.defaults files ([f2f0832](https://github.com/ulixee/unblocked/commit/f2f083289c76bd7f544cb7048402761d5288febc))





# [2.0.0-alpha.11](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.10...v2.0.0-alpha.11) (2022-10-03)


### Bug Fixes

* default chrome not working in tests ([f100624](https://github.com/ulixee/unblocked/commit/f100624f272361e330c2e436e1ea77130ba35d07))





# [2.0.0-alpha.10](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.9...v2.0.0-alpha.10) (2022-08-31)


### Bug Fixes

* **core:** don’t log no-resource if mitm disabled ([3b168fe](https://github.com/ulixee/unblocked/commit/3b168febb455dc8e6ea5584f5a12b5fb75bc1144))
* **core:** force x86 chrome on m1 ([630b36d](https://github.com/ulixee/unblocked/commit/630b36dc8ddbc2f508b458030c54bc9330d785ec))





# [2.0.0-alpha.9](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.7...v2.0.0-alpha.9) (2022-08-16)


### Bug Fixes

* **core:** fileprompt not working after nav ([7e7ad40](https://github.com/ulixee/unblocked/commit/7e7ad401d03e68c9e54f15bf58511be9a65f7eae))


### Features

* **core:** improve error when browser can’t open ([a4089df](https://github.com/ulixee/unblocked/commit/a4089df616679075cafbc1285c71d5388cf63ed9))
* **mitm:** cleanup sockets ([abcfc61](https://github.com/ulixee/unblocked/commit/abcfc618e66ea5dbc42bf7144216482d11666d10))
* **mitm:** keep error handlers ([ce45b78](https://github.com/ulixee/unblocked/commit/ce45b78e63a977ef1e249c19b2f0efcbe205ed39))





# [2.0.0-alpha.8](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.7...v2.0.0-alpha.8) (2022-08-16)


### Bug Fixes

* **core:** fileprompt not working after nav ([7e7ad40](https://github.com/ulixee/unblocked/commit/7e7ad401d03e68c9e54f15bf58511be9a65f7eae))


### Features

* **core:** improve error when browser can’t open ([a4089df](https://github.com/ulixee/unblocked/commit/a4089df616679075cafbc1285c71d5388cf63ed9))
* **mitm:** keep error handlers ([ce45b78](https://github.com/ulixee/unblocked/commit/ce45b78e63a977ef1e249c19b2f0efcbe205ed39))





# [2.0.0-alpha.7](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.6...v2.0.0-alpha.7) (2022-07-26)

**Note:** Version bump only for package @unblocked-web/agent





# [2.0.0-alpha.6](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.5...v2.0.0-alpha.6) (2022-07-13)


### Bug Fixes

* **core:** handle evaluate with no frame context ([c65e066](https://github.com/ulixee/unblocked/commit/c65e0664ec1469a790431cbb3c63ea5e1c05e431))
* remove extraneous logging and nav ([91c641c](https://github.com/ulixee/unblocked/commit/91c641c756658fbd8355ea164213657235f43127))





# [2.0.0-alpha.5](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.4...v2.0.0-alpha.5) (2022-06-28)


### Bug Fixes

* **core:** allow navigation to about:blank ([d3c4c1b](https://github.com/ulixee/unblocked/commit/d3c4c1b36b9870bbf3b5ff28ab5c72929397985b))
* **core:** not properly attaching to devtools ([ca655e7](https://github.com/ulixee/unblocked/commit/ca655e7ba7c204372d2b2544f8a3b8dd98ac5b29))
* **core:** shadow dom clicks not working ([7283528](https://github.com/ulixee/unblocked/commit/7283528b305b772addb9f3e78dd7ef52faa7efa2))
* test ([6c39728](https://github.com/ulixee/unblocked/commit/6c39728283d4a3b60f48ac367f520adcaa1c21f6))
* update lint ([70abdc7](https://github.com/ulixee/unblocked/commit/70abdc7ec18975f965ea638dfd0d91fae60257eb))


### Features

* **core:** add dom overrides fn ([b6d0243](https://github.com/ulixee/unblocked/commit/b6d0243b0d8eeaa5155c2a6942ad2e3f572c07d7))





# [2.0.0-alpha.4](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.3...v2.0.0-alpha.4) (2022-06-10)

**Note:** Version bump only for package @unblocked-web/agent





# [2.0.0-alpha.3](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.2...v2.0.0-alpha.3) (2022-06-09)


### Bug Fixes

* cross domain cookies ([55b33c5](https://github.com/ulixee/unblocked/commit/55b33c5cf0d5cf998d22cabdf750d38a55f6183e))
* disableMitm setting broken ([2e7a9e0](https://github.com/ulixee/unblocked/commit/2e7a9e0fd9559d3fdd73b065905dea2a74d2501d))
* lint issue ([443dd3b](https://github.com/ulixee/unblocked/commit/443dd3b23d3748d414ec827b84d338dd55a5042c))
* **mitm-socket:** alps TLS extension ([aac86f3](https://github.com/ulixee/unblocked/commit/aac86f372cc55dbf28b89164b1c1559f2829c542))





# [2.0.0-alpha.2](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.1...v2.0.0-alpha.2) (2022-05-19)


### Features

* add option to keep resource bodies ([3db2900](https://github.com/ulixee/unblocked/commit/3db2900efd02eb56e95028129faf970643913bb1))





## [1.6.4](https://github.com/ulixee/agent/compare/v1.6.3...v1.6.4) (2022-01-24)

**Note:** Version bump only for package @unblocked-web/agent-core





## [1.6.3](https://github.com/ulixee/agent/compare/v1.6.2...v1.6.3) (2022-01-14)


### Bug Fixes

* **client:** wait for all command queue flushes ([95664f5](https://github.com/ulixee/agent/commit/95664f570b6b7e233ea6b6227ad5f363cce52287))
* **core:** cleanup event listener memory ([6f7d7bb](https://github.com/ulixee/agent/commit/6f7d7bb449714876ab9a90ec4697c012d8c7bff3))
* **core:** in page nav not resolving resource ([2539d78](https://github.com/ulixee/agent/commit/2539d7809d0709d709cff9bba48f411361e8ebc9))





## [1.6.2](https://github.com/ulixee/agent/compare/v1.6.1...v1.6.2) (2021-12-20)


### Bug Fixes

* **core:** navigations directly to hash fixed ([c02f61b](https://github.com/ulixee/agent/commit/c02f61b549d34c438614ab8f63c8fce17af60d2c)), closes [#404](https://github.com/ulixee/agent/issues/404)


### Features

* **client:** return resource in waitForLocation ([253b33b](https://github.com/ulixee/agent/commit/253b33b3528952432528949ab0dc2c8b4cf9a50c))
* **core:** dialogs should run out of command line ([52a737f](https://github.com/ulixee/agent/commit/52a737ff7ca380b00a1f156aa7dacf5e9af0bcfb)), closes [#397](https://github.com/ulixee/agent/issues/397)





## [1.6.1](https://github.com/ulixee/agent/compare/v1.5.15...v1.6.1) (2021-12-14)


### Bug Fixes

* **core:** frame navigations on redirects ([de3ea24](https://github.com/ulixee/agent/commit/de3ea248a0fda5b8d08c7de961bac4f9fdc0b83e))
* **core:** handle detached when elements not there ([5b46bd9](https://github.com/ulixee/agent/commit/5b46bd97cf1ca1aa3bc0fed625064764726872f4))
* **puppet:** extract navigation loader ([77d8e2e](https://github.com/ulixee/agent/commit/77d8e2e34286469a2df1d9e00e631c6e773760eb))
* **replay:** fix ability to replay data attributes ([9440995](https://github.com/ulixee/agent/commit/944099560870c8479f0be59426fa194daf17ab4d))


### Features

* **plugins:** add frames to execute js ([65258a3](https://github.com/ulixee/agent/commit/65258a3fa6ad23f7263bd0f90d86bebf751d8e94))





# [1.6.0](https://github.com/ulixee/agent/compare/v1.5.15...v1.6.0) (2021-12-14)


### Bug Fixes

* **core:** handle detached when elements not there ([5b46bd9](https://github.com/ulixee/agent/commit/5b46bd97cf1ca1aa3bc0fed625064764726872f4))
* **puppet:** extract navigation loader ([77d8e2e](https://github.com/ulixee/agent/commit/77d8e2e34286469a2df1d9e00e631c6e773760eb))
* **replay:** fix ability to replay data attributes ([9440995](https://github.com/ulixee/agent/commit/944099560870c8479f0be59426fa194daf17ab4d))


### Features

* **plugins:** add frames to execute js ([65258a3](https://github.com/ulixee/agent/commit/65258a3fa6ad23f7263bd0f90d86bebf751d8e94))





## [1.5.15](https://github.com/ulixee/agent/compare/v1.5.14...v1.5.15) (2021-11-24)


### Bug Fixes

* **client:** handle ws closing during shutdown ([09bfe29](https://github.com/ulixee/agent/commit/09bfe29f54a4307fe0df1370a35a87d7950e9378))
* **puppet:** consisten timeout handling ([ba6bcee](https://github.com/ulixee/agent/commit/ba6bcee3384811824ae3dc3789c5c3fc6088905a))


### Features

* **plugins:** mask public ip in webrtc ([14d3c67](https://github.com/ulixee/agent/commit/14d3c673327c149084ae32cd71c944cf60a84df3))





## [1.5.14](https://github.com/ulixee/agent/compare/v1.5.13...v1.5.14) (2021-11-15)


### Bug Fixes

* **core:** don't lose old user-profile storage ([9fe9ae4](https://github.com/ulixee/agent/commit/9fe9ae4d6827a93f6b681dc10455d4695369b37f)), closes [#342](https://github.com/ulixee/agent/issues/342)


### Features

* **mitm:** add documentUrl to resources ([7fcbf8f](https://github.com/ulixee/agent/commit/7fcbf8faf84a72360d490f14c72910ea54619dc6))







**Note:** Version bump only for package @unblocked-web/agent-core





## [1.5.12](https://github.com/ulixee/agent/compare/v1.5.11...v1.5.12) (2021-09-26)


### Bug Fixes

* **mitm:** waitForLocation reload on post ([fb3e3d7](https://github.com/ulixee/agent/commit/fb3e3d7819cdf472d00370f5bcbdbd262e961a67))





## [1.5.11](https://github.com/ulixee/agent/compare/v1.5.10...v1.5.11) (2021-09-20)


### Bug Fixes

* **plugins:** fix dynamic plugins + types ([98ed6f8](https://github.com/ulixee/agent/commit/98ed6f839915aff76bdaf31bc98addeddc309f17))





## [1.5.10](https://github.com/ulixee/agent/compare/v1.5.9...v1.5.10) (2021-09-11)


### Bug Fixes

* **user-profile:** handle empty database ([c9abf9a](https://github.com/ulixee/agent/commit/c9abf9ab846df0d9df3ccd3b952379e8f79d9dfe))





## [1.5.9](https://github.com/ulixee/agent/compare/v1.5.8...v1.5.9) (2021-09-08)


### Features

* **core:** only use valid sinceCommandIds ([75056c3](https://github.com/ulixee/agent/commit/75056c3ba343b89de8be0536743343b1a3bea238))





## [1.5.8](https://github.com/ulixee/agent/compare/v1.5.7...v1.5.8) (2021-08-30)


### Bug Fixes

* **core:** throw invalid selectors, fix wait x/y ([2025f27](https://github.com/ulixee/agent/commit/2025f27d749011730609202cbf5798496a3fccc1))





## [1.5.7](https://github.com/ulixee/agent/compare/v1.5.6...v1.5.7) (2021-08-26)


### Bug Fixes

* track frame network events before create ([56f924d](https://github.com/ulixee/agent/commit/56f924d9c2d815e09f1b1cd80ca9e3af41734450))





## [1.5.6](https://github.com/ulixee/agent/compare/v1.5.5...v1.5.6) (2021-08-15)


### Bug Fixes

* **core:** handle single page app location changes ([da27e1d](https://github.com/ulixee/agent/commit/da27e1d9affeccd838d72b53ea3dfc15654c098a))
* allow no rectangle for screenshot ([e4d5597](https://github.com/ulixee/agent/commit/e4d559717831afb277ca47b83c840c78dcf8fa08))





## [1.5.5](https://github.com/ulixee/agent/compare/v1.5.4...v1.5.5) (2021-07-29)


### Bug Fixes

* cherrypick bug fixes from hero ([a3e8fbf](https://github.com/ulixee/agent/commit/a3e8fbfa42570df605487f53b5b0cc784eaf6423))
* **core:** fix headed browser size/viewport docs ([c1623be](https://github.com/ulixee/agent/commit/c1623be023d8aa02a554231cd98d2ce6cb00216f))
* reversed the reorg from two days ago ([aa5fddd](https://github.com/ulixee/agent/commit/aa5fddddbb66645bef9f6ab1b2d469bc9501f892))





## [1.5.4](https://github.com/ulixee/agent/compare/v1.5.3...v1.5.4) (2021-07-14)


### Bug Fixes

* **mitm:** http2 session frame emulator data ([1e61a91](https://github.com/ulixee/agent/commit/1e61a91dad0f575ddbdde9dc66acba7e8de62df6))
* fixed paths ([6a28d80](https://github.com/ulixee/agent/commit/6a28d8069111356e0b63d23003187ecd08a365b8))





## [1.5.3](https://github.com/ulixee/agent/compare/v1.5.2...v1.5.3) (2021-07-01)


### Bug Fixes

* **mitm:** workers timing out on init ([42b8e5c](https://github.com/ulixee/agent/commit/42b8e5cdb6a466252e8ea20c3a1037dfc7b43999))
* **puppet:** headed not launching on ubuntu ([6f8a9a1](https://github.com/ulixee/agent/commit/6f8a9a17857e952bbcedfa26aede9bd2451604c4)), closes [#272](https://github.com/ulixee/agent/issues/272)





## [1.5.2](https://github.com/ulixee/agent/compare/v1.5.1...v1.5.2) (2021-06-30)


### Bug Fixes

* **replay:** iframe display when load too quick ([784a0ef](https://github.com/ulixee/agent/commit/784a0efbe61e64062dcf8bd110cc6c8ddffd2902))
* **replay:** replay notifier breaks on unhandled ([21b38c5](https://github.com/ulixee/agent/commit/21b38c58e80c720ab24798ece7c9d0e2448d14e0))
* when importing plugins try default on require ([be0f7d5](https://github.com/ulixee/agent/commit/be0f7d5f285152cadb4eb62aad54ea4827b1fdef))


### Features

* **core:** improve mouse message when not there ([b9711d6](https://github.com/ulixee/agent/commit/b9711d6b3b27882ff2be711382464243493d71a7))
* dynamically require core extender plugins required by client ([f069514](https://github.com/ulixee/agent/commit/f069514fc01916437a37c281354a64eb4f14839f))





## [1.5.1](https://github.com/ulixee/agent/compare/v1.5.0...v1.5.1) (2021-06-28)


### Bug Fixes

* remove console logs, basic emulator bug ([c028062](https://github.com/ulixee/agent/commit/c028062a8130caa4cae1c65381bc66a55a6cf45b))





# [1.5.0](https://github.com/ulixee/agent/compare/v1.4.1-alpha.4...v1.5.0) (2021-06-28)


### Bug Fixes

* **replay:** show post navigations correctly ([f452cc4](https://github.com/ulixee/agent/commit/f452cc44f405f64cff2f7c070af9440e39176696)), closes [#259](https://github.com/ulixee/agent/issues/259)
* a number of tweaks to get client extender plugins working ([bc89574](https://github.com/ulixee/agent/commit/bc8957491b4b3180b67796ae9eb2487250a839df))
* eslint errors, tests hanging ([e413531](https://github.com/ulixee/agent/commit/e4135311adc2a7841bbe1ec7d0cbe7c8f339468a))
* navigation test hanging ([115418a](https://github.com/ulixee/agent/commit/115418aa7b9d73e9ee74051a26faac4d3bea1a9f))
* **client:** add key to detached tab ([5c9ed99](https://github.com/ulixee/agent/commit/5c9ed998d370d407bc45d47fb6af3528cf6bba05))
* **core:** flaky tests, fix interact with string ([0d708dd](https://github.com/ulixee/agent/commit/0d708ddfaddd3a03c9043cbc3d952836bc6e3350))
* **core:** flushing outside transactions ([5abd143](https://github.com/ulixee/agent/commit/5abd1439e875880c683f24e9b87fec0e4331b24c))
* **core:** noscript messing up frozen tabs ([6c55805](https://github.com/ulixee/agent/commit/6c558056985bd8049940ad76543aa535f7790bbb))
* **core:** store detached in sessions db ([4b228f3](https://github.com/ulixee/agent/commit/4b228f35157fc92dffc8e4c077e35f91bbb24e51))
* **core:** update attachedstate to nodepointer ([1bec22a](https://github.com/ulixee/agent/commit/1bec22a329b6da410fb7de0a36bcd6e19b23f902))
* **deps:** peg awaited dom version ([3e6ffaf](https://github.com/ulixee/agent/commit/3e6ffaf52cdf2933a5608417ee7178ed36512aa8))
* **emulate:** fix launching headed ([dd56372](https://github.com/ulixee/agent/commit/dd563728ff4d01fd4abf2f00c9c21339985c9679))
* **mitm:** http2 header order wrong ([801b3c8](https://github.com/ulixee/agent/commit/801b3c84a18f6eee51464d889edf9e01134fba9a))
* **replay:** fix assets in different data location ([082dcff](https://github.com/ulixee/agent/commit/082dcffea00c25ba72a39e9b4f3f405406657db4))
* fixed issues with dns looking test ([e5bbb28](https://github.com/ulixee/agent/commit/e5bbb286b5c88a24dafc04a611114c2bfaec83ac))
* removed emulate-safari-13 dependency ([20b3c71](https://github.com/ulixee/agent/commit/20b3c71045f2fe4c25d80888acdd646157601654))
* **puppet:** wait for loader before new tab ([d045701](https://github.com/ulixee/agent/commit/d045701d00f421b529b5aafd32e1e25a1a15da38))


### Features

* **client:** update awaited-dom ([f9699fb](https://github.com/ulixee/agent/commit/f9699fbadb2c2020e88056edb33eeb5331ed1556))
* **client+core:** input/outputs ([d48a1de](https://github.com/ulixee/agent/commit/d48a1de1ae5f293fdb884ae23c2402cf4e14ee36))
* **core:** compress dom changes ([ef7def9](https://github.com/ulixee/agent/commit/ef7def9fcd7c72ef56a6a334e68562348fdbf7a3))
* **core:** detached tab ([9e32e47](https://github.com/ulixee/agent/commit/9e32e47f2e0c17a138593f554d966a346d2800e5))
* **core:** don’t save detached when no changes ([fbabac5](https://github.com/ulixee/agent/commit/fbabac5cd9475a87cfc3ee76d9f71df00a9de722))
* **core:** geolocation feature ([0ecbb14](https://github.com/ulixee/agent/commit/0ecbb14307c6cdebb99cf2e2ab3c3d27702aa6fa))
* **core:** javascript dialog handling ([e02d84b](https://github.com/ulixee/agent/commit/e02d84b3f1d5c01da5c2b581c6889922584a92d0))
* **core:** prefetch jsPaths from prior runs ([4f523bd](https://github.com/ulixee/agent/commit/4f523bdbafe18c19517831edd8d0b325dd023de4))
* **core:** store agent options in session table ([aab1025](https://github.com/ulixee/agent/commit/aab1025ccef2f3545743d98ec728161c47b51493))
* **core:** waitForFileChooser ([cf3beb9](https://github.com/ulixee/agent/commit/cf3beb9b3d06dbd3548e5a23746641f5addbfade))
* **emulators:** drive devtools from emulator ([d71b9cd](https://github.com/ulixee/agent/commit/d71b9cd734c3621e25ddb5bd53544d1b7dcba504))
* **emulators:** move installation into emulators ([351c58d](https://github.com/ulixee/agent/commit/351c58d2fb3333725370bfb1dbc29027005ced8a))
* **emulators:** move launch args into emulators ([6888736](https://github.com/ulixee/agent/commit/6888736ca15d4a299a2a32a31568f61a5a90d1ce))
* **interact:** better error for null interaction ([40ba3cf](https://github.com/ulixee/agent/commit/40ba3cf97e0aa3d8a84f5b7e4a0a7d353a42604a))
* **mitm:** determine alpn on proxy connect ([398735d](https://github.com/ulixee/agent/commit/398735d4dd8ab219c520da775e92f42ee9889544))
* **mitm:** move mitm control to emulators ([d944805](https://github.com/ulixee/agent/commit/d944805edd92a52c5c7eb7a46e3d5de13c6e12cb))
* **plugin:** chrome dependencies in npm packages ([62d99c9](https://github.com/ulixee/agent/commit/62d99c90b0bc653f568eff9cf2279109f2d24bfe))
* **replay:** add output streaming to replay ([dd0f3b8](https://github.com/ulixee/agent/commit/dd0f3b87518c5967c41b8d79829f80899769ee6d))
* added support for plugins ([0fda55d](https://github.com/ulixee/agent/commit/0fda55d7a57d300d765c462389e76da0e1fe0822))
* **replay:** show frozen tabs ([d2eff14](https://github.com/ulixee/agent/commit/d2eff14ac12b06dfb1325a41f542c5ae9714a471))
* extracted browser emulators to their own repos ([e2ee11a](https://github.com/ulixee/agent/commit/e2ee11ac6609f6eb6b9afa3a6b83bddb13d30201))





## [1.4.1-alpha.4](https://github.com/ulixee/agent/compare/v1.4.1-alpha.3...v1.4.1-alpha.4) (2021-04-20)

**Note:** Version bump only for package @unblocked-web/agent-core





## [1.4.1-alpha.3](https://github.com/ulixee/agent/compare/v1.4.1-alpha.2...v1.4.1-alpha.3) (2021-04-20)


### Bug Fixes

* **client:** explicit mjs exports ([d3e4525](https://github.com/ulixee/agent/commit/d3e4525ee8fb0430c4073791efde9741e01d9f9d))
* **core:** allow retrieving datasets ([582ed16](https://github.com/ulixee/agent/commit/582ed16fd07c09346afbbcd7f9e3d5e9e375aeb8)), closes [#213](https://github.com/ulixee/agent/issues/213)
* **core:** convert dates to numbers ([da17efe](https://github.com/ulixee/agent/commit/da17efecaa8301070ed3c98d8d4d423d44d50f74))
* **core:** fix location change triggers ([360dfa0](https://github.com/ulixee/agent/commit/360dfa0325bb5b87fe299c387d48b4bbcf45cabe))
* **core:** fix looping for node id lookup ([91ac3bc](https://github.com/ulixee/agent/commit/91ac3bcabe75bc8c4ef58518671727fc22e6a6b6))
* **core:** handle url not loaded yet for nav in 88 ([ddafb11](https://github.com/ulixee/agent/commit/ddafb114a9ce64fc16f9dc1171a60730d70bd56a))
* **core:** improve navigation tracking ([2e75570](https://github.com/ulixee/agent/commit/2e755704d182c960d7844a03be9874360dc11ba4))
* **core:** properly record back/forward nav ([6a1a52a](https://github.com/ulixee/agent/commit/6a1a52a5551c18d87d0c545bb0a3748e49e2cbdd))
* **mitm:** fix ipc timeouts ([851be03](https://github.com/ulixee/agent/commit/851be03be65fb0718b8af8230ab76360a7f006ef))
* **puppet:** fix chrome-88 ([f917b52](https://github.com/ulixee/agent/commit/f917b5237fd9010e041b68fa493a77bfd4d8fea0))


### Features

* **client:** getJsValue should return value ([84dcd65](https://github.com/ulixee/agent/commit/84dcd650fb6dc358904374e59965a72e7c3b2aa6))
* **core:** optimize string reuse in high traffic ([3c03c3a](https://github.com/ulixee/agent/commit/3c03c3aa1639a74a38160fb9cfd13882774fc70f))
* **core:** single script install ([4b80047](https://github.com/ulixee/agent/commit/4b8004721c2146e09d1c6b33433500b79db02522))
* **core:** throw fetch error if no origin ([0c10980](https://github.com/ulixee/agent/commit/0c10980b9db085cd042444fb1eca9514eb89ba91))
* **mitm:** support mitm per browser context ([f1dea45](https://github.com/ulixee/agent/commit/f1dea4525dbac2faac04e2779a1be7312c100df5))
* **mitm:** use shared mitm socket ([f80334b](https://github.com/ulixee/agent/commit/f80334b59f03f59dda63040b28146c51cff1825d))
* updated chrome 80, 81, 83 + added 84, 85, 86, 87, and 88 ([62f9638](https://github.com/ulixee/agent/commit/62f96389abbe8c095d4eafb229293f8ee247edad))





## [1.4.1-alpha.2](https://github.com/ulixee/agent/compare/v1.4.1-alpha.1...v1.4.1-alpha.2) (2021-04-02)


### Bug Fixes

* **human:** fix re-hovering over current location ([7eb202a](https://github.com/ulixee/agent/commit/7eb202ab19c43af8642a395351db6debdf0eb83d)), closes [#209](https://github.com/ulixee/agent/issues/209)


### Features

* **core:** return null for non-existent elements ([871c2fa](https://github.com/ulixee/agent/commit/871c2fa22d761e37836b3ecb1d765c6a5fc7cdee))
* **emulate:** wait 3 seconds after load ([1dd0fd5](https://github.com/ulixee/agent/commit/1dd0fd5b6d151339b8c19ea95db43eef60998b00))
* **replay:** show nodes running execJsPath ([bb1a270](https://github.com/ulixee/agent/commit/bb1a270aa44e5965443fdfa7640cdedb70ff005a))





## [1.4.1-alpha.1](https://github.com/ulixee/agent/compare/v1.4.1-alpha.0...v1.4.1-alpha.1) (2021-03-31)


### Bug Fixes

* **client:** fix logging dependency error ([22900c4](https://github.com/ulixee/agent/commit/22900c49da47e8ce0d910c255d9b535527ce040d))
* **core:** block resources not working ([5488b34](https://github.com/ulixee/agent/commit/5488b34230e85209c428469b9ed2356077443120))
* **core:** fix failing interact test ([d0993e6](https://github.com/ulixee/agent/commit/d0993e6539cdb10d502e8eec396414e04f6ad03c))
* **core:** hang closing ([233ff06](https://github.com/ulixee/agent/commit/233ff0678de8abd181e989ce849b21c0d9cbff6a))
* **emulate:** mask widevine checks ([65e8655](https://github.com/ulixee/agent/commit/65e8655e5d906ba538f9ebc84f21f7d6a5356f47))
* **mitm:** invalid header char bugs ([2d794d9](https://github.com/ulixee/agent/commit/2d794d928c74d36b1e8530e8350fe1aa8a51d656))
* **mitm:** store resources if tab not found ([60c76d0](https://github.com/ulixee/agent/commit/60c76d0bbca07cf1d1338d2ba1593f9725beae6f))
* **puppet:** enable gpu by default ([9a06165](https://github.com/ulixee/agent/commit/9a061657eaf844a385e17953cb7436181fadad6a))


### Features

* **handler:** re-q unstarted agents on disconnect ([b0ece5b](https://github.com/ulixee/agent/commit/b0ece5bdaa203352932dd524b1eddc082df6fb31))
* **interact:** peg nodeid for interactions ([8a4db76](https://github.com/ulixee/agent/commit/8a4db764b11cd9b0fae0acde44ee7887d7c9f2ef))





## [1.4.1-alpha.0](https://github.com/ulixee/agent/compare/v1.4.0-alpha.1...v1.4.1-alpha.0) (2021-03-23)


### Bug Fixes

* **client:** properly handle unhandled disconnect ([e3afedd](https://github.com/ulixee/agent/commit/e3afedd90f0c614dab8ed5a02ba40de013e24b1d))
* **core:** stop writing to db if it goes readonly ([9fc9e2f](https://github.com/ulixee/agent/commit/9fc9e2f67ea5a5dd495fbfcb6946698c279c118c))
* **core:** type serializer, fix null headers issue ([e4d832b](https://github.com/ulixee/agent/commit/e4d832b62278c67c59edb7bb6d0b2097a6b8669b))
* **emulator:** polyfill setAppBadge/clearAppBadge ([5cfa400](https://github.com/ulixee/agent/commit/5cfa40082de419458656370622552c668b0a071f))
* **mitm:** cached resources to use cached status ([26079b5](https://github.com/ulixee/agent/commit/26079b5ee040efc7abbc57a422bb356f9b41a39e))
* **mitm:** fix url error ([d53ae18](https://github.com/ulixee/agent/commit/d53ae18a905fce3fea45a1e19edd9498ed4c54bd))
* **puppet:** handle crashed windows ([290e923](https://github.com/ulixee/agent/commit/290e923544008c3cd84b568c2d8a7c2f0de38437))


### Features

* **client:** expose frames ([44a6b12](https://github.com/ulixee/agent/commit/44a6b129fef6f541cffc24e8913fd76defcf3aef))





# [1.4.0-alpha.1](https://github.com/ulixee/agent/compare/v1.4.0-alpha.0...v1.4.0-alpha.1) (2021-03-11)

**Note:** Version bump only for package @unblocked-web/agent-core





# [1.4.0-alpha.0](https://github.com/ulixee/agent/compare/v1.3.1-alpha.1...v1.4.0-alpha.0) (2021-03-11)


### Bug Fixes

* **client:** fix close handling ([f413ea8](https://github.com/ulixee/agent/commit/f413ea8c66b0e07512a7b6fbd0d9857bebad1d7c))
* **client:** resource timeout + blank new tab ([4fdd378](https://github.com/ulixee/agent/commit/4fdd3789edf9c2a7290b4deb660aa2d7194ec9c8))
* **client:** translate errors when session n/a ([6c15793](https://github.com/ulixee/agent/commit/6c15793f67cadfcf7d62e270848fbef895e397af))
* **core:** exports not working <= node 14.12 ([d793601](https://github.com/ulixee/agent/commit/d793601a052c243a541cf0331c79d00bc1332d1e))
* **core:** handle canceled navigation redirect ([348c058](https://github.com/ulixee/agent/commit/348c05863519ad6daaf8386c35a2b021883bd386))
* **core:** try to fix tab test ([2f74a1e](https://github.com/ulixee/agent/commit/2f74a1e48f2aa04d05c9826ac654de88686af597))
* **ghost:** fix oom in bezierjs ([1d4ab06](https://github.com/ulixee/agent/commit/1d4ab06c572f1d9aff7b8edd00ba9603c7da1f45))
* **mitm:** don’t wait for browser resources ([4c70bd5](https://github.com/ulixee/agent/commit/4c70bd5ae89bf38cda80049d522e0b25f842240d)), closes [#176](https://github.com/ulixee/agent/issues/176)
* **mitm:** try/catch around mitm throw areas ([e58b7a2](https://github.com/ulixee/agent/commit/e58b7a2ba67ab6c5a435b83fa2b69b3ecc8f3465))
* failing test ([a6ae58d](https://github.com/ulixee/agent/commit/a6ae58dc02940fce6a9184d0d5adc1b2ee29bd45))
* renamed some vars, removed chromium blocks, and modified BrowserFetcher ([60955b2](https://github.com/ulixee/agent/commit/60955b259c15c887e20ae423ed8683caed80751d))
* test reliability ([76aea40](https://github.com/ulixee/agent/commit/76aea4051f71f489a62c15385a337b17a19afaf2))
* **puppet:** extract linux chrome ([55f8ef5](https://github.com/ulixee/agent/commit/55f8ef57ba410685697f5dc73f923026c8b0c4a6))
* **puppet:** no chrome launch errors to client ([1e636a6](https://github.com/ulixee/agent/commit/1e636a6625c47c67ee8a4e7d5be05ce99b513a5f))


### Features

* **client:** coreHost & disconnecting errors ([aed9fc3](https://github.com/ulixee/agent/commit/aed9fc3f49996a661ab6b70e5446c9442649802a)), closes [#165](https://github.com/ulixee/agent/issues/165)
* **puppet:** switch to chrome ([d064e53](https://github.com/ulixee/agent/commit/d064e53ace2107ac95348cf721c3cc35afe07efc))
* **replay:** update for mac silicon + deps ([30ffec7](https://github.com/ulixee/agent/commit/30ffec74fc06485b56344f17374a082d2055c1f1))





## [1.3.1-alpha.1](https://github.com/ulixee/agent/compare/v1.3.1-alpha.0...v1.3.1-alpha.1) (2021-02-19)


### Bug Fixes

* pass all node vars to CoreProcess ([821a438](https://github.com/ulixee/agent/commit/821a4381e1a79717b19e1a95ce3e2bbb1cc6177c))





# [1.3.0-alpha.4](https://github.com/ulixee/agent/compare/v1.3.0-alpha.3...v1.3.0-alpha.4) (2021-02-15)


### Bug Fixes

* **core:** fix core shutdown test ([28dd09a](https://github.com/ulixee/agent/commit/28dd09af20572a1ac2962abcde20599f119a3508))
* **core:** only reject navigation with errors ([7e7cfd3](https://github.com/ulixee/agent/commit/7e7cfd37cff860422d8c46bed90eba31652df9d5)), closes [#153](https://github.com/ulixee/agent/issues/153)
* **core/client:** export usable mjs/cjs ([ca149ef](https://github.com/ulixee/agent/commit/ca149efbfbdf03da0fda7d127348e5de6f2a4f8b))
* **mitm:** change log level of mitm request errors ([da9f98f](https://github.com/ulixee/agent/commit/da9f98fe3df7feb79585b686ab9fe0474dea9e27))


### Features

* **client:** add http cache and load failures ([571e64f](https://github.com/ulixee/agent/commit/571e64f108df7a0cbfd32609c37ff76261014dc6))
* **emulate:** workers run stealth scripts ([e6e845e](https://github.com/ulixee/agent/commit/e6e845e68654c73ddaefe2110065a20d044f773d))





# [1.3.0-alpha.3](https://github.com/ulixee/agent/compare/v1.3.0-alpha.2...v1.3.0-alpha.3) (2021-02-11)


### Bug Fixes

* **core:** cancel interaction on navigate ([eaa6605](https://github.com/ulixee/agent/commit/eaa6605d9325618cde2a281aa699ab4a6d82be83))
* **core:** only wait for main frame ([52d36d8](https://github.com/ulixee/agent/commit/52d36d81609f65105cc30667378d67155b271f76))
* **puppet:** non-popups getting opener ([e79584f](https://github.com/ulixee/agent/commit/e79584f5b71557bebe86b0301a8a0e9e55d8ac8f))





# [1.3.0-alpha.2](https://github.com/ulixee/agent/compare/v1.3.0-alpha.1...v1.3.0-alpha.2) (2021-02-09)


### Bug Fixes

* **client:** correctly catch some canceled promise ([1d5906f](https://github.com/ulixee/agent/commit/1d5906f5bff7e757bd084bb98883b56f3cf22bbe))
* **mitm:** read failed/cached browser resources ([150db8b](https://github.com/ulixee/agent/commit/150db8b3785705afdc54b915684ae0c828a5ecf8))





# [1.3.0-alpha.1](https://github.com/ulixee/agent/compare/v1.3.0-alpha.0...v1.3.0-alpha.1) (2021-02-06)


### Bug Fixes

* sessionId should be set on browserEmulator regardless of user Profile ([083260d](https://github.com/ulixee/agent/commit/083260dcfd47037879bf2bec8bed56f47eae8a41))


### Features

* replaced chrome 80, 81, 83 emulators with more robust os-level data ([276b269](https://github.com/ulixee/agent/commit/276b26923368c5ed5636f65ad14fb2b3a9f87e9e))
* **core:** friendly message setting cookies ([a9d9ecf](https://github.com/ulixee/agent/commit/a9d9ecf054f6e21db037093fc255ae8fc26da3a7)), closes [#142](https://github.com/ulixee/agent/issues/142)
* **core:** tweak logging for not-really-errors ([bd5f9eb](https://github.com/ulixee/agent/commit/bd5f9ebf38eb58adc14542dc4e32737b0ad8ff9e))





# [1.3.0-alpha.0](https://github.com/ulixee/agent/compare/v1.2.0-alpha.5...v1.3.0-alpha.0) (2021-02-02)


### Bug Fixes

* **core:** full close down of on premature exit ([aa53e85](https://github.com/ulixee/agent/commit/aa53e85782a57da4d69f8750a5c3719c60683f5b))
* **core:** handle visible for height > innerHeight ([b7a1e65](https://github.com/ulixee/agent/commit/b7a1e65dced687fb3df0677a26e6b56cc1e34c97))
* **core:** isVisible fix, scroll below 0 fix ([7c0c451](https://github.com/ulixee/agent/commit/7c0c451a2bf4675fc07205649ca78bc56fe7890c))
* **emulators:** safari cookie handling fix ([3507c26](https://github.com/ulixee/agent/commit/3507c2665afd6e94b5f99633e748fa4d455d81db))
* **puppet:** launch non-default (83) headed chrome ([84a02aa](https://github.com/ulixee/agent/commit/84a02aa48db41ecb3a1e831e56a4bf1fb805486e))
* **replay:** fix replay launch in new setup on win ([add1b97](https://github.com/ulixee/agent/commit/add1b97084d9d83f0cdad77362a238aeef92cf68))
* allow setting SA_SHOW_REPLAY in a script ([18d63d6](https://github.com/ulixee/agent/commit/18d63d640dc69e83512908bbdec1263aba87d953))
* converted some props of IBrowserEmulator to optional ([8e74bed](https://github.com/ulixee/agent/commit/8e74bed69d03bbc961292d4a3b89f9706cb1d555))
* mitm session ports were getting reused and conflicting ([0e11465](https://github.com/ulixee/agent/commit/0e11465d3882234e1cc650f372155458ea8bd6e1))
* updated some things to work with Slab ([51dada5](https://github.com/ulixee/agent/commit/51dada5d267ec05a6dbe3d1da9f62b4f3754d5a1))
* viewports window width/height must include frame border width/height ([cca0c8e](https://github.com/ulixee/agent/commit/cca0c8ec66bee1eafd7dcac2564eb8e0fc18747c))


### Features

* **client:** add ability to get agent metadata ([55df775](https://github.com/ulixee/agent/commit/55df775b3b9e78db99bc726ae54a683cc701a7e2))
* **client:** built-in remote + handlers ([bfaa739](https://github.com/ulixee/agent/commit/bfaa739517a458db9dd1bd6374770840eb95b847))
* **client:** coreConnection as configuration ([ac284ca](https://github.com/ulixee/agent/commit/ac284cac3fa867a9623fd841edf96d04906e3072))
* **core:** add getComputedStyles to tab ([0e3bccd](https://github.com/ulixee/agent/commit/0e3bccd9c27ac1e6b122238ca7292182c169ebe6))
* **core:** add screenshot capability ([f075f89](https://github.com/ulixee/agent/commit/f075f89636edb81c4626c51929665373069de31a))
* **core:** confirm mouse clicks hit targets ([bf2b047](https://github.com/ulixee/agent/commit/bf2b047ca9e49665f7f150e66780b79fd02b7972))
* **core:** convert all connections to server ([a27fafd](https://github.com/ulixee/agent/commit/a27fafd9a04e52f602a557f7304164c2308006c6))
* **core:** convert closing logs to stats ([382979d](https://github.com/ulixee/agent/commit/382979df1a758de82297169465be0e57c2c87b53))
* **core:** convert server to use websockets ([2d1804c](https://github.com/ulixee/agent/commit/2d1804ce7521fe065c01491e3f5e084852369f55))
* **core:** merge injected scripts into core ([f674f7b](https://github.com/ulixee/agent/commit/f674f7b85a9cf66dd3558d849a78f6b9aa1099dc))
* **core:** merge session-state and core ([dcc6002](https://github.com/ulixee/agent/commit/dcc6002c2003d981267e51c8dacf5201fe3b9fda))
* **core:** timeouts for back/fwd/goto, add reload ([bae2a8e](https://github.com/ulixee/agent/commit/bae2a8eaf20b2a855c98986d5c2c9b5e11b004ec))
* **core:** waitForLocation/Load takes a timeout ([02758c7](https://github.com/ulixee/agent/commit/02758c7fc1e5394db84f91aa8235c3364b6c0692))
* **core:** waitForPaintingStable ([1955b79](https://github.com/ulixee/agent/commit/1955b791ce8a7cf20a679986e63885950efa6813))
* **replay:** ability to launch via bin ([518d320](https://github.com/ulixee/agent/commit/518d320e157b4d28e0ce99864c4f53aa5fa439a8))
* **replay:** single install of replay ([5425bee](https://github.com/ulixee/agent/commit/5425bee76488ac5bff4f46d8b99eb874dd7f5a35))
* mv renderingOptions => blockedResourceTypes ([ffa1b74](https://github.com/ulixee/agent/commit/ffa1b74d0b470387ec104027667e8523a51bfa15)), closes [#113](https://github.com/ulixee/agent/issues/113)
* **website:** blog post on handlers ([8024f03](https://github.com/ulixee/agent/commit/8024f0343e63689afd9aba589e80816a5880f838))
* browser window size now takes into calculation os nav bars ([ab65a65](https://github.com/ulixee/agent/commit/ab65a650e4b63e77ad5e165f7a60e3e024140f66))
* randomize the Viewports browser positionX/Y ([66c1f4a](https://github.com/ulixee/agent/commit/66c1f4a89a434352ae5c8add46481c1f6d28f03f))


### BREAKING CHANGES

* renames “renderingOptions” to “blockedResourceTypes”. Default is now “None”





# [1.2.0-alpha.5](https://github.com/ulixee/agent/compare/v1.2.0-alpha.4...v1.2.0-alpha.5) (2020-12-29)

**Note:** Version bump only for package @unblocked-web/agent-core





# [1.2.0-alpha.4](https://github.com/ulixee/agent/compare/v1.2.0-alpha.3...v1.2.0-alpha.4) (2020-12-22)

**Note:** Version bump only for package @unblocked-web/agent-core





# [1.2.0-alpha.3](https://github.com/ulixee/agent/compare/v1.2.0-alpha.2...v1.2.0-alpha.3) (2020-12-16)


### Bug Fixes

* **mitm:** bubble proxy errors properly to client ([b6a72f5](https://github.com/ulixee/agent/commit/b6a72f59ef8e7739654ab82b170aa0e15d38ebd0)), closes [#98](https://github.com/ulixee/agent/issues/98)
* **replay:** multiple sessions showing incorrectly ([20ba30c](https://github.com/ulixee/agent/commit/20ba30caebcef42de65dee18e6b82d92c7193d9c))


### Features

* **client:** update awaited dom to 1.1.8 ([a1b9b68](https://github.com/ulixee/agent/commit/a1b9b68e735ee54ceaef3436c43df0d0744c8f47))





# [1.2.0-alpha.2](https://github.com/ulixee/agent/compare/v1.2.0-alpha.1...v1.2.0-alpha.2) (2020-12-01)


### Bug Fixes

* **core:** fix errors on goto bubbling up ([30d4208](https://github.com/ulixee/agent/commit/30d4208c079e171fd6e0640810a4812e0a9a3d59))
* **emulate-humans:** fix some tests ([b1e05d7](https://github.com/ulixee/agent/commit/b1e05d79168fdf60f4ba6c63b8b74441c5c52f56))
* **eslint:** add return types to client code ([c2e31cc](https://github.com/ulixee/agent/commit/c2e31ccba4974f2bda269e77e6df9b82a2695d4f))
* **mitm:** remove auth as separate proxy param ([ec14b30](https://github.com/ulixee/agent/commit/ec14b302ed6389769b61e77337ba9fe873a647ed))
* **mitm-socket:** fix cpu spiking sockets ([b71e141](https://github.com/ulixee/agent/commit/b71e14158c1bb948e9ce33abf01b4522930caafe))


### Features

* **proxy:** configure proxy via client + socks5 ([880c938](https://github.com/ulixee/agent/commit/880c93803bebc78b835a8f2fb5133d633a315337))





# [1.2.0-alpha.1](https://github.com/ulixee/agent/compare/v1.2.0-alpha.0...v1.2.0-alpha.1) (2020-11-20)


### Bug Fixes

* unwind some dependencies ([240bea6](https://github.com/ulixee/agent/commit/240bea6ac7cb87bfcccbc56fb54043f5c2ff7b4b))


### Features

* **human-emulators:** ghost emulator ([70bcf27](https://github.com/ulixee/agent/commit/70bcf273a2e995f8168dced9797d441b6eaec80b))





# [1.2.0-alpha.0](https://github.com/ulixee/agent/compare/v1.1.0-alpha.1...v1.2.0-alpha.0) (2020-11-11)


### Features

* **awaited-dom:** documentation for props ([029a1f5](https://github.com/ulixee/agent/commit/029a1f5b10cc13119d4bb808d35f80cce4aeb3dd))
* **browser-emulators:** refactor emulator filenames ([b5da042](https://github.com/ulixee/agent/commit/b5da0426e39aad64178659cc93f441f781f917ba))
* **core:** store data files in a single location ([c3299b6](https://github.com/ulixee/agent/commit/c3299b6a0dc2fc42d7a7df3746ab34c2d8b15ea0))





# [1.1.0-alpha.1](https://github.com/ulixee/agent/compare/v1.1.0-alpha.0...v1.1.0-alpha.1) (2020-11-05)


### Bug Fixes

* **mitm:** should add host to http1 headers ([b655ea9](https://github.com/ulixee/agent/commit/b655ea925b531a53bb9b55271df5150881783bcf))


### Features

* **client:** get/set/delete cookies + domstorage ([2e2de6b](https://github.com/ulixee/agent/commit/2e2de6b9f2debf5eadf54b03b3f8d9db7cace269))





# [1.1.0-alpha.0](https://github.com/ulixee/agent/compare/v1.0.0-alpha.21...v1.1.0-alpha.0) (2020-11-03)


### Bug Fixes

* **puppet:** incorrect reuse of executionContextId ([e5d8f8d](https://github.com/ulixee/agent/commit/e5d8f8d1e90c7cebefae51b570ddb743ea8f39fe))


### chore

* **client:** merge Browser/User into SecretAgent ([364ed8a](https://github.com/ulixee/agent/commit/364ed8ab9c16cdf40c8ad1f151de4b06efcc557d))


### BREAKING CHANGES

* **client:** this change modifies the core interface for interacting with SecretAgent, as createBrowser is removed.





# [1.0.0-alpha.21](https://github.com/ulixee/agent/compare/v1.0.0-alpha.20...v1.0.0-alpha.21) (2020-11-02)


### Bug Fixes

* **core:** improved waitForElement ([4d139b3](https://github.com/ulixee/agent/commit/4d139b3aa920dc400691eb035f61936948e187b0))
* bugs in replay ([2bf8808](https://github.com/ulixee/agent/commit/2bf8808ae115ba9ea9f3cc64f3eba673fcb311aa))


### Features

* **core:** improve jspath waitForElement perf ([435576a](https://github.com/ulixee/agent/commit/435576a47a31dfedcfd3307c090e23b63998c716))
* **locale:** add locale emulation + tests ([57cc7ff](https://github.com/ulixee/agent/commit/57cc7ff8c342dc27a477b16cca066dffb9687e2f))
* **replay:** set screen viewport ([f818ff5](https://github.com/ulixee/agent/commit/f818ff5577d49d284a4116d328e78dc1d235824a))
* **session:** track frame dom node ids ([a41d678](https://github.com/ulixee/agent/commit/a41d6786d6fd10a386d9c2739713a26b6063b127))





# [1.0.0-alpha.20](https://github.com/ulixee/agent/compare/v1.0.0-alpha.19...v1.0.0-alpha.20) (2020-10-23)


### Bug Fixes

* order of session closing ([046243b](https://github.com/ulixee/agent/commit/046243b7b2f84f633674dbe23122eb1d58ca431c))


### Features

* **mitm:** dns over tls lookups ([8797847](https://github.com/ulixee/agent/commit/8797847fd5388ee6e4165c02390d45587799edbf))
* **mitm:** store ca/keys in network.db ([fd69f97](https://github.com/ulixee/agent/commit/fd69f97cee898720d5e5a5b30e0697b728c6e8d4))
* **puppet:** use mouse wheel events ([1efea8a](https://github.com/ulixee/agent/commit/1efea8abcf094d8c6644ecdedd5f0069b2fd909c))
* **session-state:** record devtools logs ([784da7f](https://github.com/ulixee/agent/commit/784da7f7728671485bce55b877fa350981c88ea2))
* **session-state:** record mitm resource states ([08976df](https://github.com/ulixee/agent/commit/08976dfa95f3b2629aedaca3002cc07b97e5bd2e))





# [1.0.0-alpha.19](https://github.com/ulixee/agent/compare/v1.0.0-alpha.18...v1.0.0-alpha.19) (2020-10-13)

**Note:** Version bump only for package @unblocked-web/agent-core





# [1.0.0-alpha.18](https://github.com/ulixee/agent/compare/v1.0.0-alpha.17...v1.0.0-alpha.18) (2020-10-13)

**Note:** Version bump only for package @unblocked-web/agent-core





# [1.0.0-alpha.17](https://github.com/ulixee/agent/compare/v1.0.0-alpha.16...v1.0.0-alpha.17) (2020-10-13)

**Note:** Version bump only for package @unblocked-web/agent-core





# [1.0.0-alpha.16](https://github.com/ulixee/agent/compare/v1.0.0-alpha.15...v1.0.0-alpha.16) (2020-10-13)


### Bug Fixes

* **core:** dont close client on promise rejections ([37f1169](https://github.com/ulixee/agent/commit/37f11690131c4bf08e481c803cdb3fba68c7985f))
* **core:** wait for location change on new tab ([0c70d6e](https://github.com/ulixee/agent/commit/0c70d6e7553025222b9fe4139407be4d69ee20b9))
* **mitm:** catch exceptions on closed h2 session ([6b5c7d4](https://github.com/ulixee/agent/commit/6b5c7d455c06d21f59ad4674199d76d73a5373d2))


### Features

* **client:** xpath support, array index access ([c59ccbc](https://github.com/ulixee/agent/commit/c59ccbc47eda9c61c360f04beb00a6a8e032f31e))
* **core:** isElementVisible - can user see elem ([213c351](https://github.com/ulixee/agent/commit/213c351cbc9bf4c6e8852fe0694bfafcdd602cbe))





# [1.0.0-alpha.15](https://github.com/ulixee/agent/compare/v1.0.0-alpha.14...v1.0.0-alpha.15) (2020-10-06)

**Note:** Version bump only for package @unblocked-web/agent-core





# [1.0.0-alpha.14](https://github.com/ulixee/agent/compare/v1.0.0-alpha.13...v1.0.0-alpha.14) (2020-10-06)


### Bug Fixes

* **client:** don’t shutdown on rejected promises ([86a331b](https://github.com/ulixee/agent/commit/86a331bede88daca8b17c079f23910ff776fb4c4))







**Note:** Version bump only for package @unblocked-web/agent-core





# [1.0.0-alpha.12](https://github.com/ulixee/agent/compare/v1.0.0-alpha.11...v1.0.0-alpha.12) (2020-09-29)


### Bug Fixes

* lint and puppet test chrome 80 ([0ce09ac](https://github.com/ulixee/agent/commit/0ce09ac71e3f9a9a802ba90f9c7aab9021f07e5c))
* refactor to pause debugger on attach ([63a9bd1](https://github.com/ulixee/agent/commit/63a9bd125e7f334a85a2dedc2490f4e66366ea6d))


### Features

* **core:** back/forward api ([805af3d](https://github.com/ulixee/agent/commit/805af3d48822c1306b73f5c084d65b0855819213)), closes [#32](https://github.com/ulixee/agent/issues/32)
* **mitm:** switch mitm to use authorization ([fade6e8](https://github.com/ulixee/agent/commit/fade6e81d58d947c03a7b54e37a887bbc0bba5a2))
* **puppet:** add puppet interfaces abstraction ([69bae38](https://github.com/ulixee/agent/commit/69bae38a03afaae3455de2a4928abd13031af662))
* **puppet:** import playwright tests ([e2b9bf5](https://github.com/ulixee/agent/commit/e2b9bf546af1ed899a01f460977e362b676c02e1))
* **replay:** remove ui tabs; nav to session tabs ([df8e21c](https://github.com/ulixee/agent/commit/df8e21cefc71ff6ad8db7d1498a1352cc71618a9))
* **replay:** spawned child tabs ([8ae0d75](https://github.com/ulixee/agent/commit/8ae0d754a8e263a6cae20815338532da84906a7b))
* **replay:** split session state by tab ([9367f2d](https://github.com/ulixee/agent/commit/9367f2d8796fda709bc8185374a5e07d4b6f78ab))
* import and shrink puppeteer ([b1816b8](https://github.com/ulixee/agent/commit/b1816b8f7b1a60edd456626e3c818e4ebe3c022f))
* wait for tab ([0961e97](https://github.com/ulixee/agent/commit/0961e97ecc4418c21536be92e1f3787aa1692117))





# [1.0.0-alpha.11](https://github.com/ulixee/agent/compare/v1.0.0-alpha.10...v1.0.0-alpha.11) (2020-08-25)

**Note:** Version bump only for package @unblocked-web/agent-core





# [1.0.0-alpha.10](https://github.com/ulixee/agent/compare/v1.0.0-alpha.9...v1.0.0-alpha.10) (2020-08-25)


### Bug Fixes

* dependency/path issues ([17a6813](https://github.com/ulixee/agent/commit/17a681335a3cd28cf7a668f5efd58229fa1cc59e))





# [1.0.0-alpha.9](https://github.com/ulixee/agent/compare/v1.0.0-alpha.8...v1.0.0-alpha.9) (2020-08-25)


### Bug Fixes

* **replay:** fix rendering doctype + svg ([ac36c79](https://github.com/ulixee/agent/commit/ac36c791c9d3611874900c65e8180b7daa1ed232))


### Features

* **ci:** windows tests ([fd5e9db](https://github.com/ulixee/agent/commit/fd5e9dbd2bdd1ac4fcba94f46e8cba4eb2ce7319))
* **core:** enhance logs ([a5b6d58](https://github.com/ulixee/agent/commit/a5b6d58a7fbf74415d7094b374f040ab1ca2890a))
* **emulators:** enable multi-engine support ([1e008c9](https://github.com/ulixee/agent/commit/1e008c9fe26c977ebf85c665d0891023342a58b5))
* **mitm:** support push streams ([1b2af06](https://github.com/ulixee/agent/commit/1b2af0655445929ac1f4fb8dcac011b9623a75d4))
* **replay:** stream data and simplify tick tracker ([91c350c](https://github.com/ulixee/agent/commit/91c350cdbf9f99c19754fbb5598afe62a13fb497))





# [1.0.0-alpha.8](https://github.com/ulixee/agent/compare/v1.0.0-alpha.6...v1.0.0-alpha.8) (2020-08-05)


### Bug Fixes

* **core:** core should autoclose if not started ([8d46a77](https://github.com/ulixee/agent/commit/8d46a775573733aa53cef1723fb71d60485fae9f)), closes [#41](https://github.com/ulixee/agent/issues/41)
* **socket:** http2 requests not reusing sockets ([3cbf853](https://github.com/ulixee/agent/commit/3cbf8531589536c763525086cfea407c3435ca9b))
* use os tmp directory ([e1f5a2b](https://github.com/ulixee/agent/commit/e1f5a2b7e63470b626ed906170b5c0337f5e0c43))
* windows tests ([c2943e8](https://github.com/ulixee/agent/commit/c2943e844d53c11f829baed60c449604e81544c8))


### Features

* **mitm:** record blocked and cached http ([bd47738](https://github.com/ulixee/agent/commit/bd47738e010c962e529a048d4ee33211d67a6d8f))
* **replay:** split app/replay in electron backend ([3b66eec](https://github.com/ulixee/agent/commit/3b66eec372900e764872857b67f80817f4ba2b9e))
* **session-state:** capture requests before send ([9607793](https://github.com/ulixee/agent/commit/960779370fa439d1c173e855bb8bdf907de9abc6))





# [1.0.0-alpha.7](https://github.com/ulixee/agent/compare/v1.0.0-alpha.6...v1.0.0-alpha.7) (2020-07-27)


### Bug Fixes

* use os tmp directory ([e1f5a2b](https://github.com/ulixee/agent/commit/e1f5a2b7e63470b626ed906170b5c0337f5e0c43))
* windows tests ([c2943e8](https://github.com/ulixee/agent/commit/c2943e844d53c11f829baed60c449604e81544c8))





# [1.0.0-alpha.6](https://github.com/ulixee/agent/compare/v1.0.0-alpha.5...v1.0.0-alpha.6) (2020-07-22)

**Note:** Version bump only for package @unblocked-web/agent-core





# [1.0.0-alpha.5](https://github.com/ulixee/agent/compare/v1.0.0-alpha.4...v1.0.0-alpha.5) (2020-07-21)

**Note:** Version bump only for package @unblocked-web/agent-core





# [1.0.0-alpha.4](https://github.com/ulixee/agent/compare/v1.0.0-alpha.3...v1.0.0-alpha.4) (2020-07-20)


### Bug Fixes

* **replay:** cover last tick on playbar ([baf12e7](https://github.com/ulixee/agent/commit/baf12e795fade634e60c64a342ea339ac6e8aa5c))
* **replay:** record close date when errors occcur ([2ce94dd](https://github.com/ulixee/agent/commit/2ce94dd694bba172028e8b7b00f0b3e0df0e0163)), closes [#31](https://github.com/ulixee/agent/issues/31)
* change shared package names ([d6181a7](https://github.com/ulixee/agent/commit/d6181a75a0387797177eb9aa2f71553bb7d31432))


### Features

* **replay:** add session logs, detect errors ([f1865c0](https://github.com/ulixee/agent/commit/f1865c0aef38f6722bbcdee0244288f0f6040c5a)), closes [#31](https://github.com/ulixee/agent/issues/31)
* **replay:** show commands in playbar ([58b9f7a](https://github.com/ulixee/agent/commit/58b9f7ac153480382cbd2f4c2f00aec64e7e852b))
* **replay:** start api from process ([403716b](https://github.com/ulixee/agent/commit/403716b3ba853c67ef15868fd6fb9fe1f60dbc1f))
* flatten shared workspaces ([d53da16](https://github.com/ulixee/agent/commit/d53da165d649163dcb724225a2ea43ce88d7eacc))





# 1.0.0-alpha.3 (2020-07-07)


### Bug Fixes

* **session-state:** Improve page recorder perf ([14f78b9](https://github.com/ulixee/agent/commit/14f78b9ede550ded32594dc0a773cc880bf02783)), closes [#8](https://github.com/ulixee/agent/issues/8)


### Features

* **dist:** improve packaging for double agent ([df195b6](https://github.com/ulixee/agent/commit/df195b630b90aea343e4bd3005d41b34c4d5431a))
* **emulators:** improve page logging ([cb73806](https://github.com/ulixee/agent/commit/cb73806408ef7c235e4ff70539c8cc49e5cd5d90))





# 1.0.0-alpha.2 (2020-06-27)


### Bug Fixes

* missing dependencies ([67504f0](https://github.com/ulixee/agent/commit/67504f0f070f35ded261ec3c9734d60422b75a96))





# 1.0.0-alpha.1 (2020-06-27)

**Note:** Version bump only for package @unblocked-web/agent-core





# 1.0.0-alpha.0 (2020-06-27)

**Note:** Version bump only for package @unblocked-web/agent-core
