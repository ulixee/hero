# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.3.0-alpha.3](https://github.com/ulixee/secret-agent/compare/v1.3.0-alpha.2...v1.3.0-alpha.3) (2021-02-11)


### Bug Fixes

* **core:** cancel interaction on navigate ([eaa6605](https://github.com/ulixee/secret-agent/commit/eaa6605d9325618cde2a281aa699ab4a6d82be83))
* **core:** only wait for main frame ([52d36d8](https://github.com/ulixee/secret-agent/commit/52d36d81609f65105cc30667378d67155b271f76))
* **puppet:** non-popups getting opener ([e79584f](https://github.com/ulixee/secret-agent/commit/e79584f5b71557bebe86b0301a8a0e9e55d8ac8f))





# [1.3.0-alpha.2](https://github.com/ulixee/secret-agent/compare/v1.3.0-alpha.1...v1.3.0-alpha.2) (2021-02-09)


### Bug Fixes

* **client:** correctly catch some canceled promise ([1d5906f](https://github.com/ulixee/secret-agent/commit/1d5906f5bff7e757bd084bb98883b56f3cf22bbe))
* **mitm:** read failed/cached browser resources ([150db8b](https://github.com/ulixee/secret-agent/commit/150db8b3785705afdc54b915684ae0c828a5ecf8))





# [1.3.0-alpha.1](https://github.com/ulixee/secret-agent/compare/v1.3.0-alpha.0...v1.3.0-alpha.1) (2021-02-06)


### Bug Fixes

* sessionId should be set on browserEmulator regardless of user Profile ([083260d](https://github.com/ulixee/secret-agent/commit/083260dcfd47037879bf2bec8bed56f47eae8a41))


### Features

* replaced chrome 80, 81, 83 emulators with more robust os-level data ([276b269](https://github.com/ulixee/secret-agent/commit/276b26923368c5ed5636f65ad14fb2b3a9f87e9e))
* **core:** friendly message setting cookies ([a9d9ecf](https://github.com/ulixee/secret-agent/commit/a9d9ecf054f6e21db037093fc255ae8fc26da3a7)), closes [#142](https://github.com/ulixee/secret-agent/issues/142)
* **core:** tweak logging for not-really-errors ([bd5f9eb](https://github.com/ulixee/secret-agent/commit/bd5f9ebf38eb58adc14542dc4e32737b0ad8ff9e))





# [1.3.0-alpha.0](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.5...v1.3.0-alpha.0) (2021-02-02)


### Bug Fixes

* **core:** full close down of on premature exit ([aa53e85](https://github.com/ulixee/secret-agent/commit/aa53e85782a57da4d69f8750a5c3719c60683f5b))
* **core:** handle visible for height > innerHeight ([b7a1e65](https://github.com/ulixee/secret-agent/commit/b7a1e65dced687fb3df0677a26e6b56cc1e34c97))
* **core:** isVisible fix, scroll below 0 fix ([7c0c451](https://github.com/ulixee/secret-agent/commit/7c0c451a2bf4675fc07205649ca78bc56fe7890c))
* **emulators:** safari cookie handling fix ([3507c26](https://github.com/ulixee/secret-agent/commit/3507c2665afd6e94b5f99633e748fa4d455d81db))
* **puppet:** launch non-default (83) headed chrome ([84a02aa](https://github.com/ulixee/secret-agent/commit/84a02aa48db41ecb3a1e831e56a4bf1fb805486e))
* **replay:** fix replay launch in new setup on win ([add1b97](https://github.com/ulixee/secret-agent/commit/add1b97084d9d83f0cdad77362a238aeef92cf68))
* allow setting SA_SHOW_REPLAY in a script ([18d63d6](https://github.com/ulixee/secret-agent/commit/18d63d640dc69e83512908bbdec1263aba87d953))
* converted some props of IBrowserEmulator to optional ([8e74bed](https://github.com/ulixee/secret-agent/commit/8e74bed69d03bbc961292d4a3b89f9706cb1d555))
* mitm session ports were getting reused and conflicting ([0e11465](https://github.com/ulixee/secret-agent/commit/0e11465d3882234e1cc650f372155458ea8bd6e1))
* updated some things to work with Slab ([51dada5](https://github.com/ulixee/secret-agent/commit/51dada5d267ec05a6dbe3d1da9f62b4f3754d5a1))
* viewports window width/height must include frame border width/height ([cca0c8e](https://github.com/ulixee/secret-agent/commit/cca0c8ec66bee1eafd7dcac2564eb8e0fc18747c))


### Features

* **client:** add ability to get agent metadata ([55df775](https://github.com/ulixee/secret-agent/commit/55df775b3b9e78db99bc726ae54a683cc701a7e2))
* **client:** built-in remote + handlers ([bfaa739](https://github.com/ulixee/secret-agent/commit/bfaa739517a458db9dd1bd6374770840eb95b847))
* **client:** coreConnection as configuration ([ac284ca](https://github.com/ulixee/secret-agent/commit/ac284cac3fa867a9623fd841edf96d04906e3072))
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
* **replay:** ability to launch via bin ([518d320](https://github.com/ulixee/secret-agent/commit/518d320e157b4d28e0ce99864c4f53aa5fa439a8))
* **replay:** single install of replay ([5425bee](https://github.com/ulixee/secret-agent/commit/5425bee76488ac5bff4f46d8b99eb874dd7f5a35))
* mv renderingOptions => blockedResourceTypes ([ffa1b74](https://github.com/ulixee/secret-agent/commit/ffa1b74d0b470387ec104027667e8523a51bfa15)), closes [#113](https://github.com/ulixee/secret-agent/issues/113)
* **website:** blog post on handlers ([8024f03](https://github.com/ulixee/secret-agent/commit/8024f0343e63689afd9aba589e80816a5880f838))
* browser window size now takes into calculation os nav bars ([ab65a65](https://github.com/ulixee/secret-agent/commit/ab65a650e4b63e77ad5e165f7a60e3e024140f66))
* randomize the Viewports browser positionX/Y ([66c1f4a](https://github.com/ulixee/secret-agent/commit/66c1f4a89a434352ae5c8add46481c1f6d28f03f))


### BREAKING CHANGES

* renames “renderingOptions” to “blockedResourceTypes”. Default is now “None”





# [1.2.0-alpha.5](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.4...v1.2.0-alpha.5) (2020-12-29)

**Note:** Version bump only for package @secret-agent/core





# [1.2.0-alpha.4](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.3...v1.2.0-alpha.4) (2020-12-22)

**Note:** Version bump only for package @secret-agent/core





# [1.2.0-alpha.3](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.2...v1.2.0-alpha.3) (2020-12-16)


### Bug Fixes

* **mitm:** bubble proxy errors properly to client ([b6a72f5](https://github.com/ulixee/secret-agent/commit/b6a72f59ef8e7739654ab82b170aa0e15d38ebd0)), closes [#98](https://github.com/ulixee/secret-agent/issues/98)
* **replay:** multiple sessions showing incorrectly ([20ba30c](https://github.com/ulixee/secret-agent/commit/20ba30caebcef42de65dee18e6b82d92c7193d9c))


### Features

* **client:** update awaited dom to 1.1.8 ([a1b9b68](https://github.com/ulixee/secret-agent/commit/a1b9b68e735ee54ceaef3436c43df0d0744c8f47))





# [1.2.0-alpha.2](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.1...v1.2.0-alpha.2) (2020-12-01)


### Bug Fixes

* **core:** fix errors on goto bubbling up ([30d4208](https://github.com/ulixee/secret-agent/commit/30d4208c079e171fd6e0640810a4812e0a9a3d59))
* **emulate-humans:** fix some tests ([b1e05d7](https://github.com/ulixee/secret-agent/commit/b1e05d79168fdf60f4ba6c63b8b74441c5c52f56))
* **eslint:** add return types to client code ([c2e31cc](https://github.com/ulixee/secret-agent/commit/c2e31ccba4974f2bda269e77e6df9b82a2695d4f))
* **mitm:** remove auth as separate proxy param ([ec14b30](https://github.com/ulixee/secret-agent/commit/ec14b302ed6389769b61e77337ba9fe873a647ed))
* **mitm-socket:** fix cpu spiking sockets ([b71e141](https://github.com/ulixee/secret-agent/commit/b71e14158c1bb948e9ce33abf01b4522930caafe))


### Features

* **proxy:** configure proxy via client + socks5 ([880c938](https://github.com/ulixee/secret-agent/commit/880c93803bebc78b835a8f2fb5133d633a315337))





# [1.2.0-alpha.1](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.0...v1.2.0-alpha.1) (2020-11-20)


### Bug Fixes

* unwind some dependencies ([240bea6](https://github.com/ulixee/secret-agent/commit/240bea6ac7cb87bfcccbc56fb54043f5c2ff7b4b))


### Features

* **human-emulators:** ghost emulator ([70bcf27](https://github.com/ulixee/secret-agent/commit/70bcf273a2e995f8168dced9797d441b6eaec80b))





# [1.2.0-alpha.0](https://github.com/ulixee/secret-agent/compare/v1.1.0-alpha.1...v1.2.0-alpha.0) (2020-11-11)


### Features

* **awaited-dom:** documentation for props ([029a1f5](https://github.com/ulixee/secret-agent/commit/029a1f5b10cc13119d4bb808d35f80cce4aeb3dd))
* **browser-emulators:** refactor emulator filenames ([b5da042](https://github.com/ulixee/secret-agent/commit/b5da0426e39aad64178659cc93f441f781f917ba))
* **core:** store data files in a single location ([c3299b6](https://github.com/ulixee/secret-agent/commit/c3299b6a0dc2fc42d7a7df3746ab34c2d8b15ea0))





# [1.1.0-alpha.1](https://github.com/ulixee/secret-agent/compare/v1.1.0-alpha.0...v1.1.0-alpha.1) (2020-11-05)


### Bug Fixes

* **mitm:** should add host to http1 headers ([b655ea9](https://github.com/ulixee/secret-agent/commit/b655ea925b531a53bb9b55271df5150881783bcf))


### Features

* **client:** get/set/delete cookies + domstorage ([2e2de6b](https://github.com/ulixee/secret-agent/commit/2e2de6b9f2debf5eadf54b03b3f8d9db7cace269))





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
* bugs in replay ([2bf8808](https://github.com/ulixee/secret-agent/commit/2bf8808ae115ba9ea9f3cc64f3eba673fcb311aa))


### Features

* **core:** improve jspath waitForElement perf ([435576a](https://github.com/ulixee/secret-agent/commit/435576a47a31dfedcfd3307c090e23b63998c716))
* **locale:** add locale emulation + tests ([57cc7ff](https://github.com/ulixee/secret-agent/commit/57cc7ff8c342dc27a477b16cca066dffb9687e2f))
* **replay:** set screen viewport ([f818ff5](https://github.com/ulixee/secret-agent/commit/f818ff5577d49d284a4116d328e78dc1d235824a))
* **session:** track frame dom node ids ([a41d678](https://github.com/ulixee/secret-agent/commit/a41d6786d6fd10a386d9c2739713a26b6063b127))





# [1.0.0-alpha.20](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.19...v1.0.0-alpha.20) (2020-10-23)


### Bug Fixes

* order of session closing ([046243b](https://github.com/ulixee/secret-agent/commit/046243b7b2f84f633674dbe23122eb1d58ca431c))


### Features

* **mitm:** dns over tls lookups ([8797847](https://github.com/ulixee/secret-agent/commit/8797847fd5388ee6e4165c02390d45587799edbf))
* **mitm:** store ca/keys in network.db ([fd69f97](https://github.com/ulixee/secret-agent/commit/fd69f97cee898720d5e5a5b30e0697b728c6e8d4))
* **puppet:** use mouse wheel events ([1efea8a](https://github.com/ulixee/secret-agent/commit/1efea8abcf094d8c6644ecdedd5f0069b2fd909c))
* **session-state:** record devtools logs ([784da7f](https://github.com/ulixee/secret-agent/commit/784da7f7728671485bce55b877fa350981c88ea2))
* **session-state:** record mitm resource states ([08976df](https://github.com/ulixee/secret-agent/commit/08976dfa95f3b2629aedaca3002cc07b97e5bd2e))





# [1.0.0-alpha.19](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.18...v1.0.0-alpha.19) (2020-10-13)

**Note:** Version bump only for package @secret-agent/core





# [1.0.0-alpha.18](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.17...v1.0.0-alpha.18) (2020-10-13)

**Note:** Version bump only for package @secret-agent/core





# [1.0.0-alpha.17](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.16...v1.0.0-alpha.17) (2020-10-13)

**Note:** Version bump only for package @secret-agent/core





# [1.0.0-alpha.16](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.15...v1.0.0-alpha.16) (2020-10-13)


### Bug Fixes

* **core:** dont close client on promise rejections ([37f1169](https://github.com/ulixee/secret-agent/commit/37f11690131c4bf08e481c803cdb3fba68c7985f))
* **core:** wait for location change on new tab ([0c70d6e](https://github.com/ulixee/secret-agent/commit/0c70d6e7553025222b9fe4139407be4d69ee20b9))
* **mitm:** catch exceptions on closed h2 session ([6b5c7d4](https://github.com/ulixee/secret-agent/commit/6b5c7d455c06d21f59ad4674199d76d73a5373d2))


### Features

* **client:** xpath support, array index access ([c59ccbc](https://github.com/ulixee/secret-agent/commit/c59ccbc47eda9c61c360f04beb00a6a8e032f31e))
* **core:** isElementVisible - can user see elem ([213c351](https://github.com/ulixee/secret-agent/commit/213c351cbc9bf4c6e8852fe0694bfafcdd602cbe))





# [1.0.0-alpha.15](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.14...v1.0.0-alpha.15) (2020-10-06)

**Note:** Version bump only for package @secret-agent/core





# [1.0.0-alpha.14](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.13...v1.0.0-alpha.14) (2020-10-06)


### Bug Fixes

* **client:** don’t shutdown on rejected promises ([86a331b](https://github.com/ulixee/secret-agent/commit/86a331bede88daca8b17c079f23910ff776fb4c4))







**Note:** Version bump only for package @secret-agent/core





# [1.0.0-alpha.12](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.11...v1.0.0-alpha.12) (2020-09-29)


### Bug Fixes

* lint and puppet test chrome 80 ([0ce09ac](https://github.com/ulixee/secret-agent/commit/0ce09ac71e3f9a9a802ba90f9c7aab9021f07e5c))
* refactor to pause debugger on attach ([63a9bd1](https://github.com/ulixee/secret-agent/commit/63a9bd125e7f334a85a2dedc2490f4e66366ea6d))


### Features

* **core:** back/forward api ([805af3d](https://github.com/ulixee/secret-agent/commit/805af3d48822c1306b73f5c084d65b0855819213)), closes [#32](https://github.com/ulixee/secret-agent/issues/32)
* **mitm:** switch mitm to use authorization ([fade6e8](https://github.com/ulixee/secret-agent/commit/fade6e81d58d947c03a7b54e37a887bbc0bba5a2))
* **puppet:** add puppet interfaces abstraction ([69bae38](https://github.com/ulixee/secret-agent/commit/69bae38a03afaae3455de2a4928abd13031af662))
* **puppet:** import playwright tests ([e2b9bf5](https://github.com/ulixee/secret-agent/commit/e2b9bf546af1ed899a01f460977e362b676c02e1))
* **replay:** remove ui tabs; nav to session tabs ([df8e21c](https://github.com/ulixee/secret-agent/commit/df8e21cefc71ff6ad8db7d1498a1352cc71618a9))
* **replay:** spawned child tabs ([8ae0d75](https://github.com/ulixee/secret-agent/commit/8ae0d754a8e263a6cae20815338532da84906a7b))
* **replay:** split session state by tab ([9367f2d](https://github.com/ulixee/secret-agent/commit/9367f2d8796fda709bc8185374a5e07d4b6f78ab))
* import and shrink puppeteer ([b1816b8](https://github.com/ulixee/secret-agent/commit/b1816b8f7b1a60edd456626e3c818e4ebe3c022f))
* wait for tab ([0961e97](https://github.com/ulixee/secret-agent/commit/0961e97ecc4418c21536be92e1f3787aa1692117))





# [1.0.0-alpha.11](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.10...v1.0.0-alpha.11) (2020-08-25)

**Note:** Version bump only for package @secret-agent/core





# [1.0.0-alpha.10](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.9...v1.0.0-alpha.10) (2020-08-25)


### Bug Fixes

* dependency/path issues ([17a6813](https://github.com/ulixee/secret-agent/commit/17a681335a3cd28cf7a668f5efd58229fa1cc59e))





# [1.0.0-alpha.9](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.8...v1.0.0-alpha.9) (2020-08-25)


### Bug Fixes

* **replay:** fix rendering doctype + svg ([ac36c79](https://github.com/ulixee/secret-agent/commit/ac36c791c9d3611874900c65e8180b7daa1ed232))


### Features

* **ci:** windows tests ([fd5e9db](https://github.com/ulixee/secret-agent/commit/fd5e9dbd2bdd1ac4fcba94f46e8cba4eb2ce7319))
* **core:** enhance logs ([a5b6d58](https://github.com/ulixee/secret-agent/commit/a5b6d58a7fbf74415d7094b374f040ab1ca2890a))
* **emulators:** enable multi-engine support ([1e008c9](https://github.com/ulixee/secret-agent/commit/1e008c9fe26c977ebf85c665d0891023342a58b5))
* **mitm:** support push streams ([1b2af06](https://github.com/ulixee/secret-agent/commit/1b2af0655445929ac1f4fb8dcac011b9623a75d4))
* **replay:** stream data and simplify tick tracker ([91c350c](https://github.com/ulixee/secret-agent/commit/91c350cdbf9f99c19754fbb5598afe62a13fb497))





# [1.0.0-alpha.8](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.6...v1.0.0-alpha.8) (2020-08-05)


### Bug Fixes

* **core:** core should autoclose if not started ([8d46a77](https://github.com/ulixee/secret-agent/commit/8d46a775573733aa53cef1723fb71d60485fae9f)), closes [#41](https://github.com/ulixee/secret-agent/issues/41)
* **socket:** http2 requests not reusing sockets ([3cbf853](https://github.com/ulixee/secret-agent/commit/3cbf8531589536c763525086cfea407c3435ca9b))
* use os tmp directory ([e1f5a2b](https://github.com/ulixee/secret-agent/commit/e1f5a2b7e63470b626ed906170b5c0337f5e0c43))
* windows tests ([c2943e8](https://github.com/ulixee/secret-agent/commit/c2943e844d53c11f829baed60c449604e81544c8))


### Features

* **mitm:** record blocked and cached http ([bd47738](https://github.com/ulixee/secret-agent/commit/bd47738e010c962e529a048d4ee33211d67a6d8f))
* **replay:** split app/replay in electron backend ([3b66eec](https://github.com/ulixee/secret-agent/commit/3b66eec372900e764872857b67f80817f4ba2b9e))
* **session-state:** capture requests before send ([9607793](https://github.com/ulixee/secret-agent/commit/960779370fa439d1c173e855bb8bdf907de9abc6))





# [1.0.0-alpha.7](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.6...v1.0.0-alpha.7) (2020-07-27)


### Bug Fixes

* use os tmp directory ([e1f5a2b](https://github.com/ulixee/secret-agent/commit/e1f5a2b7e63470b626ed906170b5c0337f5e0c43))
* windows tests ([c2943e8](https://github.com/ulixee/secret-agent/commit/c2943e844d53c11f829baed60c449604e81544c8))





# [1.0.0-alpha.6](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.5...v1.0.0-alpha.6) (2020-07-22)

**Note:** Version bump only for package @secret-agent/core





# [1.0.0-alpha.5](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.4...v1.0.0-alpha.5) (2020-07-21)

**Note:** Version bump only for package @secret-agent/core





# [1.0.0-alpha.4](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.3...v1.0.0-alpha.4) (2020-07-20)


### Bug Fixes

* **replay:** cover last tick on playbar ([baf12e7](https://github.com/ulixee/secret-agent/commit/baf12e795fade634e60c64a342ea339ac6e8aa5c))
* **replay:** record close date when errors occcur ([2ce94dd](https://github.com/ulixee/secret-agent/commit/2ce94dd694bba172028e8b7b00f0b3e0df0e0163)), closes [#31](https://github.com/ulixee/secret-agent/issues/31)
* change shared package names ([d6181a7](https://github.com/ulixee/secret-agent/commit/d6181a75a0387797177eb9aa2f71553bb7d31432))


### Features

* **replay:** add session logs, detect errors ([f1865c0](https://github.com/ulixee/secret-agent/commit/f1865c0aef38f6722bbcdee0244288f0f6040c5a)), closes [#31](https://github.com/ulixee/secret-agent/issues/31)
* **replay:** show commands in playbar ([58b9f7a](https://github.com/ulixee/secret-agent/commit/58b9f7ac153480382cbd2f4c2f00aec64e7e852b))
* **replay:** start api from process ([403716b](https://github.com/ulixee/secret-agent/commit/403716b3ba853c67ef15868fd6fb9fe1f60dbc1f))
* flatten shared workspaces ([d53da16](https://github.com/ulixee/secret-agent/commit/d53da165d649163dcb724225a2ea43ce88d7eacc))





# 1.0.0-alpha.3 (2020-07-07)


### Bug Fixes

* **session-state:** Improve page recorder perf ([14f78b9](https://github.com/ulixee/secret-agent/commit/14f78b9ede550ded32594dc0a773cc880bf02783)), closes [#8](https://github.com/ulixee/secret-agent/issues/8)


### Features

* **dist:** improve packaging for double agent ([df195b6](https://github.com/ulixee/secret-agent/commit/df195b630b90aea343e4bd3005d41b34c4d5431a))
* **emulators:** improve page logging ([cb73806](https://github.com/ulixee/secret-agent/commit/cb73806408ef7c235e4ff70539c8cc49e5cd5d90))





# 1.0.0-alpha.2 (2020-06-27)


### Bug Fixes

* missing dependencies ([67504f0](https://github.com/ulixee/secret-agent/commit/67504f0f070f35ded261ec3c9734d60422b75a96))





# 1.0.0-alpha.1 (2020-06-27)

**Note:** Version bump only for package @secret-agent/core





# 1.0.0-alpha.0 (2020-06-27)

**Note:** Version bump only for package @secret-agent/core
