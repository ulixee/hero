# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
