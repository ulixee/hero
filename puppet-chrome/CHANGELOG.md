# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.4.1-alpha.3](https://github.com/ulixee/secret-agent/compare/v1.4.1-alpha.2...v1.4.1-alpha.3) (2021-04-20)


### Bug Fixes

* **core:** fix location change triggers ([360dfa0](https://github.com/ulixee/secret-agent/commit/360dfa0325bb5b87fe299c387d48b4bbcf45cabe))
* **core:** fix looping for node id lookup ([91ac3bc](https://github.com/ulixee/secret-agent/commit/91ac3bcabe75bc8c4ef58518671727fc22e6a6b6))
* **core:** improve navigation tracking ([2e75570](https://github.com/ulixee/secret-agent/commit/2e755704d182c960d7844a03be9874360dc11ba4))
* **core:** properly record back/forward nav ([6a1a52a](https://github.com/ulixee/secret-agent/commit/6a1a52a5551c18d87d0c545bb0a3748e49e2cbdd))
* **puppet:** dont double-create isolated world ([0df01e2](https://github.com/ulixee/secret-agent/commit/0df01e26184dca1f10aa0a43c8203b12e4eec8af))
* **puppet:** fix chrome-88 ([f917b52](https://github.com/ulixee/secret-agent/commit/f917b5237fd9010e041b68fa493a77bfd4d8fea0))


### Features

* **mitm:** support mitm per browser context ([f1dea45](https://github.com/ulixee/secret-agent/commit/f1dea4525dbac2faac04e2779a1be7312c100df5))
* updated chrome 80, 81, 83 + added 84, 85, 86, 87, and 88 ([62f9638](https://github.com/ulixee/secret-agent/commit/62f96389abbe8c095d4eafb229293f8ee247edad))





## [1.4.1-alpha.2](https://github.com/ulixee/secret-agent/compare/v1.4.1-alpha.1...v1.4.1-alpha.2) (2021-04-02)

**Note:** Version bump only for package @secret-agent/puppet-chrome





## [1.4.1-alpha.1](https://github.com/ulixee/secret-agent/compare/v1.4.1-alpha.0...v1.4.1-alpha.1) (2021-03-31)


### Bug Fixes

* **core:** fix failing interact test ([d0993e6](https://github.com/ulixee/secret-agent/commit/d0993e6539cdb10d502e8eec396414e04f6ad03c))
* **emulate:** mask widevine checks ([65e8655](https://github.com/ulixee/secret-agent/commit/65e8655e5d906ba538f9ebc84f21f7d6a5356f47))
* **puppet:** enable gpu by default ([9a06165](https://github.com/ulixee/secret-agent/commit/9a061657eaf844a385e17953cb7436181fadad6a))





## [1.4.1-alpha.0](https://github.com/ulixee/secret-agent/compare/v1.4.0-alpha.1...v1.4.1-alpha.0) (2021-03-23)


### Bug Fixes

* **core:** type serializer, fix null headers issue ([e4d832b](https://github.com/ulixee/secret-agent/commit/e4d832b62278c67c59edb7bb6d0b2097a6b8669b))
* **mitm:** fix url error ([d53ae18](https://github.com/ulixee/secret-agent/commit/d53ae18a905fce3fea45a1e19edd9498ed4c54bd))
* **puppet:** don’t emit timeouts ([1dd386f](https://github.com/ulixee/secret-agent/commit/1dd386f7cde45a66c7976a63b1e162b5b93863f1))
* **puppet:** handle crashed windows ([290e923](https://github.com/ulixee/secret-agent/commit/290e923544008c3cd84b568c2d8a7c2f0de38437))


### Features

* **client:** expose frames ([44a6b12](https://github.com/ulixee/secret-agent/commit/44a6b129fef6f541cffc24e8913fd76defcf3aef))





# [1.4.0-alpha.1](https://github.com/ulixee/secret-agent/compare/v1.4.0-alpha.0...v1.4.0-alpha.1) (2021-03-11)

**Note:** Version bump only for package @secret-agent/puppet-chrome





# [1.4.0-alpha.0](https://github.com/ulixee/secret-agent/compare/v1.3.1-alpha.1...v1.4.0-alpha.0) (2021-03-11)


### Bug Fixes

* **client:** resource timeout + blank new tab ([4fdd378](https://github.com/ulixee/secret-agent/commit/4fdd3789edf9c2a7290b4deb660aa2d7194ec9c8))
* **client:** translate errors when session n/a ([6c15793](https://github.com/ulixee/secret-agent/commit/6c15793f67cadfcf7d62e270848fbef895e397af))
* **core:** handle canceled navigation redirect ([348c058](https://github.com/ulixee/secret-agent/commit/348c05863519ad6daaf8386c35a2b021883bd386))
* **core:** try to fix tab test ([2f74a1e](https://github.com/ulixee/secret-agent/commit/2f74a1e48f2aa04d05c9826ac654de88686af597))
* **mitm:** don’t wait for browser resources ([4c70bd5](https://github.com/ulixee/secret-agent/commit/4c70bd5ae89bf38cda80049d522e0b25f842240d)), closes [#176](https://github.com/ulixee/secret-agent/issues/176)
* renamed some vars, removed chromium blocks, and modified BrowserFetcher ([60955b2](https://github.com/ulixee/secret-agent/commit/60955b259c15c887e20ae423ed8683caed80751d))
* **puppet:** no chrome launch errors to client ([1e636a6](https://github.com/ulixee/secret-agent/commit/1e636a6625c47c67ee8a4e7d5be05ce99b513a5f))


### Features

* **puppet:** switch to chrome ([d064e53](https://github.com/ulixee/secret-agent/commit/d064e53ace2107ac95348cf721c3cc35afe07efc))





# [1.3.0-alpha.4](https://github.com/ulixee/secret-agent/compare/v1.3.0-alpha.3...v1.3.0-alpha.4) (2021-02-15)


### Bug Fixes

* **core/client:** export usable mjs/cjs ([ca149ef](https://github.com/ulixee/secret-agent/commit/ca149efbfbdf03da0fda7d127348e5de6f2a4f8b))


### Features

* **client:** add http cache and load failures ([571e64f](https://github.com/ulixee/secret-agent/commit/571e64f108df7a0cbfd32609c37ff76261014dc6))
* **emulate:** workers run stealth scripts ([e6e845e](https://github.com/ulixee/secret-agent/commit/e6e845e68654c73ddaefe2110065a20d044f773d))





# [1.3.0-alpha.3](https://github.com/ulixee/secret-agent/compare/v1.3.0-alpha.2...v1.3.0-alpha.3) (2021-02-11)


### Bug Fixes

* **core:** cancel interaction on navigate ([eaa6605](https://github.com/ulixee/secret-agent/commit/eaa6605d9325618cde2a281aa699ab4a6d82be83))
* **core:** only wait for main frame ([52d36d8](https://github.com/ulixee/secret-agent/commit/52d36d81609f65105cc30667378d67155b271f76))
* **puppet:** non-popups getting opener ([e79584f](https://github.com/ulixee/secret-agent/commit/e79584f5b71557bebe86b0301a8a0e9e55d8ac8f))





# [1.3.0-alpha.2](https://github.com/ulixee/secret-agent/compare/v1.3.0-alpha.1...v1.3.0-alpha.2) (2021-02-09)


### Bug Fixes

* **mitm:** read failed/cached browser resources ([150db8b](https://github.com/ulixee/secret-agent/commit/150db8b3785705afdc54b915684ae0c828a5ecf8))





# [1.3.0-alpha.1](https://github.com/ulixee/secret-agent/compare/v1.3.0-alpha.0...v1.3.0-alpha.1) (2021-02-06)


### Features

* **core:** tweak logging for not-really-errors ([bd5f9eb](https://github.com/ulixee/secret-agent/commit/bd5f9ebf38eb58adc14542dc4e32737b0ad8ff9e))





# [1.3.0-alpha.0](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.5...v1.3.0-alpha.0) (2021-02-02)


### Bug Fixes

* **core:** full close down of on premature exit ([aa53e85](https://github.com/ulixee/secret-agent/commit/aa53e85782a57da4d69f8750a5c3719c60683f5b))
* **mitm:** preflight requests not always sent ([45ebe22](https://github.com/ulixee/secret-agent/commit/45ebe224cd60c9e518139ff40786b90ee640be52))
* **puppet:** assigning wrong id to network fetches ([c4b6746](https://github.com/ulixee/secret-agent/commit/c4b674655ceff4a4642fe9aada355709dc243e22))
* **puppet:** fallback to requestid in fetch ([28ad324](https://github.com/ulixee/secret-agent/commit/28ad3242d679c8fa1d67e2f278f559a61fdd46ff))
* **puppet:** launch non-default (83) headed chrome ([84a02aa](https://github.com/ulixee/secret-agent/commit/84a02aa48db41ecb3a1e831e56a4bf1fb805486e))
* mitm session ports were getting reused and conflicting ([0e11465](https://github.com/ulixee/secret-agent/commit/0e11465d3882234e1cc650f372155458ea8bd6e1))


### Features

* **client:** built-in remote + handlers ([bfaa739](https://github.com/ulixee/secret-agent/commit/bfaa739517a458db9dd1bd6374770840eb95b847))
* **client:** coreConnection as configuration ([ac284ca](https://github.com/ulixee/secret-agent/commit/ac284cac3fa867a9623fd841edf96d04906e3072))
* **core:** add screenshot capability ([f075f89](https://github.com/ulixee/secret-agent/commit/f075f89636edb81c4626c51929665373069de31a))
* **core:** confirm mouse clicks hit targets ([bf2b047](https://github.com/ulixee/secret-agent/commit/bf2b047ca9e49665f7f150e66780b79fd02b7972))
* **core:** convert all connections to server ([a27fafd](https://github.com/ulixee/secret-agent/commit/a27fafd9a04e52f602a557f7304164c2308006c6))
* **core:** convert closing logs to stats ([382979d](https://github.com/ulixee/secret-agent/commit/382979df1a758de82297169465be0e57c2c87b53))
* **core:** merge injected scripts into core ([f674f7b](https://github.com/ulixee/secret-agent/commit/f674f7b85a9cf66dd3558d849a78f6b9aa1099dc))
* **core:** merge session-state and core ([dcc6002](https://github.com/ulixee/secret-agent/commit/dcc6002c2003d981267e51c8dacf5201fe3b9fda))
* **core:** timeouts for back/fwd/goto, add reload ([bae2a8e](https://github.com/ulixee/secret-agent/commit/bae2a8eaf20b2a855c98986d5c2c9b5e11b004ec))
* **core:** waitForPaintingStable ([1955b79](https://github.com/ulixee/secret-agent/commit/1955b791ce8a7cf20a679986e63885950efa6813))
* **replay:** single install of replay ([5425bee](https://github.com/ulixee/secret-agent/commit/5425bee76488ac5bff4f46d8b99eb874dd7f5a35))
* mv renderingOptions => blockedResourceTypes ([ffa1b74](https://github.com/ulixee/secret-agent/commit/ffa1b74d0b470387ec104027667e8523a51bfa15)), closes [#113](https://github.com/ulixee/secret-agent/issues/113)


### BREAKING CHANGES

* renames “renderingOptions” to “blockedResourceTypes”. Default is now “None”





# [1.2.0-alpha.5](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.4...v1.2.0-alpha.5) (2020-12-29)


### Bug Fixes

* **puppet:** workers not tracking devtools calls ([b339758](https://github.com/ulixee/secret-agent/commit/b339758c8bb5b2076f1337dee3d0deefaf3fb7ad))





# [1.2.0-alpha.4](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.3...v1.2.0-alpha.4) (2020-12-22)

**Note:** Version bump only for package @secret-agent/puppet-chrome





# [1.2.0-alpha.3](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.2...v1.2.0-alpha.3) (2020-12-16)


### Bug Fixes

* **mitm:** bubble proxy errors properly to client ([b6a72f5](https://github.com/ulixee/secret-agent/commit/b6a72f59ef8e7739654ab82b170aa0e15d38ebd0)), closes [#98](https://github.com/ulixee/secret-agent/issues/98)


### Features

* **client:** update awaited dom to 1.1.8 ([a1b9b68](https://github.com/ulixee/secret-agent/commit/a1b9b68e735ee54ceaef3436c43df0d0744c8f47))





# [1.2.0-alpha.2](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.1...v1.2.0-alpha.2) (2020-12-01)

**Note:** Version bump only for package @secret-agent/puppet-chrome





# [1.2.0-alpha.1](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.0...v1.2.0-alpha.1) (2020-11-20)


### Features

* **human-emulators:** ghost emulator ([70bcf27](https://github.com/ulixee/secret-agent/commit/70bcf273a2e995f8168dced9797d441b6eaec80b))





# [1.2.0-alpha.0](https://github.com/ulixee/secret-agent/compare/v1.1.0-alpha.1...v1.2.0-alpha.0) (2020-11-11)

**Note:** Version bump only for package @secret-agent/puppet-chrome





# [1.1.0-alpha.1](https://github.com/ulixee/secret-agent/compare/v1.1.0-alpha.0...v1.1.0-alpha.1) (2020-11-05)


### Features

* **client:** get/set/delete cookies + domstorage ([2e2de6b](https://github.com/ulixee/secret-agent/commit/2e2de6b9f2debf5eadf54b03b3f8d9db7cace269))





# [1.1.0-alpha.0](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.21...v1.1.0-alpha.0) (2020-11-03)


### Bug Fixes

* **puppet:** incorrect reuse of executionContextId ([e5d8f8d](https://github.com/ulixee/secret-agent/commit/e5d8f8d1e90c7cebefae51b570ddb743ea8f39fe))





# [1.0.0-alpha.21](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.20...v1.0.0-alpha.21) (2020-11-02)


### Bug Fixes

* bugs in replay ([2bf8808](https://github.com/ulixee/secret-agent/commit/2bf8808ae115ba9ea9f3cc64f3eba673fcb311aa))


### Features

* **locale:** add locale emulation + tests ([57cc7ff](https://github.com/ulixee/secret-agent/commit/57cc7ff8c342dc27a477b16cca066dffb9687e2f))
* **replay:** add support for iframe and shadows ([0978fd5](https://github.com/ulixee/secret-agent/commit/0978fd55802ebf4285a48ef1ce0d208e2d21aeba))
* **replay:** set screen viewport ([f818ff5](https://github.com/ulixee/secret-agent/commit/f818ff5577d49d284a4116d328e78dc1d235824a))
* **session:** track frame dom node ids ([a41d678](https://github.com/ulixee/secret-agent/commit/a41d6786d6fd10a386d9c2739713a26b6063b127))





# [1.0.0-alpha.20](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.19...v1.0.0-alpha.20) (2020-10-23)


### Bug Fixes

* order of session closing ([046243b](https://github.com/ulixee/secret-agent/commit/046243b7b2f84f633674dbe23122eb1d58ca431c))
* **puppet:** stabilize chained nav ([7a99f69](https://github.com/ulixee/secret-agent/commit/7a99f693da6f03c6c77d2b604e55b6f70dd25adc))


### Features

* **mitm:** store ca/keys in network.db ([fd69f97](https://github.com/ulixee/secret-agent/commit/fd69f97cee898720d5e5a5b30e0697b728c6e8d4))
* **puppet:** use mouse wheel events ([1efea8a](https://github.com/ulixee/secret-agent/commit/1efea8abcf094d8c6644ecdedd5f0069b2fd909c))
* **session-state:** record devtools logs ([784da7f](https://github.com/ulixee/secret-agent/commit/784da7f7728671485bce55b877fa350981c88ea2))
* **session-state:** record mitm resource states ([08976df](https://github.com/ulixee/secret-agent/commit/08976dfa95f3b2629aedaca3002cc07b97e5bd2e))





# [1.0.0-alpha.19](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.18...v1.0.0-alpha.19) (2020-10-13)

**Note:** Version bump only for package @secret-agent/puppet-chrome





# [1.0.0-alpha.18](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.17...v1.0.0-alpha.18) (2020-10-13)

**Note:** Version bump only for package @secret-agent/puppet-chrome





# [1.0.0-alpha.17](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.16...v1.0.0-alpha.17) (2020-10-13)

**Note:** Version bump only for package @secret-agent/puppet-chrome





# [1.0.0-alpha.16](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.15...v1.0.0-alpha.16) (2020-10-13)


### Bug Fixes

* **core:** wait for location change on new tab ([0c70d6e](https://github.com/ulixee/secret-agent/commit/0c70d6e7553025222b9fe4139407be4d69ee20b9))





# [1.0.0-alpha.15](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.14...v1.0.0-alpha.15) (2020-10-06)

**Note:** Version bump only for package @secret-agent/puppet-chrome





# [1.0.0-alpha.14](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.13...v1.0.0-alpha.14) (2020-10-06)


### Bug Fixes

* **client:** don’t shutdown on rejected promises ([86a331b](https://github.com/ulixee/secret-agent/commit/86a331bede88daca8b17c079f23910ff776fb4c4))
* **mitm:** change headers after alpn is set ([a21d4ca](https://github.com/ulixee/secret-agent/commit/a21d4cab3f3adcc9e413f976ac6864ae85cb053e))







**Note:** Version bump only for package @secret-agent/puppet-chrome





# [1.0.0-alpha.12](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.11...v1.0.0-alpha.12) (2020-09-29)


### Bug Fixes

* **puppet:** chrome 80 test flakiness ([9f16cd1](https://github.com/ulixee/secret-agent/commit/9f16cd1993e0bd038f748b2b986bd69a311b11f6))
* lint and puppet test chrome 80 ([0ce09ac](https://github.com/ulixee/secret-agent/commit/0ce09ac71e3f9a9a802ba90f9c7aab9021f07e5c))
* refactor to pause debugger on attach ([63a9bd1](https://github.com/ulixee/secret-agent/commit/63a9bd125e7f334a85a2dedc2490f4e66366ea6d))


### Features

* **puppet:** add puppet interfaces abstraction ([69bae38](https://github.com/ulixee/secret-agent/commit/69bae38a03afaae3455de2a4928abd13031af662))
* **puppet:** import playwright tests ([e2b9bf5](https://github.com/ulixee/secret-agent/commit/e2b9bf546af1ed899a01f460977e362b676c02e1))
* **replay:** spawned child tabs ([8ae0d75](https://github.com/ulixee/secret-agent/commit/8ae0d754a8e263a6cae20815338532da84906a7b))
* **replay:** split session state by tab ([9367f2d](https://github.com/ulixee/secret-agent/commit/9367f2d8796fda709bc8185374a5e07d4b6f78ab))
* import and shrink puppeteer ([b1816b8](https://github.com/ulixee/secret-agent/commit/b1816b8f7b1a60edd456626e3c818e4ebe3c022f))
