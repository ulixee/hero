# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.4.1-alpha.4](https://github.com/ulixee/secret-agent/compare/v1.4.1-alpha.3...v1.4.1-alpha.4) (2021-04-20)

**Note:** Version bump only for package @secret-agent/puppet





## [1.4.1-alpha.3](https://github.com/ulixee/secret-agent/compare/v1.4.1-alpha.2...v1.4.1-alpha.3) (2021-04-20)


### Bug Fixes

* **core:** improve navigation tracking ([2e75570](https://github.com/ulixee/secret-agent/commit/2e755704d182c960d7844a03be9874360dc11ba4))
* **mitm:** fix ipc timeouts ([851be03](https://github.com/ulixee/secret-agent/commit/851be03be65fb0718b8af8230ab76360a7f006ef))
* **puppet:** dont double-create isolated world ([0df01e2](https://github.com/ulixee/secret-agent/commit/0df01e26184dca1f10aa0a43c8203b12e4eec8af))
* **puppet:** fix chrome-88 ([f917b52](https://github.com/ulixee/secret-agent/commit/f917b5237fd9010e041b68fa493a77bfd4d8fea0))


### Features

* **mitm:** support mitm per browser context ([f1dea45](https://github.com/ulixee/secret-agent/commit/f1dea4525dbac2faac04e2779a1be7312c100df5))
* **puppet:** convert to websocket ([43af64e](https://github.com/ulixee/secret-agent/commit/43af64e3ee6167bf8ff5c2f0c07977fc7a368ed1))





## [1.4.1-alpha.2](https://github.com/ulixee/secret-agent/compare/v1.4.1-alpha.1...v1.4.1-alpha.2) (2021-04-02)

**Note:** Version bump only for package @secret-agent/puppet





## [1.4.1-alpha.1](https://github.com/ulixee/secret-agent/compare/v1.4.1-alpha.0...v1.4.1-alpha.1) (2021-03-31)


### Bug Fixes

* **client:** fix logging dependency error ([22900c4](https://github.com/ulixee/secret-agent/commit/22900c49da47e8ce0d910c255d9b535527ce040d))
* **core:** fix failing interact test ([d0993e6](https://github.com/ulixee/secret-agent/commit/d0993e6539cdb10d502e8eec396414e04f6ad03c))
* **emulate:** mask widevine checks ([65e8655](https://github.com/ulixee/secret-agent/commit/65e8655e5d906ba538f9ebc84f21f7d6a5356f47))
* **puppet:** enable gpu by default ([9a06165](https://github.com/ulixee/secret-agent/commit/9a061657eaf844a385e17953cb7436181fadad6a))
* **puppet:** record logs for failing tests ([3d7ee18](https://github.com/ulixee/secret-agent/commit/3d7ee18101bf6c913438901d9191caf1116de35f))





## [1.4.1-alpha.0](https://github.com/ulixee/secret-agent/compare/v1.4.0-alpha.1...v1.4.1-alpha.0) (2021-03-23)


### Bug Fixes

* **emulator:** polyfill setAppBadge/clearAppBadge ([5cfa400](https://github.com/ulixee/secret-agent/commit/5cfa40082de419458656370622552c668b0a071f))


### Features

* **client:** expose frames ([44a6b12](https://github.com/ulixee/secret-agent/commit/44a6b129fef6f541cffc24e8913fd76defcf3aef))





# [1.4.0-alpha.1](https://github.com/ulixee/secret-agent/compare/v1.4.0-alpha.0...v1.4.0-alpha.1) (2021-03-11)


### Bug Fixes

* test timeout ([b7b6af2](https://github.com/ulixee/secret-agent/commit/b7b6af2a28d349df8e7e9aed49ca3bfe67ad08e1))





# [1.4.0-alpha.0](https://github.com/ulixee/secret-agent/compare/v1.3.1-alpha.1...v1.4.0-alpha.0) (2021-03-11)


### Bug Fixes

* **client:** translate errors when session n/a ([6c15793](https://github.com/ulixee/secret-agent/commit/6c15793f67cadfcf7d62e270848fbef895e397af))
* **mitm:** don’t wait for browser resources ([4c70bd5](https://github.com/ulixee/secret-agent/commit/4c70bd5ae89bf38cda80049d522e0b25f842240d)), closes [#176](https://github.com/ulixee/secret-agent/issues/176)
* removed unnecessary browserVersionDir in EngineFetcher ([9daa98a](https://github.com/ulixee/secret-agent/commit/9daa98a42234b27898e2e2c2bada3815a5826ba6))
* renamed some vars, removed chromium blocks, and modified BrowserFetcher ([60955b2](https://github.com/ulixee/secret-agent/commit/60955b259c15c887e20ae423ed8683caed80751d))
* **puppet:** extract linux chrome ([55f8ef5](https://github.com/ulixee/secret-agent/commit/55f8ef57ba410685697f5dc73f923026c8b0c4a6))
* **puppet:** no chrome launch errors to client ([1e636a6](https://github.com/ulixee/secret-agent/commit/1e636a6625c47c67ee8a4e7d5be05ce99b513a5f))


### Features

* **puppet:** switch to chrome ([d064e53](https://github.com/ulixee/secret-agent/commit/d064e53ace2107ac95348cf721c3cc35afe07efc))
* **puppet:** unsupported linux install message ([fe6e634](https://github.com/ulixee/secret-agent/commit/fe6e63472a813c6275433b8dfb00e094c49c8a6a))
* **puppet:** update docker to for new installs ([19351b5](https://github.com/ulixee/secret-agent/commit/19351b556718161c885b5dfb12f7fa80af8daf46))





# [1.3.0-alpha.4](https://github.com/ulixee/secret-agent/compare/v1.3.0-alpha.3...v1.3.0-alpha.4) (2021-02-15)


### Bug Fixes

* **core:** only reject navigation with errors ([7e7cfd3](https://github.com/ulixee/secret-agent/commit/7e7cfd37cff860422d8c46bed90eba31652df9d5)), closes [#153](https://github.com/ulixee/secret-agent/issues/153)
* **core/client:** export usable mjs/cjs ([ca149ef](https://github.com/ulixee/secret-agent/commit/ca149efbfbdf03da0fda7d127348e5de6f2a4f8b))
* **puppet:** fix waiting for worker ready ([e511009](https://github.com/ulixee/secret-agent/commit/e51100900dd52c6962639bab240f1cdac24f5d50))





# [1.3.0-alpha.3](https://github.com/ulixee/secret-agent/compare/v1.3.0-alpha.2...v1.3.0-alpha.3) (2021-02-11)


### Bug Fixes

* **puppet:** non-popups getting opener ([e79584f](https://github.com/ulixee/secret-agent/commit/e79584f5b71557bebe86b0301a8a0e9e55d8ac8f))





# [1.3.0-alpha.2](https://github.com/ulixee/secret-agent/compare/v1.3.0-alpha.1...v1.3.0-alpha.2) (2021-02-09)

**Note:** Version bump only for package @secret-agent/puppet





# [1.3.0-alpha.1](https://github.com/ulixee/secret-agent/compare/v1.3.0-alpha.0...v1.3.0-alpha.1) (2021-02-06)


### Features

* replaced chrome 80, 81, 83 emulators with more robust os-level data ([276b269](https://github.com/ulixee/secret-agent/commit/276b26923368c5ed5636f65ad14fb2b3a9f87e9e))
* **core:** tweak logging for not-really-errors ([bd5f9eb](https://github.com/ulixee/secret-agent/commit/bd5f9ebf38eb58adc14542dc4e32737b0ad8ff9e))





# [1.3.0-alpha.0](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.5...v1.3.0-alpha.0) (2021-02-02)


### Bug Fixes

* **core:** full close down of on premature exit ([aa53e85](https://github.com/ulixee/secret-agent/commit/aa53e85782a57da4d69f8750a5c3719c60683f5b))


### Features

* **client:** coreConnection as configuration ([ac284ca](https://github.com/ulixee/secret-agent/commit/ac284cac3fa867a9623fd841edf96d04906e3072))
* **core:** add screenshot capability ([f075f89](https://github.com/ulixee/secret-agent/commit/f075f89636edb81c4626c51929665373069de31a))
* **core:** confirm mouse clicks hit targets ([bf2b047](https://github.com/ulixee/secret-agent/commit/bf2b047ca9e49665f7f150e66780b79fd02b7972))
* **core:** convert closing logs to stats ([382979d](https://github.com/ulixee/secret-agent/commit/382979df1a758de82297169465be0e57c2c87b53))
* **core:** merge injected scripts into core ([f674f7b](https://github.com/ulixee/secret-agent/commit/f674f7b85a9cf66dd3558d849a78f6b9aa1099dc))
* **replay:** single install of replay ([5425bee](https://github.com/ulixee/secret-agent/commit/5425bee76488ac5bff4f46d8b99eb874dd7f5a35))





# [1.2.0-alpha.5](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.4...v1.2.0-alpha.5) (2020-12-29)

**Note:** Version bump only for package @secret-agent/puppet





# [1.2.0-alpha.4](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.3...v1.2.0-alpha.4) (2020-12-22)

**Note:** Version bump only for package @secret-agent/puppet





# [1.2.0-alpha.3](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.2...v1.2.0-alpha.3) (2020-12-16)


### Bug Fixes

* **replay:** multiple sessions showing incorrectly ([20ba30c](https://github.com/ulixee/secret-agent/commit/20ba30caebcef42de65dee18e6b82d92c7193d9c))


### Features

* **client:** update awaited dom to 1.1.8 ([a1b9b68](https://github.com/ulixee/secret-agent/commit/a1b9b68e735ee54ceaef3436c43df0d0744c8f47))





# [1.2.0-alpha.2](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.1...v1.2.0-alpha.2) (2020-12-01)


### Bug Fixes

* **emulate-humans:** fix some tests ([b1e05d7](https://github.com/ulixee/secret-agent/commit/b1e05d79168fdf60f4ba6c63b8b74441c5c52f56))
* **eslint:** add return types to client code ([c2e31cc](https://github.com/ulixee/secret-agent/commit/c2e31ccba4974f2bda269e77e6df9b82a2695d4f))





# [1.2.0-alpha.1](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.0...v1.2.0-alpha.1) (2020-11-20)


### Features

* **human-emulators:** ghost emulator ([70bcf27](https://github.com/ulixee/secret-agent/commit/70bcf273a2e995f8168dced9797d441b6eaec80b))





# [1.2.0-alpha.0](https://github.com/ulixee/secret-agent/compare/v1.1.0-alpha.1...v1.2.0-alpha.0) (2020-11-11)


### Features

* **awaited-dom:** documentation for props ([029a1f5](https://github.com/ulixee/secret-agent/commit/029a1f5b10cc13119d4bb808d35f80cce4aeb3dd))





# [1.1.0-alpha.1](https://github.com/ulixee/secret-agent/compare/v1.1.0-alpha.0...v1.1.0-alpha.1) (2020-11-05)


### Features

* **client:** get/set/delete cookies + domstorage ([2e2de6b](https://github.com/ulixee/secret-agent/commit/2e2de6b9f2debf5eadf54b03b3f8d9db7cace269))





# [1.1.0-alpha.0](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.21...v1.1.0-alpha.0) (2020-11-03)

**Note:** Version bump only for package @secret-agent/puppet





# [1.0.0-alpha.21](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.20...v1.0.0-alpha.21) (2020-11-02)


### Features

* **locale:** add locale emulation + tests ([57cc7ff](https://github.com/ulixee/secret-agent/commit/57cc7ff8c342dc27a477b16cca066dffb9687e2f))
* **replay:** set screen viewport ([f818ff5](https://github.com/ulixee/secret-agent/commit/f818ff5577d49d284a4116d328e78dc1d235824a))
* **session:** track frame dom node ids ([a41d678](https://github.com/ulixee/secret-agent/commit/a41d6786d6fd10a386d9c2739713a26b6063b127))





# [1.0.0-alpha.20](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.19...v1.0.0-alpha.20) (2020-10-23)


### Bug Fixes

* **puppet:** stabilize chained nav ([7a99f69](https://github.com/ulixee/secret-agent/commit/7a99f693da6f03c6c77d2b604e55b6f70dd25adc))


### Features

* **mitm:** store ca/keys in network.db ([fd69f97](https://github.com/ulixee/secret-agent/commit/fd69f97cee898720d5e5a5b30e0697b728c6e8d4))
* **puppet:** use mouse wheel events ([1efea8a](https://github.com/ulixee/secret-agent/commit/1efea8abcf094d8c6644ecdedd5f0069b2fd909c))
* **session-state:** record devtools logs ([784da7f](https://github.com/ulixee/secret-agent/commit/784da7f7728671485bce55b877fa350981c88ea2))





# [1.0.0-alpha.19](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.18...v1.0.0-alpha.19) (2020-10-13)

**Note:** Version bump only for package @secret-agent/puppet





# [1.0.0-alpha.18](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.17...v1.0.0-alpha.18) (2020-10-13)

**Note:** Version bump only for package @secret-agent/puppet





# [1.0.0-alpha.17](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.16...v1.0.0-alpha.17) (2020-10-13)

**Note:** Version bump only for package @secret-agent/puppet





# [1.0.0-alpha.16](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.15...v1.0.0-alpha.16) (2020-10-13)


### Bug Fixes

* **core:** wait for location change on new tab ([0c70d6e](https://github.com/ulixee/secret-agent/commit/0c70d6e7553025222b9fe4139407be4d69ee20b9))





# [1.0.0-alpha.15](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.14...v1.0.0-alpha.15) (2020-10-06)

**Note:** Version bump only for package @secret-agent/puppet





# [1.0.0-alpha.14](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.13...v1.0.0-alpha.14) (2020-10-06)


### Bug Fixes

* **client:** don’t shutdown on rejected promises ([86a331b](https://github.com/ulixee/secret-agent/commit/86a331bede88daca8b17c079f23910ff776fb4c4))
* **mitm:** change headers after alpn is set ([a21d4ca](https://github.com/ulixee/secret-agent/commit/a21d4cab3f3adcc9e413f976ac6864ae85cb053e))







**Note:** Version bump only for package @secret-agent/puppet





# [1.0.0-alpha.12](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.11...v1.0.0-alpha.12) (2020-09-29)


### Bug Fixes

* **puppet:** chrome 80 test flakiness ([9f16cd1](https://github.com/ulixee/secret-agent/commit/9f16cd1993e0bd038f748b2b986bd69a311b11f6))
* lint and puppet test chrome 80 ([0ce09ac](https://github.com/ulixee/secret-agent/commit/0ce09ac71e3f9a9a802ba90f9c7aab9021f07e5c))


### Features

* **core:** back/forward api ([805af3d](https://github.com/ulixee/secret-agent/commit/805af3d48822c1306b73f5c084d65b0855819213)), closes [#32](https://github.com/ulixee/secret-agent/issues/32)
* **puppet:** add puppet interfaces abstraction ([69bae38](https://github.com/ulixee/secret-agent/commit/69bae38a03afaae3455de2a4928abd13031af662))
* **puppet:** import playwright tests ([e2b9bf5](https://github.com/ulixee/secret-agent/commit/e2b9bf546af1ed899a01f460977e362b676c02e1))
* **replay:** spawned child tabs ([8ae0d75](https://github.com/ulixee/secret-agent/commit/8ae0d754a8e263a6cae20815338532da84906a7b))
* **replay:** split session state by tab ([9367f2d](https://github.com/ulixee/secret-agent/commit/9367f2d8796fda709bc8185374a5e07d4b6f78ab))
