# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.4.1-alpha.4](https://github.com/ulixee/secret-agent/compare/v1.4.1-alpha.3...v1.4.1-alpha.4) (2021-04-20)

**Note:** Version bump only for package @secret-agent/client





## [1.4.1-alpha.3](https://github.com/ulixee/secret-agent/compare/v1.4.1-alpha.2...v1.4.1-alpha.3) (2021-04-20)


### Bug Fixes

* **client:** explicit mjs exports ([d3e4525](https://github.com/ulixee/secret-agent/commit/d3e4525ee8fb0430c4073791efde9741e01d9f9d))
* **core:** allow retrieving datasets ([582ed16](https://github.com/ulixee/secret-agent/commit/582ed16fd07c09346afbbcd7f9e3d5e9e375aeb8)), closes [#213](https://github.com/ulixee/secret-agent/issues/213)
* **core:** convert dates to numbers ([da17efe](https://github.com/ulixee/secret-agent/commit/da17efecaa8301070ed3c98d8d4d423d44d50f74))
* **mitm:** fix ipc timeouts ([851be03](https://github.com/ulixee/secret-agent/commit/851be03be65fb0718b8af8230ab76360a7f006ef))
* **puppet:** fix chrome-88 ([f917b52](https://github.com/ulixee/secret-agent/commit/f917b5237fd9010e041b68fa493a77bfd4d8fea0))


### Features

* **client:** getJsValue should return value ([84dcd65](https://github.com/ulixee/secret-agent/commit/84dcd650fb6dc358904374e59965a72e7c3b2aa6))
* **core:** optimize string reuse in high traffic ([3c03c3a](https://github.com/ulixee/secret-agent/commit/3c03c3aa1639a74a38160fb9cfd13882774fc70f))
* **mitm:** use shared mitm socket ([f80334b](https://github.com/ulixee/secret-agent/commit/f80334b59f03f59dda63040b28146c51cff1825d))





## [1.4.1-alpha.2](https://github.com/ulixee/secret-agent/compare/v1.4.1-alpha.1...v1.4.1-alpha.2) (2021-04-02)


### Features

* **core:** return null for non-existent elements ([871c2fa](https://github.com/ulixee/secret-agent/commit/871c2fa22d761e37836b3ecb1d765c6a5fc7cdee))





## [1.4.1-alpha.1](https://github.com/ulixee/secret-agent/compare/v1.4.1-alpha.0...v1.4.1-alpha.1) (2021-03-31)


### Bug Fixes

* **client:** adjust return error pattern to throw ([884e87d](https://github.com/ulixee/secret-agent/commit/884e87db16a5706dc50416e3df0defa67f0606e2))
* **client:** fix logging dependency error ([22900c4](https://github.com/ulixee/secret-agent/commit/22900c49da47e8ce0d910c255d9b535527ce040d))


### Features

* **handler:** re-q unstarted agents on disconnect ([b0ece5b](https://github.com/ulixee/secret-agent/commit/b0ece5bdaa203352932dd524b1eddc082df6fb31))





## [1.4.1-alpha.0](https://github.com/ulixee/secret-agent/compare/v1.4.0-alpha.1...v1.4.1-alpha.0) (2021-03-23)


### Bug Fixes

* **client:** properly handle unhandled disconnect ([e3afedd](https://github.com/ulixee/secret-agent/commit/e3afedd90f0c614dab8ed5a02ba40de013e24b1d))


### Features

* **client:** expose frames ([44a6b12](https://github.com/ulixee/secret-agent/commit/44a6b129fef6f541cffc24e8913fd76defcf3aef))





# [1.4.0-alpha.1](https://github.com/ulixee/secret-agent/compare/v1.4.0-alpha.0...v1.4.0-alpha.1) (2021-03-11)

**Note:** Version bump only for package @secret-agent/client





# [1.4.0-alpha.0](https://github.com/ulixee/secret-agent/compare/v1.3.1-alpha.1...v1.4.0-alpha.0) (2021-03-11)


### Bug Fixes

* **client:** fix close handling ([f413ea8](https://github.com/ulixee/secret-agent/commit/f413ea8c66b0e07512a7b6fbd0d9857bebad1d7c))
* **client:** resource timeout + blank new tab ([4fdd378](https://github.com/ulixee/secret-agent/commit/4fdd3789edf9c2a7290b4deb660aa2d7194ec9c8))
* **client:** translate errors when session n/a ([6c15793](https://github.com/ulixee/secret-agent/commit/6c15793f67cadfcf7d62e270848fbef895e397af))
* **core:** exports not working <= node 14.12 ([d793601](https://github.com/ulixee/secret-agent/commit/d793601a052c243a541cf0331c79d00bc1332d1e))


### Features

* **client:** coreHost & disconnecting errors ([aed9fc3](https://github.com/ulixee/secret-agent/commit/aed9fc3f49996a661ab6b70e5446c9442649802a)), closes [#165](https://github.com/ulixee/secret-agent/issues/165)
* **client:** waitForAllDispatchesSettled ([cf3e6b5](https://github.com/ulixee/secret-agent/commit/cf3e6b540fd312e771f72ff27a08bf3ee9f6212a))
* **replay:** update for mac silicon + deps ([30ffec7](https://github.com/ulixee/secret-agent/commit/30ffec74fc06485b56344f17374a082d2055c1f1))





# [1.3.0-alpha.4](https://github.com/ulixee/secret-agent/compare/v1.3.0-alpha.3...v1.3.0-alpha.4) (2021-02-15)


### Bug Fixes

* **core/client:** export usable mjs/cjs ([ca149ef](https://github.com/ulixee/secret-agent/commit/ca149efbfbdf03da0fda7d127348e5de6f2a4f8b))
* **logger:** don’t use colors if disalbed in node ([c3af5a0](https://github.com/ulixee/secret-agent/commit/c3af5a07984865bfa6f5278fe442bea80f00166f))


### Features

* **client:** add http cache and load failures ([571e64f](https://github.com/ulixee/secret-agent/commit/571e64f108df7a0cbfd32609c37ff76261014dc6))





# [1.3.0-alpha.3](https://github.com/ulixee/secret-agent/compare/v1.3.0-alpha.2...v1.3.0-alpha.3) (2021-02-11)

**Note:** Version bump only for package @secret-agent/client





# [1.3.0-alpha.2](https://github.com/ulixee/secret-agent/compare/v1.3.0-alpha.1...v1.3.0-alpha.2) (2021-02-09)


### Bug Fixes

* **client:** correctly catch some canceled promise ([1d5906f](https://github.com/ulixee/secret-agent/commit/1d5906f5bff7e757bd084bb98883b56f3cf22bbe))
* **client:** fix reviving stack traces in typeson ([7a0e38b](https://github.com/ulixee/secret-agent/commit/7a0e38b6e8efd30a2d70c0c3c73d8fc121e316a9))
* **mitm:** read failed/cached browser resources ([150db8b](https://github.com/ulixee/secret-agent/commit/150db8b3785705afdc54b915684ae0c828a5ecf8))





# [1.3.0-alpha.1](https://github.com/ulixee/secret-agent/compare/v1.3.0-alpha.0...v1.3.0-alpha.1) (2021-02-06)


### Bug Fixes

* ejs modules not being copied to dist ([606102e](https://github.com/ulixee/secret-agent/commit/606102e1a671b9a3dbab16b4411af8499aed3820))





# [1.3.0-alpha.0](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.5...v1.3.0-alpha.0) (2021-02-02)


### Bug Fixes

* **client:** allow waiting on resources ([d3414a8](https://github.com/ulixee/secret-agent/commit/d3414a8f82b3c31c012953bf739d493076f0a759))
* **client:** error handling for session connect ([82e58b8](https://github.com/ulixee/secret-agent/commit/82e58b826908d7e14d21f58673b1eb0044b4b9a2))
* **core:** full close down of on premature exit ([aa53e85](https://github.com/ulixee/secret-agent/commit/aa53e85782a57da4d69f8750a5c3719c60683f5b))
* **replay:** fix replay launch in new setup on win ([add1b97](https://github.com/ulixee/secret-agent/commit/add1b97084d9d83f0cdad77362a238aeef92cf68))
* allow setting SA_SHOW_REPLAY in a script ([18d63d6](https://github.com/ulixee/secret-agent/commit/18d63d640dc69e83512908bbdec1263aba87d953))


### Features

* **client:** add ability to get agent metadata ([55df775](https://github.com/ulixee/secret-agent/commit/55df775b3b9e78db99bc726ae54a683cc701a7e2))
* **client:** add sessionid/name to logs + errors ([7d88f35](https://github.com/ulixee/secret-agent/commit/7d88f3555076647307dc1e9e6cea9b102033c756))
* **client:** built-in remote + handlers ([bfaa739](https://github.com/ulixee/secret-agent/commit/bfaa739517a458db9dd1bd6374770840eb95b847))
* **client:** coreConnection as configuration ([ac284ca](https://github.com/ulixee/secret-agent/commit/ac284cac3fa867a9623fd841edf96d04906e3072))
* **client:** export required enums and consts ([4cce3a7](https://github.com/ulixee/secret-agent/commit/4cce3a769e41bba49ad8a8bc8c83de53711f091b))
* **core:** add getComputedStyles to tab ([0e3bccd](https://github.com/ulixee/secret-agent/commit/0e3bccd9c27ac1e6b122238ca7292182c169ebe6))
* **core:** add screenshot capability ([f075f89](https://github.com/ulixee/secret-agent/commit/f075f89636edb81c4626c51929665373069de31a))
* **core:** convert all connections to server ([a27fafd](https://github.com/ulixee/secret-agent/commit/a27fafd9a04e52f602a557f7304164c2308006c6))
* **core:** convert server to use websockets ([2d1804c](https://github.com/ulixee/secret-agent/commit/2d1804ce7521fe065c01491e3f5e084852369f55))
* **core:** merge session-state and core ([dcc6002](https://github.com/ulixee/secret-agent/commit/dcc6002c2003d981267e51c8dacf5201fe3b9fda))
* **core:** timeouts for back/fwd/goto, add reload ([bae2a8e](https://github.com/ulixee/secret-agent/commit/bae2a8eaf20b2a855c98986d5c2c9b5e11b004ec))
* **core:** waitForLocation/Load takes a timeout ([02758c7](https://github.com/ulixee/secret-agent/commit/02758c7fc1e5394db84f91aa8235c3364b6c0692))
* **core:** waitForPaintingStable ([1955b79](https://github.com/ulixee/secret-agent/commit/1955b791ce8a7cf20a679986e63885950efa6813))
* **replay:** single install of replay ([5425bee](https://github.com/ulixee/secret-agent/commit/5425bee76488ac5bff4f46d8b99eb874dd7f5a35))
* mv renderingOptions => blockedResourceTypes ([ffa1b74](https://github.com/ulixee/secret-agent/commit/ffa1b74d0b470387ec104027667e8523a51bfa15)), closes [#113](https://github.com/ulixee/secret-agent/issues/113)


### BREAKING CHANGES

* renames “renderingOptions” to “blockedResourceTypes”. Default is now “None”





# [1.2.0-alpha.5](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.4...v1.2.0-alpha.5) (2020-12-29)

**Note:** Version bump only for package @secret-agent/client





# [1.2.0-alpha.4](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.3...v1.2.0-alpha.4) (2020-12-22)

**Note:** Version bump only for package @secret-agent/client





# [1.2.0-alpha.3](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.2...v1.2.0-alpha.3) (2020-12-16)


### Bug Fixes

* **mitm:** bubble proxy errors properly to client ([b6a72f5](https://github.com/ulixee/secret-agent/commit/b6a72f59ef8e7739654ab82b170aa0e15d38ebd0)), closes [#98](https://github.com/ulixee/secret-agent/issues/98)
* **replay:** multiple sessions showing incorrectly ([20ba30c](https://github.com/ulixee/secret-agent/commit/20ba30caebcef42de65dee18e6b82d92c7193d9c))


### Features

* **client:** update awaited dom to 1.1.8 ([a1b9b68](https://github.com/ulixee/secret-agent/commit/a1b9b68e735ee54ceaef3436c43df0d0744c8f47))





# [1.2.0-alpha.2](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.1...v1.2.0-alpha.2) (2020-12-01)


### Bug Fixes

* **core:** fix errors on goto bubbling up ([30d4208](https://github.com/ulixee/secret-agent/commit/30d4208c079e171fd6e0640810a4812e0a9a3d59))
* **eslint:** add return types to client code ([c2e31cc](https://github.com/ulixee/secret-agent/commit/c2e31ccba4974f2bda269e77e6df9b82a2695d4f))


### Features

* **proxy:** configure proxy via client + socks5 ([880c938](https://github.com/ulixee/secret-agent/commit/880c93803bebc78b835a8f2fb5133d633a315337))





# [1.2.0-alpha.1](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.0...v1.2.0-alpha.1) (2020-11-20)


### Bug Fixes

* emulators were failing some double-agent tests ([5ae4f55](https://github.com/ulixee/secret-agent/commit/5ae4f5507662ed91d19086d9dbab192e50a8f5c5))





# [1.2.0-alpha.0](https://github.com/ulixee/secret-agent/compare/v1.1.0-alpha.1...v1.2.0-alpha.0) (2020-11-11)


### Features

* **awaited-dom:** documentation for props ([029a1f5](https://github.com/ulixee/secret-agent/commit/029a1f5b10cc13119d4bb808d35f80cce4aeb3dd))
* **core:** store data files in a single location ([c3299b6](https://github.com/ulixee/secret-agent/commit/c3299b6a0dc2fc42d7a7df3746ab34c2d8b15ea0))





# [1.1.0-alpha.1](https://github.com/ulixee/secret-agent/compare/v1.1.0-alpha.0...v1.1.0-alpha.1) (2020-11-05)


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

**Note:** Version bump only for package @secret-agent/client





# [1.0.0-alpha.20](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.19...v1.0.0-alpha.20) (2020-10-23)


### Features

* **client:** add scrollTo shortcut ([a1613f1](https://github.com/ulixee/secret-agent/commit/a1613f15907c6eaea30e597bdabc3238eb7c96c1))





# [1.0.0-alpha.19](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.18...v1.0.0-alpha.19) (2020-10-13)

**Note:** Version bump only for package @secret-agent/client





# [1.0.0-alpha.18](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.17...v1.0.0-alpha.18) (2020-10-13)


### Bug Fixes

* **replay:** bug with monorepo replay versions ([05aa786](https://github.com/ulixee/secret-agent/commit/05aa786527d0b65d7097cbba623633294c615627))





# [1.0.0-alpha.17](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.16...v1.0.0-alpha.17) (2020-10-13)

**Note:** Version bump only for package @secret-agent/client





# [1.0.0-alpha.16](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.15...v1.0.0-alpha.16) (2020-10-13)


### Bug Fixes

* **core:** dont close client on promise rejections ([37f1169](https://github.com/ulixee/secret-agent/commit/37f11690131c4bf08e481c803cdb3fba68c7985f))
* **core:** wait for location change on new tab ([0c70d6e](https://github.com/ulixee/secret-agent/commit/0c70d6e7553025222b9fe4139407be4d69ee20b9))


### Features

* **client:** xpath support, array index access ([c59ccbc](https://github.com/ulixee/secret-agent/commit/c59ccbc47eda9c61c360f04beb00a6a8e032f31e))
* **core:** isElementVisible - can user see elem ([213c351](https://github.com/ulixee/secret-agent/commit/213c351cbc9bf4c6e8852fe0694bfafcdd602cbe))





# [1.0.0-alpha.15](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.14...v1.0.0-alpha.15) (2020-10-06)

**Note:** Version bump only for package @secret-agent/client





# [1.0.0-alpha.14](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.13...v1.0.0-alpha.14) (2020-10-06)


### Bug Fixes

* **client:** don’t shutdown on rejected promises ([86a331b](https://github.com/ulixee/secret-agent/commit/86a331bede88daca8b17c079f23910ff776fb4c4))







**Note:** Version bump only for package @secret-agent/client





# [1.0.0-alpha.12](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.11...v1.0.0-alpha.12) (2020-09-29)


### Features

* **docs:** Update documentation ([2295725](https://github.com/ulixee/secret-agent/commit/2295725dceed7026bee9a4a291d551c75fe5279f)), closes [#56](https://github.com/ulixee/secret-agent/issues/56)
* **puppet:** add puppet interfaces abstraction ([69bae38](https://github.com/ulixee/secret-agent/commit/69bae38a03afaae3455de2a4928abd13031af662))
* **replay:** split session state by tab ([9367f2d](https://github.com/ulixee/secret-agent/commit/9367f2d8796fda709bc8185374a5e07d4b6f78ab))
* import and shrink puppeteer ([b1816b8](https://github.com/ulixee/secret-agent/commit/b1816b8f7b1a60edd456626e3c818e4ebe3c022f))
* wait for tab ([0961e97](https://github.com/ulixee/secret-agent/commit/0961e97ecc4418c21536be92e1f3787aa1692117))





# [1.0.0-alpha.10](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.9...v1.0.0-alpha.10) (2020-08-25)

**Note:** Version bump only for package @secret-agent/client





# [1.0.0-alpha.9](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.8...v1.0.0-alpha.9) (2020-08-25)


### Bug Fixes

* **replay:** fix rendering doctype + svg ([ac36c79](https://github.com/ulixee/secret-agent/commit/ac36c791c9d3611874900c65e8180b7daa1ed232))


### Features

* **mitm:** support push streams ([1b2af06](https://github.com/ulixee/secret-agent/commit/1b2af0655445929ac1f4fb8dcac011b9623a75d4))
* **replay:** stream data and simplify tick tracker ([91c350c](https://github.com/ulixee/secret-agent/commit/91c350cdbf9f99c19754fbb5598afe62a13fb497))





# [1.0.0-alpha.8](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.6...v1.0.0-alpha.8) (2020-08-05)


### Bug Fixes

* **core:** core should autoclose if not started ([8d46a77](https://github.com/ulixee/secret-agent/commit/8d46a775573733aa53cef1723fb71d60485fae9f)), closes [#41](https://github.com/ulixee/secret-agent/issues/41)
* use os tmp directory ([e1f5a2b](https://github.com/ulixee/secret-agent/commit/e1f5a2b7e63470b626ed906170b5c0337f5e0c43))





# [1.0.0-alpha.7](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.6...v1.0.0-alpha.7) (2020-07-27)


### Bug Fixes

* use os tmp directory ([e1f5a2b](https://github.com/ulixee/secret-agent/commit/e1f5a2b7e63470b626ed906170b5c0337f5e0c43))





# [1.0.0-alpha.6](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.5...v1.0.0-alpha.6) (2020-07-22)

**Note:** Version bump only for package @secret-agent/client





# [1.0.0-alpha.5](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.4...v1.0.0-alpha.5) (2020-07-21)

**Note:** Version bump only for package @secret-agent/client





# [1.0.0-alpha.4](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.3...v1.0.0-alpha.4) (2020-07-20)


### Bug Fixes

* **replay:** cover last tick on playbar ([baf12e7](https://github.com/ulixee/secret-agent/commit/baf12e795fade634e60c64a342ea339ac6e8aa5c))
* **replay:** record close date when errors occcur ([2ce94dd](https://github.com/ulixee/secret-agent/commit/2ce94dd694bba172028e8b7b00f0b3e0df0e0163)), closes [#31](https://github.com/ulixee/secret-agent/issues/31)
* change shared package names ([d6181a7](https://github.com/ulixee/secret-agent/commit/d6181a75a0387797177eb9aa2f71553bb7d31432))


### Features

* **replay:** add mouse/focus/scroll events ([efec55c](https://github.com/ulixee/secret-agent/commit/efec55cf093bd4207164abd304a64f73620c45a9))
* **replay:** add session logs, detect errors ([f1865c0](https://github.com/ulixee/secret-agent/commit/f1865c0aef38f6722bbcdee0244288f0f6040c5a)), closes [#31](https://github.com/ulixee/secret-agent/issues/31)
* **replay:** start api from process ([403716b](https://github.com/ulixee/secret-agent/commit/403716b3ba853c67ef15868fd6fb9fe1f60dbc1f))





# 1.0.0-alpha.3 (2020-07-07)


### Bug Fixes

* **session-state:** Improve page recorder perf ([14f78b9](https://github.com/ulixee/secret-agent/commit/14f78b9ede550ded32594dc0a773cc880bf02783)), closes [#8](https://github.com/ulixee/secret-agent/issues/8)


### Features

* **dist:** improve packaging for double agent ([df195b6](https://github.com/ulixee/secret-agent/commit/df195b630b90aea343e4bd3005d41b34c4d5431a))





# 1.0.0-alpha.2 (2020-06-27)


### Bug Fixes

* missing dependencies ([67504f0](https://github.com/ulixee/secret-agent/commit/67504f0f070f35ded261ec3c9734d60422b75a96))





# 1.0.0-alpha.1 (2020-06-27)

**Note:** Version bump only for package @secret-agent/client





# 1.0.0-alpha.0 (2020-06-27)

**Note:** Version bump only for package @secret-agent/client
