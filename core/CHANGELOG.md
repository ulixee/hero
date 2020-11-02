# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
