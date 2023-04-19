# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.0.0-alpha.20](https://github.com/ulixee/shared/compare/v2.0.0-alpha.19...v2.0.0-alpha.20) (2023-04-19)


### Bug Fixes

* **commons:** always handle emitter errors ([1c5f60f](https://github.com/ulixee/shared/commit/1c5f60f21c4c174c99c10e9e9d2edb07b06c28a0))
* **commons:** global instance bug ([b895c0e](https://github.com/ulixee/shared/commit/b895c0e14602d92f42c559c6130d8a66b9b0770e))
* **commons:** global instance of check ([f51fed1](https://github.com/ulixee/shared/commit/f51fed1f93e4bfb2c603a0bced79e249ff76d003))
* **crypto:** disallow overwriting identity/address ([c14a185](https://github.com/ulixee/shared/commit/c14a1857c80ca800198d231236d5fcb6223026c9))
* **net:** not emitting transport disconnected ([54f4c73](https://github.com/ulixee/shared/commit/54f4c73a096961c5fdf823679fdf25503c9ec6b5))
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
* **schema:** serialization fixes for schema object ([24ce6cc](https://github.com/ulixee/shared/commit/24ce6cc5605aaff5b1b306755f34e431c8f70cf3))


### Features

* added Datastore.fetchInternalTable + tweaked Datastore.stream ([5525bb4](https://github.com/ulixee/shared/commit/5525bb4cf0021ac933cfe4fb8e23b631e6aa0f8d))
* **commons:** host file monitoring ([01d1e53](https://github.com/ulixee/shared/commit/01d1e53b5087b2b80f96a0bfc504323172adbb81))
* **commons:** read embedded sourcemap content ([a20db0c](https://github.com/ulixee/shared/commit/a20db0c3c400939ef403a4c7c779f4a49811c92f))
* **net:** emit request, response and event ([9ed0201](https://github.com/ulixee/shared/commit/9ed02013579ee3bc206182cfce85def3c0271034))
* **specification:** add dns domains to datastores ([c36e3d7](https://github.com/ulixee/shared/commit/c36e3d7bbc40aef1f9323178556d59a7d8b203e5))





# [2.0.0-alpha.18](https://github.com/ulixee/shared/compare/v2.0.0-alpha.17...v2.0.0-alpha.18) (2023-01-17)


### Bug Fixes

* add TransportBridge to net/index.ts and export ([8d4f1f1](https://github.com/ulixee/shared/commit/8d4f1f1e954553dbb75c6df8d155d361d506e83b))
* **crypt:** don’t read pem if not provided ([cb825d1](https://github.com/ulixee/shared/commit/cb825d11712215c3a157f433e6b77dcd23230019))
* don’t bindFunction for classes ([cdf1904](https://github.com/ulixee/shared/commit/cdf19040e090c44a6f713457545c65a549879da8))


### Features

* add counter to resolvable for debugging ([8ea0232](https://github.com/ulixee/shared/commit/8ea0232bc46c44d9db68918673c542ef90ec5415))
* allow optional schema types at compile time ([188ccfd](https://github.com/ulixee/shared/commit/188ccfdca5aeb7f391a4063d8e9af805ae82bc60))
* catch unhandled rejections for closes ([1dd47a9](https://github.com/ulixee/shared/commit/1dd47a97aeec413475a853b5b4f259bce0e3a3de))
* databox stream and output apis ([1901482](https://github.com/ulixee/shared/commit/1901482b58d8e8d82497841d7a781efa5ee520cb))
* **schema:** ability to convert json to code ([1bd0281](https://github.com/ulixee/shared/commit/1bd028171be4751e342e500e44fee0db9306e435))
* **schema:** add tables to Manifest and Apis ([545bbb0](https://github.com/ulixee/shared/commit/545bbb0412058f3271e4d5796344e270457f4af0))
* **specification:** credits api in datastore ([0dfab62](https://github.com/ulixee/shared/commit/0dfab6269e14c2d8cba99e860110732c58365a2e))





# [2.0.0-alpha.17](https://github.com/ulixee/shared/compare/v2.0.0-alpha.16...v2.0.0-alpha.17) (2022-12-15)


### Features

* added table endpoints ([62fe366](https://github.com/ulixee/shared/commit/62fe366a967d2ff8f1ae0f100cf8d8adb52d2e98))
* converted Databox.exec into Databox.query + cleaned up other Databox endpoints ([a483c3d](https://github.com/ulixee/shared/commit/a483c3d061ad2a7a94fc3effb3ab3fb99ad2f26c))
* micronote apis conversion to hold/settle ([c03c6fd](https://github.com/ulixee/shared/commit/c03c6fd8c7d17c29a8347aaba7413920e859c556))





# [2.0.0-alpha.16](https://github.com/ulixee/shared/compare/v2.0.0-alpha.15...v2.0.0-alpha.16) (2022-12-05)


### Features

* add databox functions ([4577be8](https://github.com/ulixee/shared/commit/4577be8ca3d1adf887659bf57cbf8a48c5d39b14))
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
* schemas ([a3efe35](https://github.com/ulixee/shared/commit/a3efe35cc18319557434bef4239eff52978cb4a1))
* updated Databox specifications to match changes in ulixee ([869bf9b](https://github.com/ulixee/shared/commit/869bf9baa28c6bb6c55afc30390e52dd74a8dfcc))





# [2.0.0-alpha.12](https://github.com/ulixee/shared/compare/v2.0.0-alpha.11...v2.0.0-alpha.12) (2022-10-03)


### Bug Fixes

* **commons:** add env bool ([3018132](https://github.com/ulixee/shared/commit/301813222d3da2b7429668e972d70e093c0056c0))
* **commons:** typeserializer not deep on map ([1f01a5c](https://github.com/ulixee/shared/commit/1f01a5c04d3c8318f44b0a5ac8509247313c7153))
* only log errors with values; parse env paths ([2e027fe](https://github.com/ulixee/shared/commit/2e027fe9fdb7e193b0ee432543d4216e00149fc8))





# [2.0.0-alpha.11](https://github.com/ulixee/shared/compare/v2.0.0-alpha.10...v2.0.0-alpha.11) (2022-08-31)


### Features

* **commons:** env utils + timed cache ([8583846](https://github.com/ulixee/shared/commit/8583846f891cc1f93c079c8f6e3b1868ba7fcb5e))





# [2.0.0-alpha.10](https://github.com/ulixee/shared/compare/v2.0.0-alpha.9...v2.0.0-alpha.10) (2022-08-16)


### Bug Fixes

* **specification:** publishing broken ([88539ee](https://github.com/ulixee/shared/commit/88539ee5b8663d0c19b0518fb3b4ed218dd6dbbe))





# [2.0.0-alpha.9](https://github.com/ulixee/shared/compare/v2.0.0-alpha.8...v2.0.0-alpha.9) (2022-08-16)


### Bug Fixes

* **net:** don’t unlisten to close events ([bfd4dee](https://github.com/ulixee/shared/commit/bfd4deea85cdf72fec319038503744e54b1f5e69))


### Features

* add port in use fn ([b8c1a10](https://github.com/ulixee/shared/commit/b8c1a10c6da91a303d284e0e4c0723bc9f5dcf17))
* api function extractor ([b96c7c1](https://github.com/ulixee/shared/commit/b96c7c1bf68c65cdba9278591507b4a3405c8ab9))
* **net:** add remoteId to transports for logs ([1cbc117](https://github.com/ulixee/shared/commit/1cbc117230644fd1e8dc3ba14b7bf01cfdb3142d))
* **net:** don’t throw disconnected if launch ([66176c7](https://github.com/ulixee/shared/commit/66176c7c4050028749d26a9aa63dd46b0d96d3f1))
* specification, crypto projects ([fa61e3d](https://github.com/ulixee/shared/commit/fa61e3d221dacc3c1509309ebbfc7a05cf43923c))





# [2.0.0-alpha.8](https://github.com/ulixee/commons/compare/v2.0.0-alpha.7...v2.0.0-alpha.8) (2022-07-14)

**Note:** Version bump only for package @ulixee/shared-monorepo





# 2.0.0-alpha.7 (2022-07-13)


### Bug Fixes

* another lint issue ([21d03c5](https://github.com/ulixee/commons/commit/21d03c5321f712657697571a816d6e64feb45a81))
* handle * logger ([0610dfa](https://github.com/ulixee/commons/commit/0610dfa3e306718e7088644189b076b41037fc0a))
* readme ([1eac5ba](https://github.com/ulixee/commons/commit/1eac5bab9e860e3a414fab3c5242492c018afa8a))
* scoped loggers ([b431cc7](https://github.com/ulixee/commons/commit/b431cc71d5878cd4172616cef8ab8066b137df15))


### Features

* add bech32m hasher ([65691e8](https://github.com/ulixee/commons/commit/65691e8ebe2f8cae841e45457fd4cc4ccdfbbab1))
* added nvmrc file ([871c936](https://github.com/ulixee/commons/commit/871c936aaa5974a5021af054ab84b8c25213306c))
* databoxesOutDir ([fdd4dd5](https://github.com/ulixee/commons/commit/fdd4dd51549677b29332ba0bc2ddbdc6fd24f61d))
* find project path ([e3e84d1](https://github.com/ulixee/commons/commit/e3e84d19e6af38e533f536a4627a0dfe3f769006))





# [2.0.0-alpha.3](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.2...v2.0.0-alpha.3) (2022-05-19)

**Note:** Version bump only for package @ulixee/commons





# [2.0.0-alpha.2](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.1...v2.0.0-alpha.2) (2022-05-17)

**Note:** Version bump only for package @ulixee/commons





# 2.0.0-alpha.1 (2022-05-16)


### Bug Fixes

* **chromealive:** fix bar positioning and focus ([d47d805](https://github.com/ulixee/ulixee/commit/d47d80514f78f1f92c3bcdcdde6094c1eab28a50))
* **chromealive:** launch from boss ([dc7ad0d](https://github.com/ulixee/ulixee/commit/dc7ad0d4247052d937cbfbb5e6f85c6f1dcd0424))
* **chromealive:** support multiple page states ([2e98ef6](https://github.com/ulixee/ulixee/commit/2e98ef6f1bbc4de3962aec4022435d9e7e1e8500))
* **commons:** move typeserializer test ([a5aa1b8](https://github.com/ulixee/ulixee/commit/a5aa1b8173a897338896e2bf48bae73397d62d76))
* **commons:** tweak small commons features ([14c7c5f](https://github.com/ulixee/ulixee/commit/14c7c5fcf30f3357298c313a6259e2e3bf87437a))
* **commons:** windows logger package formatting ([8590b08](https://github.com/ulixee/ulixee/commit/8590b08d1fcdf735d37cf92ae60636cf43f9c6bf))
* lint ([f7407ac](https://github.com/ulixee/ulixee/commit/f7407ac4e9ea5f5b95643a9e76fd25a26cba0ddf))
* lint require return types ([a829f3f](https://github.com/ulixee/ulixee/commit/a829f3f150e788618f273c7ccfea0a3088ee41d5))
* **pagestate:** service worker dying ([9611927](https://github.com/ulixee/ulixee/commit/9611927eedc6e70321ab0f02c083504a47d203bb))
* sourceLoader test broken ([f68fba8](https://github.com/ulixee/ulixee/commit/f68fba842321b675454fb28300c618b0d394e788))
* **stacks:** don't undo stack traces ([5e72271](https://github.com/ulixee/ulixee/commit/5e7227102d6fe3f58807db1b04de3531d891bead))


### Features

* add logs to boss ([af1905f](https://github.com/ulixee/ulixee/commit/af1905f408df9e1d071ec3cd9e360f1867e413a5))
* added a working databox ([53628c5](https://github.com/ulixee/ulixee/commit/53628c56103c59c962d9d3a76eb51c682e06244b))
* added submodules ([6f97e86](https://github.com/ulixee/ulixee/commit/6f97e86bd876bddc9fe8cab0a3ebdf08913c8dae))
* **apps:** add version to boot ([43cc0db](https://github.com/ulixee/ulixee/commit/43cc0db17fe1ba955ef51cdda5dcc30d0bcfc9de))
* **chromealive:** add a mode ([52b70f7](https://github.com/ulixee/ulixee/commit/52b70f7bbd94f1045a89a13d8933af15dcbbeaf2))
* **chromealive:** add pagestate to ui ([d3b428d](https://github.com/ulixee/ulixee/commit/d3b428d5d1cf1711e396d9e9a1b34ffa537292dc))
* **chromealive:** autoupdate ([b95f86d](https://github.com/ulixee/ulixee/commit/b95f86d1592dac0d73f38cd9032e9c845d79b255))
* **chromealive:** custom message for kept-alive ([fcec203](https://github.com/ulixee/ulixee/commit/fcec203663287245a12c9caf94be1e907b5804fa))
* **chromealive:** hero script ([c3d093c](https://github.com/ulixee/ulixee/commit/c3d093cd6cb50919f4fe4a882e37b0784b418cf1))
* **chromealive:** move timeline over chrome ([f7992ad](https://github.com/ulixee/ulixee/commit/f7992ade9004afc6a36af914d7851154869152b7))
* **chromealive:** nav using hero script lines ([82f9f1b](https://github.com/ulixee/ulixee/commit/82f9f1bde103192b945d116790579d0ecf59b198))
* **chromealive:** new menubar + features ([0131927](https://github.com/ulixee/ulixee/commit/01319278c4a1adf2cc022c6c86b05712fa0f55bc))
* **chromealive:** pause/resume script ([2d99aa1](https://github.com/ulixee/ulixee/commit/2d99aa12bb68d7cfd5e1949f696afc5805fb9b4b))
* collected snippets ([7ecd540](https://github.com/ulixee/ulixee/commit/7ecd5405b7aec12815d0efc4258a0aa3efdac48a))
* **commons:** source map + code loading support ([ec0bb70](https://github.com/ulixee/ulixee/commit/ec0bb70ff0656535cf4be37db9615d2987909e69))
* **commons:** ulixee config ([b02d3ce](https://github.com/ulixee/ulixee/commit/b02d3ce4dfd04f12f7686711a9ab95c08f02e96b))
* convert secret-agent to browser only ([968208f](https://github.com/ulixee/ulixee/commit/968208f0690900dfc641ad4c8fd47b51eef6fa11))
* databox and herobox and merged... working with errors ([2d72035](https://github.com/ulixee/ulixee/commit/2d720353f4c442ac03a41b290c1e25bb501cf94a))
* **finder:** added infrastructure needed for the chromealive finder window ([068fae6](https://github.com/ulixee/ulixee/commit/068fae6f7eda4ebc936cd95caa28e33a29a46e39))
* get collected asset names ([559c4cb](https://github.com/ulixee/ulixee/commit/559c4cb5fb7ae7c349da0c95ba005b8fb551558e))
* **herobox:** add herobox ([785f801](https://github.com/ulixee/ulixee/commit/785f80128370c7dd40711ab58c1366919af3efb6))
* **herobox:** convert collect to by async get ([8e52752](https://github.com/ulixee/ulixee/commit/8e52752c07156de91bf0fd9c676da55b135c9c88))
* **herobox:** synchronous fragments ([2e46083](https://github.com/ulixee/ulixee/commit/2e46083432fd60dfef5f3c5b93e1ff1380329f39))
* merge devtools submodules ([a27ea33](https://github.com/ulixee/ulixee/commit/a27ea339784f0a5a969517571f0d6e21d5dfb52f))
* **pagestate:** storage tracking ([1abaf29](https://github.com/ulixee/ulixee/commit/1abaf29e8d88fe37dd956b2c0b1b2b858bb97368))
* **server:** automatically track server host ([aa42f4d](https://github.com/ulixee/ulixee/commit/aa42f4df27414928f04c4bd6d074bb17fd23213c))
* unify plugin structure ([ac6c30a](https://github.com/ulixee/ulixee/commit/ac6c30afd518c67b3230ff2109c90d381e21aaec))
* unify typescript for ulixee project ([697dc2f](https://github.com/ulixee/ulixee/commit/697dc2fa5e4cc9a3064f7bb17253d7ec88f1793c))
* update deps to chromealive ([dcf9aaa](https://github.com/ulixee/ulixee/commit/dcf9aaa653fec6aadc5878dd7a8d3565e151dc26))
* update testing ([aaf339c](https://github.com/ulixee/ulixee/commit/aaf339c2aa810c8303c948c872a03486e8f76396))
* updated hero submodule to use new @ulixee/hero ([32edb90](https://github.com/ulixee/ulixee/commit/32edb90f0abeef99170817aa676f141a26f986ee))





# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.5.5](https://github.com/ulixee/commons/compare/v1.5.4...v1.5.5) (2021-07-25)


### Bug Fixes

* lint ([f886e24](https://github.com/ulixee/commons/commit/f886e242a58f078399285a12c557a42f873001a3))

### 1.5.4 (2021-07-25)


### Features

* added code from hero ([e2d9d8d](https://github.com/ulixee/commons/commit/e2d9d8df959a242fd4c306cd568f2010181279bc))
* moved code to lib folder + added prettier/lint/etc ([3401a82](https://github.com/ulixee/commons/commit/3401a8258f9811777226f723ab2aa9c25f84455b))


### Bug Fixes

* added some fixes per Blake's feedback ([832a6c1](https://github.com/ulixee/commons/commit/832a6c1a109d7b8c45ce99e361241ac172f2906b))
