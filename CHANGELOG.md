# Changelog
All notable changes to this project will be documented in this file.

<a name="v2.2.0"></a>
## [v2.2.0](https://github.com/rubensworks/rdf-dataset-fragmenter.js/compare/v2.1.0...v2.2.0) - 2022-05-11

### Added
* [Add CSV quad sink](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/ed8e0c814b864ad938df565d5f5e72736651b099)
* [Add filtered quad sink](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/3ffb08a3a7dc48d6e0b4e88b62fcf122b8009974)
* [Add composite quad sink](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/c29a3e5ee6b83d87e53090cb4496db1b7c24bb51)
* [Add matchFullResource option to QuadMatcherResourceType](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/cd3ddb28c43ff949e00958a1315cddfd62636c5d)

<a name="v2.1.0"></a>
## [v2.1.0](https://github.com/rubensworks/rdf-dataset-fragmenter.js/compare/v2.0.1...v2.1.0) - 2022-05-09

### Added
* [Add Solid type index appender](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/fe358073f379e94fc1fd737c895caf9bd1f11c49)
* [Add distinct quad transformer](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/be759727de946e09b364106b3a6183333eb68873)
* [Add append quad link transformer](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/252c2a8d1940f0bfc644eccb40f240ecae41f491)
* [Allow remapped resource identifiers to inherit fragments](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/3254906899b472cbab390470cba39569b599c488)
* [Allow remapped resource identifiers to be modified](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/c46a7a2f0351fb60a135e6afe419b5256376c3b7)
* [Add Composite Sequential Transformer](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/04e078d2c9492820b8702af44ba523e541fe4e27)
* [Add Composite Varying Resource Transformer](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/2b33312fe852bb693bd1bf28ac13a5f867a9f254)

### Fixed
* [Fix variance happening on wrong term](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/014eb9b1b9a1f32278de5531bc7cbe645a45cc32)

<a name="v2.0.1"></a>
## [v2.0.1](https://github.com/rubensworks/rdf-dataset-fragmenter.js/compare/v2.0.0...v2.0.1) - 2022-05-04

### Fixed
* [Update context version in config](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/3089e85acc3a920e649b9bf43c14a13042105013)

<a name="v2.0.0"></a>
## [v2.0.0](https://github.com/rubensworks/rdf-dataset-fragmenter.js/compare/v1.4.0...v2.0.0) - 2022-05-04

### Added
* [Allow newIdentifierSeparator to be a relative IRI](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/669acf877336d26457cfcdb57b95bb9b691d2696)

### Changed
* [Update to Components.js 5](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/62ff0837b7aa7205dd06a2eb74fafaab79b8fcff)

### Fixed
* [Fix remapped resource identifiers not being applied when they occur as objects](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/0af64bd2e59a8f9b0e76571a77edbc8bd707719f)

<a name="v1.4.0"></a>
## [v1.4.0](https://github.com/rubensworks/rdf-dataset-fragmenter.js/compare/v1.3.0...v1.4.0) - 2021-08-30

### Changed
* [Migrate to @rdfjs/types](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/809ead1101f800299a3cde497425c0469b7fdc66)

<a name="v1.3.0"></a>
## [v1.3.0](https://github.com/rubensworks/rdf-dataset-fragmenter.js/compare/v1.2.0...v1.3.0) - 2021-04-27

### Added
* [Expose runConfig function](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/419d6a7c3d3ac36b3166d465882a4ef9a513aab4)

<a name="v1.2.0"></a>
## [v1.2.0](https://github.com/rubensworks/rdf-dataset-fragmenter.js/compare/v1.1.1...v1.2.0) - 2021-04-01

### Added
* [Support resource object fragmentation](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/4a61af10b011152371cfd5c52a28f17d8d40c66a)

### Fixed
* [Fix race condition in composite source causing early termination](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/05b72d3725093cec15cad02986f8b6b9a0ac06d2)

<a name="v1.1.1"></a>
## [v1.1.1](https://github.com/rubensworks/rdf-dataset-fragmenter.js/compare/v1.0.0...v1.1.1) - 2021-02-19

### Fixed
* [Fix directory illegal characters on Windows](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/6d6ee5498fc47d0b51075de668c3abdc25620b76)

<a name="v1.1.0"></a>
## [v1.1.0](https://github.com/rubensworks/rdf-dataset-fragmenter.js/compare/v1.0.0...v1.1.0) - 2021-02-18

### Added
* [Add quad transformers to the pipeline](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/ce08b67a9a599185ff3dd2cd00576de29c8aa360)
* [Add IRI whitelist to QuadTransformerSetIriExtension](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/d75f1a6b52b945de4da91aadaee3da56c9993256)
* [Add relativePath option to subject-based fragmenter](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/0f3b15ec6032f86fd50597cde4a7beb499bb9856)
* [Add exception-based fragmentation strategy](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/8bb8b6322badc12fbfaf23f228eb7b90e081cb55)
* [Add reversal and link type options to append resource link transformer](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/3643ae8b58bff9797a83c7a9327cffd35e6be2ef)
* [Add resource link and SCL append transformers](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/519767a73765a962c81ad3adfa7fa7d66d1dfd16)
* [Add QuadTransformerReplaceIri](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/ee8d11268fa9ea5096ce0b574a2ce72d4eae6b77)

### Changed
* [Allow quad transformers to have optional end callback](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/f3b2df731b96cd6a4cbdc5d4c4a99514399d0b65)
* [Update to Components.js 4](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/e9e6d08b3415f0ad45742ad65cc7cd4d7b1a4b59)

### Fixed
* [Expose bin in package.json](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/e5b42555ea10707ce231f86da16688c1455f3923)
* [Fix only first transformer being applied](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/60af13c7fab7c8a561d01da95959680954bb3781)

<a name="v1.0.0"></a>
## [v1.0.0] - 2020-11-16

Initial release
