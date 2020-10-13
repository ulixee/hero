# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.18](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.17...v1.0.0-alpha.18) (2020-10-13)


### Bug Fixes

* **replay:** bug with monorepo replay versions ([05aa786](https://github.com/ulixee/secret-agent/commit/05aa786527d0b65d7097cbba623633294c615627))





# [1.0.0-alpha.16](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.15...v1.0.0-alpha.16) (2020-10-13)


### Bug Fixes

* **replay:** fix command overlays ([926dcba](https://github.com/ulixee/secret-agent/commit/926dcba7e10635c3917ffa9dca72c6fb6fe29016))





# [1.0.0-alpha.14](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.13...v1.0.0-alpha.14) (2020-10-06)


### Bug Fixes

* **mitm:** change headers after alpn is set ([a21d4ca](https://github.com/ulixee/secret-agent/commit/a21d4cab3f3adcc9e413f976ac6864ae85cb053e))
* **replay:** resetting navigation needs to clear ([daf9431](https://github.com/ulixee/secret-agent/commit/daf94318029f2d6ddf0ce88686f7748bc1d28f0c))
* **replay:** use shadow dom for replay elements ([b19b382](https://github.com/ulixee/secret-agent/commit/b19b3820eb93fd7302e7fd416dde6e5aad988209))







**Note:** Version bump only for package @secret-agent/replay





# [1.0.0-alpha.12](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.11...v1.0.0-alpha.12) (2020-09-29)


### Bug Fixes

* **puppet:** chrome 80 test flakiness ([9f16cd1](https://github.com/ulixee/secret-agent/commit/9f16cd1993e0bd038f748b2b986bd69a311b11f6))
* lint and puppet test chrome 80 ([0ce09ac](https://github.com/ulixee/secret-agent/commit/0ce09ac71e3f9a9a802ba90f9c7aab9021f07e5c))
* **mitm:** simplify errors, handle not caught ([27820ac](https://github.com/ulixee/secret-agent/commit/27820ac784771b4c58e3f07bd96f15209f82f28c))
* **replay:** playback on page 2 ([005bed8](https://github.com/ulixee/secret-agent/commit/005bed89efd198b434e947d21390678eceef5eee))


### Features

* **puppet:** import playwright tests ([e2b9bf5](https://github.com/ulixee/secret-agent/commit/e2b9bf546af1ed899a01f460977e362b676c02e1))
* **replay:** remove ui tabs; nav to session tabs ([df8e21c](https://github.com/ulixee/secret-agent/commit/df8e21cefc71ff6ad8db7d1498a1352cc71618a9))
* **replay:** spawned child tabs ([8ae0d75](https://github.com/ulixee/secret-agent/commit/8ae0d754a8e263a6cae20815338532da84906a7b))





# [1.0.0-alpha.10](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.9...v1.0.0-alpha.10) (2020-08-25)

**Note:** Version bump only for package @secret-agent/replay





# [1.0.0-alpha.9](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.8...v1.0.0-alpha.9) (2020-08-25)


### Bug Fixes

* **replay:** fix realtime not loading correctly ([29ff447](https://github.com/ulixee/secret-agent/commit/29ff4471073a15505d27d5453cb1c13daf824f83))
* **replay:** fix rendering doctype + svg ([ac36c79](https://github.com/ulixee/secret-agent/commit/ac36c791c9d3611874900c65e8180b7daa1ed232))
* vue structure for replay ([0e38bfa](https://github.com/ulixee/secret-agent/commit/0e38bfa5f16c63a7900136e2300214bda395a5cf))


### Features

* **core:** enhance logs ([a5b6d58](https://github.com/ulixee/secret-agent/commit/a5b6d58a7fbf74415d7094b374f040ab1ca2890a))
* **mitm:** support push streams ([1b2af06](https://github.com/ulixee/secret-agent/commit/1b2af0655445929ac1f4fb8dcac011b9623a75d4))
* **replay:** stream data and simplify tick tracker ([91c350c](https://github.com/ulixee/secret-agent/commit/91c350cdbf9f99c19754fbb5598afe62a13fb497))
* restructure frontend to match vue project ([f3348a0](https://github.com/ulixee/secret-agent/commit/f3348a01650e2747a26fa0b2ab9bd4c082300f37))





# [1.0.0-alpha.8](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.6...v1.0.0-alpha.8) (2020-08-05)


### Bug Fixes

* **replay:** handle frames and page source changes ([fc703d5](https://github.com/ulixee/secret-agent/commit/fc703d5181eb961307b44553aa02a62f4faf98c0))
* **socket:** http2 requests not reusing sockets ([3cbf853](https://github.com/ulixee/secret-agent/commit/3cbf8531589536c763525086cfea407c3435ca9b))
* circleci configs ([7d8e213](https://github.com/ulixee/secret-agent/commit/7d8e213032baa58a14d9f9eb6f161b4b2996b5c0))
* windows tests ([c2943e8](https://github.com/ulixee/secret-agent/commit/c2943e844d53c11f829baed60c449604e81544c8))
* **replay:** fix launch path to replay ([8d7059b](https://github.com/ulixee/secret-agent/commit/8d7059b476ea65b440b18f6e8fe59ecc6ba95bd3))


### Features

* **replay:** fix picker ([50d7885](https://github.com/ulixee/secret-agent/commit/50d7885f836067d51dc1ef50b41376cd9e3b9508))
* **replay:** replay individual ticks on interval ([e1c29f4](https://github.com/ulixee/secret-agent/commit/e1c29f443169ca4d141dcd0943ae8b493b31d6c8))
* **replay:** split app/replay in electron backend ([3b66eec](https://github.com/ulixee/secret-agent/commit/3b66eec372900e764872857b67f80817f4ba2b9e))
* circle-ci fixes ([aac9a30](https://github.com/ulixee/secret-agent/commit/aac9a30a3d9b6352e2e845cc2cd4ac6eca6bdd7a))





# [1.0.0-alpha.7](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.6...v1.0.0-alpha.7) (2020-07-27)


### Bug Fixes

* windows tests ([c2943e8](https://github.com/ulixee/secret-agent/commit/c2943e844d53c11f829baed60c449604e81544c8))
* **replay:** fix launch path to replay ([8d7059b](https://github.com/ulixee/secret-agent/commit/8d7059b476ea65b440b18f6e8fe59ecc6ba95bd3))


### Features

* circle-ci fixes ([aac9a30](https://github.com/ulixee/secret-agent/commit/aac9a30a3d9b6352e2e845cc2cd4ac6eca6bdd7a))





# [1.0.0-alpha.6](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.5...v1.0.0-alpha.6) (2020-07-22)

**Note:** Version bump only for package @secret-agent/replay





# [1.0.0-alpha.5](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.4...v1.0.0-alpha.5) (2020-07-21)


### Bug Fixes

* **replay:** fix replay api usage ([c54fe64](https://github.com/ulixee/secret-agent/commit/c54fe64b710519088cda4638c7ad2b16a5313e13))





# [1.0.0-alpha.4](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.3...v1.0.0-alpha.4) (2020-07-20)

**Note:** Version bump only for package @secret-agent/replay





# 1.0.0-alpha.3 (2020-07-07)


### Features

* **dist:** improve packaging for double agent ([df195b6](https://github.com/ulixee/secret-agent/commit/df195b630b90aea343e4bd3005d41b34c4d5431a))





# 1.0.0-alpha.2 (2020-06-27)

**Note:** Version bump only for package @secret-agent/replay





# 1.0.0-alpha.1 (2020-06-27)

**Note:** Version bump only for package @secret-agent/replay





# 1.0.0-alpha.0 (2020-06-27)

**Note:** Version bump only for package @secret-agent/replay
