# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.0.0-alpha.21](https://github.com/ulixee/platform/compare/v2.0.0-alpha.20...v2.0.0-alpha.21) (2023-04-24)

**Note:** Version bump only for package @ulixee/hero





# [2.0.0-alpha.20](https://github.com/ulixee/platform/compare/v2.0.0-alpha.19...v2.0.0-alpha.20) (2023-04-19)


### Bug Fixes

* **client:** export script instance ([62803e5](https://github.com/ulixee/platform/commit/62803e53d5ab153f3e933c26666733c59f2d4af3))
* **client:** remove ability to specify upload path ([5a6537a](https://github.com/ulixee/platform/commit/5a6537a5603d1715c727b22a3bfc8b59190d33ee))
* log devtools events ([e39575b](https://github.com/ulixee/platform/commit/e39575bb85a75469e7934c78720dcc951995595d))


### Features

* **client:** allow injectable scriptinstance ([09aa700](https://github.com/ulixee/platform/commit/09aa700c04dc008b34822b9af446339f46f70c20))
* **client:** global instanceof checks ([b704669](https://github.com/ulixee/platform/commit/b70466975c83a947803c28c98bbdf642c7b0b052))





# [2.0.0-alpha.19](https://github.com/ulixee/platform/compare/v2.0.0-alpha.18...v2.0.0-alpha.19) (2023-02-25)


### Bug Fixes

* **client:** waitForState not capturing err stack ([338f0aa](https://github.com/ulixee/platform/commit/338f0aaaecd6c38568fac366e3873dc25ccec45e))


### Features

* **core:** proxy local dns feature ([bd6f7dc](https://github.com/ulixee/platform/commit/bd6f7dc4442277ae0379159ebedafc2355fa386f))
* **core:** refactor to accomodate ulixee/desktop ([be9ed0e](https://github.com/ulixee/platform/commit/be9ed0eb2ee905ea4683d814b9a5a694b94a3705))
* **hero:** add connected/session created event ([b638ef7](https://github.com/ulixee/platform/commit/b638ef7ec957f7e67ad66246bdb368214c7eff3c))





# [2.0.0-alpha.18](https://github.com/ulixee/platform/compare/v2.0.0-alpha.17...v2.0.0-alpha.18) (2023-01-17)

**Note:** Version bump only for package @ulixee/hero





# [2.0.0-alpha.17](https://github.com/ulixee/platform/compare/v2.0.0-alpha.16...v2.0.0-alpha.17) (2022-12-15)


### Bug Fixes

* **client:** if no awaited event target, return ([920f843](https://github.com/ulixee/platform/commit/920f843f8a0a915f2d4ce49fc62440961af9d446))
* improve message when hosts w wrong version ([3f30733](https://github.com/ulixee/platform/commit/3f307339af77647d3192dda0ed7304d8dc8dc418))





# [2.0.0-alpha.16](https://github.com/ulixee/platform/compare/v2.0.0-alpha.15...v2.0.0-alpha.16) (2022-12-05)


### Bug Fixes

* **core:** subdomain cookies not being removed ([fad14db](https://github.com/ulixee/platform/commit/fad14db468a3c7354e7e5f865fa3c62bf699eac0))


### Features

* **core:** allow user to specify auto-shutdown ([18371b1](https://github.com/ulixee/platform/commit/18371b1351a00237ffe852d2fd4ca18845112b4f))





# [2.0.0-alpha.15](https://github.com/ulixee/platform/compare/v2.0.0-alpha.14...v2.0.0-alpha.15) (2022-11-17)


### Bug Fixes

* don’t double call onHero ([3ae1326](https://github.com/ulixee/platform/commit/3ae13260baf6b1af8eb34f7899ae066b2f0f4474))
* update awaited-dom to fix ts issue ([b98a567](https://github.com/ulixee/platform/commit/b98a5676df634947ec93e100556ecc4af6cd7890)), closes [#181](https://github.com/ulixee/platform/issues/181)


### Features

* allow string for host connection ([cb5abd0](https://github.com/ulixee/platform/commit/cb5abd0a4b174c8be1eb44ed81a4e2d37e937ae5))
* **blockedResourceUrls:** expose and document ([2db8b93](https://github.com/ulixee/platform/commit/2db8b936ee00467bad41e1ea4408006e099c5f87))





# [2.0.0-alpha.14](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.13...v2.0.0-alpha.14) (2022-11-02)


### Features

* convert unblocked to ulixee org ([6616ec9](https://github.com/ulixee/ulixee/commit/6616ec94186da360e70544c827294b95ecb9381f))





# [2.0.0-alpha.13](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.12...v2.0.0-alpha.13) (2022-10-31)


### Bug Fixes

* **client:** fix HeroReplay replaying a sessionid ([56da409](https://github.com/ulixee/ulixee/commit/56da409ad42dffd7b45333cd53811d6a8163e550))
* implemented Blake's fixes ([64d33fc](https://github.com/ulixee/ulixee/commit/64d33fc57d1b22067de663ad0261b0de51c225a4))
* lint ([5d98583](https://github.com/ulixee/ulixee/commit/5d9858327959ba5aae7f292d5a61851ce3be9971))
* lint issue ([5614afb](https://github.com/ulixee/ulixee/commit/5614afbb0cdc0099d0c053cd19fc2bb091a040fc))


### Features

* added close method to HeroExtractor ([530747b](https://github.com/ulixee/ulixee/commit/530747b83e4c657e8dc2b13c8e687b1206129c88))
* added hero.collect and element. from databox-for-hero ([6c6de12](https://github.com/ulixee/ulixee/commit/6c6de12562a9f85da05bbab0c81cc5d2769f7f05))
* detach now only returns element while addToDetached saves it ([f5641f5](https://github.com/ulixee/ulixee/commit/f5641f5806ba0281a8f0bdd6a0143cfc9326808b))
* expose IHeroExtractorCreateOptions interface ([60d4851](https://github.com/ulixee/ulixee/commit/60d4851648ae133e074b6292ea9f5fcbcbf4f03e))
* renamed DetachedDOM to DetachedElement + getDataSnippet to getSnippet ([d58431a](https://github.com/ulixee/ulixee/commit/d58431a205e354c61c75698e3aefc46cd0ebd7bf))
* renamed HeroExtractor to HeroReplay as well as how $extract/$collect work and are named ([d97fb2d](https://github.com/ulixee/ulixee/commit/d97fb2dd1ce0b5329f6cf99af96dcd29422b55fb))
* renamed HeroPast to HeroExtractor for clarity ([857d8f1](https://github.com/ulixee/ulixee/commit/857d8f1ca3e0cc8c8d104a6598989d1f1ad3ba42))
* replaced CollectedSnippets with hero.getData/setData ([96a731f](https://github.com/ulixee/ulixee/commit/96a731fd295204b7c61d3eb4fbb81131289dc606))





# [2.0.0-alpha.12](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.11...v2.0.0-alpha.12) (2022-10-03)


### Bug Fixes

* client printing incorrect properties ([04b67a7](https://github.com/ulixee/ulixee/commit/04b67a7bc37f6f9e2e76ba897f00dce611fa03a8)), closes [#152](https://github.com/ulixee/ulixee/issues/152)
* update client hints spec for hero meta ([0455bf9](https://github.com/ulixee/ulixee/commit/0455bf943e3203a72e12cc43b240874b4e9bd1b8))





# [2.0.0-alpha.11](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.10...v2.0.0-alpha.11) (2022-08-31)

**Note:** Version bump only for package @ulixee/hero





# [2.0.0-alpha.10](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.9...v2.0.0-alpha.10) (2022-08-16)

**Note:** Version bump only for package @ulixee/hero





# [2.0.0-alpha.9](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.8...v2.0.0-alpha.9) (2022-07-26)

**Note:** Version bump only for package @ulixee/hero





# [2.0.0-alpha.8](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.7...v2.0.0-alpha.8) (2022-07-13)


### Bug Fixes

* **core:** fix profile restore ([bd86f48](https://github.com/ulixee/ulixee/commit/bd86f48889448ba42b5331b0502af2f9ad9dc94f))
* **client** fix: the doneFn in waitForResource should support async ([715992](https://github.com/ulixee/ulixee/commit/71599287ac2352d6df2690f696fee3f0c9476a3d))




# [2.0.0-alpha.7](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.6...v2.0.0-alpha.7) (2022-06-28)


### Bug Fixes

* **client:** disable tests global config overwrite ([7762be3](https://github.com/ulixee/ulixee/commit/7762be32766880e4564f7196b8d4a74ecfe5992f))
* **core:** fix unblocked references ([edabadd](https://github.com/ulixee/ulixee/commit/edabadd08738875234afc9735e0ad81c31bc5c95))
* **hero:** cleanup changes to global config ([3e37b93](https://github.com/ulixee/ulixee/commit/3e37b931ad2117505ec73fc173034e9e4c2e70c2))


### Features

* **client:** $contentDocument AwaitedDOM extender ([d4bacbf](https://github.com/ulixee/ulixee/commit/d4bacbfa56086e60f72b80a9b5284a0d4bb678c8))
* **client:** add stdout/stderr piping on relaunch ([bcf5bb5](https://github.com/ulixee/ulixee/commit/bcf5bb57feccd506bfd8a5ce71f4994728a361d6))
* **client:** include script process exec details ([0103151](https://github.com/ulixee/ulixee/commit/010315147b7c10f9b02884042b1d07dfcb83b340))





# [2.0.0-alpha.6](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.5...v2.0.0-alpha.6) (2022-06-10)

**Note:** Version bump only for package @ulixee/hero





# [2.0.0-alpha.5](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.4...v2.0.0-alpha.5) (2022-06-10)


### Bug Fixes

* expose connections for test ([59433ea](https://github.com/ulixee/ulixee/commit/59433eadbb0d0f598cd3274c2b8d8c3fdf804119))





# [2.0.0-alpha.4](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.3...v2.0.0-alpha.4) (2022-06-09)


### Bug Fixes

* empty null rejection on early hero terminate ([6159a79](https://github.com/ulixee/ulixee/commit/6159a7904c649c1cdb152004d96cd0baef96ff74))
* update command for server start ([6a422ec](https://github.com/ulixee/ulixee/commit/6a422ec1fe6583ac247b417d84aeb27831076942))





# [2.0.0-alpha.3](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.2...v2.0.0-alpha.3) (2022-05-19)

**Note:** Version bump only for package @ulixee/hero





# [2.0.0-alpha.2](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.1...v2.0.0-alpha.2) (2022-05-17)

**Note:** Version bump only for package @ulixee/hero





# [2.0.0-alpha.1](https://github.com/ulixee/ulixee/compare/v1.5.4...v2.0.0-alpha.1) (2022-05-16)


### Bug Fixes

* broken Omit type ([c495544](https://github.com/ulixee/ulixee/commit/c495544a5c584c4e52f9ca53fd647326b05ed8fc))
* **client:** awaitedDom forEach ([105f535](https://github.com/ulixee/ulixee/commit/105f535cbfb8a0aa1cbfe34218eb638f89d83cfc))
* **client:** client hung on disconnect ([7d5d432](https://github.com/ulixee/ulixee/commit/7d5d432c9ff01a3b009fb01c489ae44cbc8a709a))
* **client:** convention of options for args ([2e94c4e](https://github.com/ulixee/ulixee/commit/2e94c4e03e2b4dc1c570ac23f75c78406e00e2cb))
* **client:** disconnect connection on process exit ([6124344](https://github.com/ulixee/ulixee/commit/6124344911b4a067f7fff9a71085c531f67f7b6d))
* **client:** fix domExtender interface ([e74b2b3](https://github.com/ulixee/ulixee/commit/e74b2b3c7032bdbf0c7458b23caab2ab5c844286))
* **client:** hero connection failing on getter ([7d2faa5](https://github.com/ulixee/ulixee/commit/7d2faa5530a41152321307b3727425ef31175dc4))
* **client:** no waitFor in waitForState ([e22ccbe](https://github.com/ulixee/ulixee/commit/e22ccbe39265e13df51589716745d9ee7fbfd502))
* **client:** reload should return a resource ([72c87a1](https://github.com/ulixee/ulixee/commit/72c87a1b851d9060af4636987864dfcd65eb4a74))
* **client:** remove page state id from path ([c7ef61e](https://github.com/ulixee/ulixee/commit/c7ef61efb725003081ad8387e2fc8c3e8122b107))
* **client:** second tab domState not working ([3daaa9d](https://github.com/ulixee/ulixee/commit/3daaa9daaaefc7f2b0872b0c5ff74f4c481a93b0))
* **client:** tests broken ([f3c60c7](https://github.com/ulixee/ulixee/commit/f3c60c73c5eaf7076c3bb51c434040d45538eccb))
* **client:** timetravel fixes for dom state ([4a7221a](https://github.com/ulixee/ulixee/commit/4a7221ab513910e96c24028c5e36cc9bdee39293))
* **client:** wait for command flush ([d87535f](https://github.com/ulixee/ulixee/commit/d87535ffc4a3fdfda9c601a581af4b7fa92dfd83))
* converted arrow functions to allow this inside prototype methods ([6ff62f4](https://github.com/ulixee/ulixee/commit/6ff62f41a57a5a40b7b29a5d9c10ffc2e40a27a2))
* **core:** allow customizing waitForVisible ([1982f52](https://github.com/ulixee/ulixee/commit/1982f52e16bca39b4ab4179e9970a190e4340652))
* **core:** cleanup detached dom jspath tracking ([c427c21](https://github.com/ulixee/ulixee/commit/c427c210b00df84bf3b00fd43905ce494769d339))
* **core:** default waitForResource from last cmd ([a0b369e](https://github.com/ulixee/ulixee/commit/a0b369e40f70e542f226157571bb92bc409fd811))
* **core:** dom state event handler timing issue ([79ce797](https://github.com/ulixee/ulixee/commit/79ce7979998225e656a3234e711256d98e923fa0))
* **core:** don’t record recordOutput as command ([e7145d9](https://github.com/ulixee/ulixee/commit/e7145d950184466436d368818cf1c4d14c66f857))
* **core:** fix event listener warnings ([df0e824](https://github.com/ulixee/ulixee/commit/df0e824fcf85b1545162947b8aee697b12e69b67))
* **core:** handle detached when elements not there ([ad11e65](https://github.com/ulixee/ulixee/commit/ad11e65a143980d8793a52e7f96054a43bb62ed8))
* **core:** interaction command highlights ([b5e541f](https://github.com/ulixee/ulixee/commit/b5e541fb527f01ddc49f3e9c82c69034bc94d777))
* **core:** lint issues ([5bb2a92](https://github.com/ulixee/ulixee/commit/5bb2a925e6c3b47ca1d14342c6062642b55f9f01))
* **core:** load fragments from other session ([8145a01](https://github.com/ulixee/ulixee/commit/8145a0125a826a413ae23f0112534ed49c9b4afc))
* **core:** make collected resources synchronous ([6439c6d](https://github.com/ulixee/ulixee/commit/6439c6d11e0ee2990de7e2ad48058382a3f30995))
* **core:** sinceCommandId validation ([fa61cc0](https://github.com/ulixee/ulixee/commit/fa61cc0bbea0ea4e26946adf40fc9066aaf7bed1))
* **core:** timeline fixes, nanoid ([59dbd0d](https://github.com/ulixee/ulixee/commit/59dbd0d1f55065fa60525796ac2f60f19e07706b))
* fixed lint issues + moved Core code back into fullstack/index.ts ([5ba28d9](https://github.com/ulixee/ulixee/commit/5ba28d9b2109dd302cb9b0e02f63585efa671e84))
* **hero:** close cli prompt on disconnect ([3da1631](https://github.com/ulixee/ulixee/commit/3da16319e02638a47ef5d4b4f8ea4e75f85f442d))
* **interaction:** cancel mouse clicks on mousedown ([afd1964](https://github.com/ulixee/ulixee/commit/afd19649c6d3c913b99cc0fa9a21e1c954f4ffbc))
* moved awaited-dom to a devDependency in fullstack ([ecdb274](https://github.com/ulixee/ulixee/commit/ecdb274b81c298f69d50c36a5d15c24c162b43a8))
* **plugins:** fix order of plugin paths loaded ([320dc60](https://github.com/ulixee/ulixee/commit/320dc60177d4924c7d46bb53227f4773dea890ec))
* **plugins:** revise plugin extensions ([2bf7ae4](https://github.com/ulixee/ulixee/commit/2bf7ae47602bfebc67a6a5d1f30c2589953aa91b))
* **puppet:** turn off final screenshot for cast ([0a9f124](https://github.com/ulixee/ulixee/commit/0a9f12469a6f7261ee46de69c8f6949c6c485e1c))
* removed imports that weren't being used ([f7808f2](https://github.com/ulixee/ulixee/commit/f7808f236ac7f3bb1f94ada3bdf556c8b6ef5c68))
* singularized ResourceType and KeyboardKey ([cfe39b3](https://github.com/ulixee/ulixee/commit/cfe39b353cab5bcdbe66eda6ee3b7cc6437e46c4))
* **timetravel:** fix timetravel back ([7435a49](https://github.com/ulixee/ulixee/commit/7435a4962945a8af6c4db759e9980418a6c3f463))
* **timetravel:** split recording out of timeline ([671e0e9](https://github.com/ulixee/ulixee/commit/671e0e91089691e483f28eb9141b21a4605f840f))
* **timetravel:** unidentified frames break replay ([708e2dd](https://github.com/ulixee/ulixee/commit/708e2ddf75588a92366bfeb54cb7e2e6caa4b387))
* **user-profile:** handle empty database ([be78e3a](https://github.com/ulixee/ulixee/commit/be78e3a665ce86faeb454e092ac59db2b8f5e0d5))


### Features

* added DomExtender to non-super classes ([3c9882b](https://github.com/ulixee/ulixee/commit/3c9882baefb75dda5ee0c6b2c9f2b528399be68b))
* added extractorPromises into Client's CoreSession ([daf783a](https://github.com/ulixee/ulixee/commit/daf783a81b6ad5965e41b4eee592875815a0e7e7))
* added OutputTable, removed externalIds and random bugs ([1736ad2](https://github.com/ulixee/ulixee/commit/1736ad2037e43c55f459864d93c78c8eca7c4074))
* added ResourceTypes enum + IResourceType to hero export ([d8b0bb8](https://github.com/ulixee/ulixee/commit/d8b0bb81d48943dba638213ba24c38399f63c32a))
* added some more dom extenders ([77cb2de](https://github.com/ulixee/ulixee/commit/77cb2de0cae07f89034d9e811e5064eab1597157))
* added support needed for elem. in databox ([a44c0db](https://github.com/ulixee/ulixee/commit/a44c0db81a1a280f66f296d6c3bb81977f70b80a))
* **client/core:** add client loadStatus props ([21e6a3e](https://github.com/ulixee/ulixee/commit/21e6a3e0f23ce759515850d1e5d881cf7ac76567))
* **client:** ability to run exported page state ([6c33e02](https://github.com/ulixee/ulixee/commit/6c33e02749d44ae569ca15a76f1949561981f60c))
* **client:** add background mode ([65ce67d](https://github.com/ulixee/ulixee/commit/65ce67daaada576e2c6969f868e9239fff0e00cf))
* **client:** add pause commands to api ([90e8303](https://github.com/ulixee/ulixee/commit/90e83039362e62a3ecf17b75a1c569b3813a4793))
* **client:** add serialized callstack ([7a87445](https://github.com/ulixee/ulixee/commit/7a87445a5ea772769cd5cf2df5528e9653bd12a8))
* **client:** add single resource search apis ([ecd732c](https://github.com/ulixee/ulixee/commit/ecd732c611eafd72f8d8a88216eedc5f090ba70b))
* **client:** children frames property ([28709e5](https://github.com/ulixee/ulixee/commit/28709e55d8b74f980dc4785072cfa6f0f57bad1f))
* **client:** flow commands ([af23474](https://github.com/ulixee/ulixee/commit/af23474e3351b6f60e0bac9392cbbaa979a0ab6d))
* **client:** focus and xpath dom extenders ([0888c8b](https://github.com/ulixee/ulixee/commit/0888c8b50b70193695b9fd4d1243fd55a8cd337f))
* **client:** for flow handler names ([8b1b144](https://github.com/ulixee/ulixee/commit/8b1b144adc56c712877af147ba95b06c2ff642fe))
* **client:** publish callsite as json ([575f754](https://github.com/ulixee/ulixee/commit/575f75416589b7ec77c5afa246c0d40cc07cf73d))
* **client:** return resource in waitForLocation ([3ebf319](https://github.com/ulixee/ulixee/commit/3ebf319de1fc8e56448833a4ab5c703272b7697c))
* **client:** waitForPageState(states, options) ([dae7f24](https://github.com/ulixee/ulixee/commit/dae7f2446afd0716a6e2063088cb456f5f301029))
* core session now has access to it's hero instance ([62e17bb](https://github.com/ulixee/ulixee/commit/62e17bbbf83d69b9555f8d6a14eb28e258b183f3))
* **core:** ability to load a frozen tab from db ([12628d2](https://github.com/ulixee/ulixee/commit/12628d2c3721fd9c504c432e5f4579aa7665bafd))
* **core:** add keepalive message and cli ([44caf22](https://github.com/ulixee/ulixee/commit/44caf22e3a5200904a6fcc2e8cbf3269dcac5b15))
* **core:** add return value to flow commands ([029e676](https://github.com/ulixee/ulixee/commit/029e6767442d8ae60d90a44402f1d59e6450e8b0))
* **core:** add returns to waitForLoad/element ([ac7bd94](https://github.com/ulixee/ulixee/commit/ac7bd948c08e96496ad1887d8a013a760792b8ce))
* **core:** api to get all collected names ([c965286](https://github.com/ulixee/ulixee/commit/c9652869077090321751a220b7a2b8efe9f4b013))
* **core:** browserless session ([0de6846](https://github.com/ulixee/ulixee/commit/0de684696253181661903993fe53eb4e38c72e31))
* **core:** click verification modes ([bbfffde](https://github.com/ulixee/ulixee/commit/bbfffde792cfaf7e2a37ceb5acb781fbe4332155))
* **core:** collect and recreate fragments ([69db46e](https://github.com/ulixee/ulixee/commit/69db46e40cb2a8980337d9714419cc4d045b1dbc))
* **core:** collect fragment html in background ([b6dffb3](https://github.com/ulixee/ulixee/commit/b6dffb3ae2c3b76d24e707210b9d9670072f9daa))
* **core:** collect resources ([db700e6](https://github.com/ulixee/ulixee/commit/db700e620f58e1036fa497cbc21cb4dfecdca3f0))
* **core:** collect snippet ([d6e21dd](https://github.com/ulixee/ulixee/commit/d6e21ddd5a9d1491e66071458818768fcb2a9b7e))
* **core:** collected res timestamp and commandid ([12c3c69](https://github.com/ulixee/ulixee/commit/12c3c6972b881ffd91133c058b5d646879772eec))
* **core:** command timeline ([ba2ec46](https://github.com/ulixee/ulixee/commit/ba2ec468128b8ac605c8856d07d6160164aedb0a))
* **core:** convert page state to dom state ([213b6c9](https://github.com/ulixee/ulixee/commit/213b6c966d887f2a97837ae0c58ab561c3e740f8))
* **core:** dialogs should run out of order ([b3db8b4](https://github.com/ulixee/ulixee/commit/b3db8b44a522073fdb25497dc6f9e1affe82b471))
* **core:** find resources ([3213c91](https://github.com/ulixee/ulixee/commit/3213c91e5e2e0d2d9ada716cc13e2d0333c87c66))
* **core:** flow handlers ([cd1ced6](https://github.com/ulixee/ulixee/commit/cd1ced611d78abbd513c023662630f061f4af7f4))
* **core:** keyboard shortcuts ([19fa006](https://github.com/ulixee/ulixee/commit/19fa006f4ecc3f467a714d107fab25b7930fcc82))
* **core:** magic selectors ([f79170b](https://github.com/ulixee/ulixee/commit/f79170b47595dbda8765930e5493e04addbc29b1))
* **core:** min valid assertions for batch ([369e9d3](https://github.com/ulixee/ulixee/commit/369e9d3848218fde2f7f34cee57fcc5be72cf716))
* **core:** pagestate loadFrom @ shortcut; mode ([de3621b](https://github.com/ulixee/ulixee/commit/de3621bf9266a6a9a4e45c5e5da1ed167537bcab))
* **core:** push page states, code module ([94ccc56](https://github.com/ulixee/ulixee/commit/94ccc56258a75633bf3f632f26fff3de78d61504))
* **core:** re-broadcast events during resume ([88b0ca9](https://github.com/ulixee/ulixee/commit/88b0ca94401e3fc24313f284e3446e9a22efb877))
* **core:** timestamp/commandId for snippets/elems ([5cb3c92](https://github.com/ulixee/ulixee/commit/5cb3c92fc8523e1903ae578565915b127f433f61))
* **core:** use local dir for page state ([d884e81](https://github.com/ulixee/ulixee/commit/d884e81448e7db9d6f8a1613f7cefe8c5449caed))
* **core:** waitForHidden elements ([564659d](https://github.com/ulixee/ulixee/commit/564659d691415bdcdf360afc2062f0f96d34a69e))
* **docs:** add flow documentation ([56c2d98](https://github.com/ulixee/ulixee/commit/56c2d98f341e558217f603b64cf1ed941669a08a))
* dropped $ as an object in favor of ([b8b41ad](https://github.com/ulixee/ulixee/commit/b8b41ad58dc7487233c08ee589804690133d3f2d))
* export ISuperElement and ISuperNode from hero ([b9ba603](https://github.com/ulixee/ulixee/commit/b9ba6033f4d488a30dd7b3817e870f4223d34c4a))
* hero should use .ulixee folder as defaults ([017b52f](https://github.com/ulixee/ulixee/commit/017b52f48b09219f3fe5e6febaf7c2ff089c8a5f))
* **hero:** automatic server port use ([0199338](https://github.com/ulixee/ulixee/commit/0199338b9cdad68c7e5acd036597bf8d3252c90c))
* **mitm:** record documentUrl in resources ([295567b](https://github.com/ulixee/ulixee/commit/295567b8dfc1b8b43795dc1e07e2272b9921ae4b))
* **mitm:** update go dependenices ([2bc44fa](https://github.com/ulixee/ulixee/commit/2bc44fa5e2ffcb6bb61b4505829fd1e4f1e6dbae))
* **plugins:** add ability to exec js on frame ([0f2cb97](https://github.com/ulixee/ulixee/commit/0f2cb97c6cc67d13331bcc7baebff838f028077e))
* **plugins:** fix typing and load-order ([01cad91](https://github.com/ulixee/ulixee/commit/01cad91c3d7857abae8cdb23506407027e082567))
* **plugins:** on browser context ([3e5cead](https://github.com/ulixee/ulixee/commit/3e5ceadd63790191f966802d185983e11adcf0bf))
* removed  from hero and added to databox ([370baad](https://github.com/ulixee/ulixee/commit/370baad788dcece8a595e705c49075be5a768287))
* removed hero.magicSelector/All and replaced with hero.querySelector/All shortcut ([f06d242](https://github.com/ulixee/ulixee/commit/f06d242dfd6727f0896ba9cbc1bbfb9a012b3d33))
* renamed resource outputs to getters: buffer, text, json ([3b493f2](https://github.com/ulixee/ulixee/commit/3b493f2c40cadddceaea042849933ef8bb088d4a))
* some slight syntax changes and renames to state and flow handlers in client ([9dae5ce](https://github.com/ulixee/ulixee/commit/9dae5ce184989b3f311d14836a4ac584ad99672d))
* unify plugin structure ([6b9138d](https://github.com/ulixee/ulixee/commit/6b9138d890b6fb845af057fef4f390522614978f))
