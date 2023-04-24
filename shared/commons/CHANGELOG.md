# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.0.0-alpha.21](https://github.com/ulixee/shared/compare/v2.0.0-alpha.20...v2.0.0-alpha.21) (2023-04-24)

**Note:** Version bump only for package @ulixee/commons





# [2.0.0-alpha.20](https://github.com/ulixee/shared/compare/v2.0.0-alpha.19...v2.0.0-alpha.20) (2023-04-19)


### Bug Fixes

* **commons:** always handle emitter errors ([1c5f60f](https://github.com/ulixee/shared/commit/1c5f60f21c4c174c99c10e9e9d2edb07b06c28a0))
* **commons:** global instance bug ([b895c0e](https://github.com/ulixee/shared/commit/b895c0e14602d92f42c559c6130d8a66b9b0770e))
* **commons:** global instance of check ([f51fed1](https://github.com/ulixee/shared/commit/f51fed1f93e4bfb2c603a0bced79e249ff76d003))
* **crypto:** disallow overwriting identity/address ([c14a185](https://github.com/ulixee/shared/commit/c14a1857c80ca800198d231236d5fcb6223026c9))
* tests + lint ([66e49ae](https://github.com/ulixee/shared/commit/66e49ae931b54fd8577711562c56e2494d8149bb))





# [2.0.0-alpha.19](https://github.com/ulixee/shared/compare/v2.0.0-alpha.18...v2.0.0-alpha.19) (2023-02-25)


### Bug Fixes

* **commons:** allow clearing sourcemap paths ([4d14167](https://github.com/ulixee/shared/commit/4d141673bd34e22d556539e6eb7bf8e63d9c9c3e))
* **commons:** no unhandled timeouts ([5428d4a](https://github.com/ulixee/shared/commit/5428d4a2856c7c86dd4737522280a05b8f5d8c8e))
* **commons:** remove memory for once events ([e9b70ac](https://github.com/ulixee/shared/commit/e9b70ac08ab94c46bd00baa43d56a0b1820f78b1))
* **commons:** serialize objects named error too ([a915057](https://github.com/ulixee/shared/commit/a9150577b51572a25d3f3ca8144680ff87bf8b0b))
* **commons:** typo ([38eba49](https://github.com/ulixee/shared/commit/38eba496ada28165dc5e99acc48b0ec81040569c))
* **commons:** wait to register hosts listener ([02fcddb](https://github.com/ulixee/shared/commit/02fcddbf508c7392143c536707721a611c8b0205))
* **commons:** watch not available on linux ([cbd982b](https://github.com/ulixee/shared/commit/cbd982bec27c6f9b9c794ff99d01ee50c553ff59))
* **net:** default to ws transport over actual wire ([cbc0adc](https://github.com/ulixee/shared/commit/cbc0adcf0c899bfdc4d24ca5beccae7daf24869e))


### Features

* **commons:** host file monitoring ([01d1e53](https://github.com/ulixee/shared/commit/01d1e53b5087b2b80f96a0bfc504323172adbb81))
* **commons:** read embedded sourcemap content ([a20db0c](https://github.com/ulixee/shared/commit/a20db0c3c400939ef403a4c7c779f4a49811c92f))
* **net:** emit request, response and event ([9ed0201](https://github.com/ulixee/shared/commit/9ed02013579ee3bc206182cfce85def3c0271034))





# [2.0.0-alpha.18](https://github.com/ulixee/shared/compare/v2.0.0-alpha.17...v2.0.0-alpha.18) (2023-01-17)


### Bug Fixes

* don’t bindFunction for classes ([cdf1904](https://github.com/ulixee/shared/commit/cdf19040e090c44a6f713457545c65a549879da8))


### Features

* add counter to resolvable for debugging ([8ea0232](https://github.com/ulixee/shared/commit/8ea0232bc46c44d9db68918673c542ef90ec5415))
* catch unhandled rejections for closes ([1dd47a9](https://github.com/ulixee/shared/commit/1dd47a97aeec413475a853b5b4f259bce0e3a3de))
* databox stream and output apis ([1901482](https://github.com/ulixee/shared/commit/1901482b58d8e8d82497841d7a781efa5ee520cb))





# [2.0.0-alpha.17](https://github.com/ulixee/shared/compare/v2.0.0-alpha.16...v2.0.0-alpha.17) (2022-12-15)


### Features

* micronote apis conversion to hold/settle ([c03c6fd](https://github.com/ulixee/shared/commit/c03c6fd8c7d17c29a8347aaba7413920e859c556))





# [2.0.0-alpha.16](https://github.com/ulixee/shared/compare/v2.0.0-alpha.15...v2.0.0-alpha.16) (2022-12-05)


### Features

* allow manual shutdown ([41c9ebb](https://github.com/ulixee/shared/commit/41c9ebbd8b4b255502ed957927f0db2c9ca5c366))





# [2.0.0-alpha.15](https://github.com/ulixee/shared/compare/v2.0.0-alpha.14...v2.0.0-alpha.15) (2022-11-17)


### Features

* gift card api v2 to support redemption key ([b2f11f4](https://github.com/ulixee/shared/commit/b2f11f44a784adf8dd208db9683c99369f33f98c))





# [2.0.0-alpha.14](https://github.com/ulixee/shared/compare/v2.0.0-alpha.13...v2.0.0-alpha.14) (2022-11-02)


### Features

* change logs to support removal of ubk ([63a9d64](https://github.com/ulixee/shared/commit/63a9d6404ddcd0a042a6bc439ec07de63a2edfde))





# [2.0.0-alpha.13](https://github.com/ulixee/shared/compare/v2.0.0-alpha.12...v2.0.0-alpha.13) (2022-10-31)


### Bug Fixes

* **commons:** don’t convert env bools if null ([c4b4456](https://github.com/ulixee/shared/commit/c4b4456c550513f7620388f1e08af1f8449f4f8b))
* rename server config to hosts ([70d4e66](https://github.com/ulixee/shared/commit/70d4e661c1c2a964ffe72b79635cfa40bf12b2c6))


### Features

* ability to generate schema interface strings ([b1be5c5](https://github.com/ulixee/shared/commit/b1be5c585c19a2d8c101812d8ae5d7b08be9dc0e))





# [2.0.0-alpha.12](https://github.com/ulixee/shared/compare/v2.0.0-alpha.11...v2.0.0-alpha.12) (2022-10-03)


### Bug Fixes

* **commons:** add env bool ([3018132](https://github.com/ulixee/shared/commit/301813222d3da2b7429668e972d70e093c0056c0))
* **commons:** typeserializer not deep on map ([1f01a5c](https://github.com/ulixee/shared/commit/1f01a5c04d3c8318f44b0a5ac8509247313c7153))
* only log errors with values; parse env paths ([2e027fe](https://github.com/ulixee/shared/commit/2e027fe9fdb7e193b0ee432543d4216e00149fc8))





# [2.0.0-alpha.11](https://github.com/ulixee/shared/compare/v2.0.0-alpha.10...v2.0.0-alpha.11) (2022-08-31)


### Features

* **commons:** env utils + timed cache ([8583846](https://github.com/ulixee/shared/commit/8583846f891cc1f93c079c8f6e3b1868ba7fcb5e))





# [2.0.0-alpha.10](https://github.com/ulixee/shared/compare/v2.0.0-alpha.9...v2.0.0-alpha.10) (2022-08-16)

**Note:** Version bump only for package @ulixee/commons





# [2.0.0-alpha.9](https://github.com/ulixee/shared/compare/v2.0.0-alpha.8...v2.0.0-alpha.9) (2022-08-16)


### Features

* add port in use fn ([b8c1a10](https://github.com/ulixee/shared/commit/b8c1a10c6da91a303d284e0e4c0723bc9f5dcf17))
* **net:** add remoteId to transports for logs ([1cbc117](https://github.com/ulixee/shared/commit/1cbc117230644fd1e8dc3ba14b7bf01cfdb3142d))
* **net:** don’t throw disconnected if launch ([66176c7](https://github.com/ulixee/shared/commit/66176c7c4050028749d26a9aa63dd46b0d96d3f1))
* specification, crypto projects ([fa61e3d](https://github.com/ulixee/shared/commit/fa61e3d221dacc3c1509309ebbfc7a05cf43923c))





# [2.0.0-alpha.8](https://github.com/ulixee/commons/compare/v2.0.0-alpha.7...v2.0.0-alpha.8) (2022-07-14)

**Note:** Version bump only for package @ulixee/commons





# 2.0.0-alpha.7 (2022-07-13)

**Note:** Version bump only for package @ulixee/commons
