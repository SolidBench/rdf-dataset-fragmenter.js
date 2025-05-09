# Changelog
All notable changes to this project will be documented in this file.

<a name="v2.9.0"></a>
## [v2.9.0](https://github.com/SolidBench/rdf-dataset-fragmenter.js/compare/v2.8.0...v2.9.0) - 2025-04-17

### Added
* [Add TermTemplateQuadComponentLiteral](https://github.com/SolidBench/rdf-dataset-fragmenter.js/commit/6e15d4d587a2895eaa96c11c5b702cc7fdbb464d)
* [Add QuadTransformerBlankToFragment](https://github.com/SolidBench/rdf-dataset-fragmenter.js/commit/302fa3ec60dc0c8f581ab95fbbf225cc07d9b149)
* [Add QuadMatcherTermValue](https://github.com/SolidBench/rdf-dataset-fragmenter.js/commit/873ce0a7d28d7ca322065c4bf97451f902a64c8a)

### Changed
* [Clean-up VoID and Bloom filter generation (#49)](https://github.com/SolidBench/rdf-dataset-fragmenter.js/commit/1c26e23dd9c7748aee9f47bce82ab56b2c7c29be)

<a name="v2.8.0"></a>
## [v2.8.0](https://github.com/SolidBench/rdf-dataset-fragmenter.js/compare/v2.7.1...v2.8.0) - 2024-10-15

### Added
* [Add HDT Quad sink](https://github.com/SolidBench/rdf-dataset-fragmenter.js/commit/b50d42ef4aa91dcd0fc3ba08d49f41f27993e3a5)

### Changed
* [Use regular expression matching in QuadSinkFile and prioritise longest match](https://github.com/SolidBench/rdf-dataset-fragmenter.js/commit/c756f424ba06e72e3288c82e324cab65af9ee3bb)
* [Bump target to ES2021](https://github.com/SolidBench/rdf-dataset-fragmenter.js/commit/26d5f3ea55116147a75f62a0eef748b506c7e6cf)

<a name="v2.7.1"></a>
## [v2.7.1](https://github.com/SolidBench/rdf-dataset-fragmenter.js/compare/v2.7.0...v2.7.1) - 2024-05-02

### Fixed
* [Move @types/bloem from devDependencies to dependencies](https://github.com/SolidBench/rdf-dataset-fragmenter.js/commit/0f77125a86522caba985823fa8387e47dba83448)

<a name="v2.7.0"></a>
## [v2.7.0](https://github.com/SolidBench/rdf-dataset-fragmenter.js/compare/v2.6.0...v2.7.0) - 2024-05-02

### Added
* [Add dataset summary fragmentation strategies for Bloom and VoID](https://github.com/SolidBench/rdf-dataset-fragmenter.js/commit/f7173877ef4b146765728c57b5e7a996db0a476e)

<a name="v2.6.0"></a>
## [v2.6.0](https://github.com/SolidBench/rdf-dataset-fragmenter.js/compare/v2.5.1...v2.6.0) - 2024-04-24

### Added
* [Add constant fragmentation strategy](https://github.com/SolidBench/rdf-dataset-fragmenter.js/commit/8e45de861865e86fa67d6eb6609874ebde456543)

<a name="v2.5.1"></a>
## [v2.5.1](https://github.com/SolidBench/rdf-dataset-fragmenter.js/compare/v2.5.0...v2.5.1) - 2024-03-25

### Changed
* [Update lru-cache to 10.2.0](https://github.com/SolidBench/rdf-dataset-fragmenter.js/commit/46e531b4b1af12599c0289720927c1334480cbe1)

### Fixed
* [Fix QuadTransformerCompositeVaryingResource producing multiple fragmentation strategies](https://github.com/SolidBench/rdf-dataset-fragmenter.js/commit/075deee99d9f61fb664ec36ade7c635c74939926)

<a name="v2.5.0"></a>
## [v2.5.0](https://github.com/SolidBench/rdf-dataset-fragmenter.js/compare/v2.4.0...v2.5.0) - 2024-02-23

### Added
* [Add QuadTransformerDistributeIri](https://github.com/SolidBench/rdf-dataset-fragmenter.js/commit/6e1f00bbc41e43a18b0ba3389c53aa05544d8867)

### Changed
* [Upgrade mkdirp for better compatability with newer TS versions](https://github.com/SolidBench/rdf-dataset-fragmenter.js/commit/ca663778f12aebd941255dc0a4ed3cbc50d63d31)

<a name="v2.4.0"></a>
## [v2.4.0](https://github.com/SolidBench/rdf-dataset-fragmenter.js/compare/v2.3.6...v2.4.0) - 2023-10-23

### Added
* [Add Replace BlankNode by NamedNode Transformer](https://github.com/SolidBench/rdf-dataset-fragmenter.js/commit/5dd80e8c1f14f7a46b16954489f1f69f044160b4)

<a name="v2.3.6"></a>
## [v2.3.6](https://github.com/SolidBench/rdf-dataset-fragmenter.js/compare/v2.3.5...v2.3.6) - 2022-11-09

### Fixed
* [Include source map files in packed files](https://github.com/SolidBench/rdf-dataset-fragmenter.js/commit/38466b5ee25a4f4e92767e1f5483d16982e01d8e)

<a name="v2.3.5"></a>
## [v2.3.5](https://github.com/SolidBench/rdf-dataset-fragmenter.js/compare/v2.3.4...v2.3.5) - 2022-08-09

### Fixed
* [Make distinct transformer only consider appended quads](https://github.com/SolidBench/rdf-dataset-fragmenter.js/commit/4fc0983674fe262086eb654fd62c2364dd714806)

<a name="v2.3.4"></a>
## [v2.3.4](https://github.com/SolidBench/rdf-dataset-fragmenter.js/compare/v2.3.3...v2.3.4) - 2022-08-09

### Fixed
* [Fix distinct transformer not considering allowedComponent](https://github.com/SolidBench/rdf-dataset-fragmenter.js/commit/dd5825ec2bc5f54d1dd40675b9c218e2162af41f)

<a name="v2.3.3"></a>
## [v2.3.3](https://github.com/SolidBench/rdf-dataset-fragmenter.js/compare/v2.3.2...v2.3.3) - 2022-08-09

### Fixed
* [Fix varying transformer breaking chained resource remappers](https://github.com/SolidBench/rdf-dataset-fragmenter.js/commit/d3fe2dba2dee4b3eadc02ba2fecfea64491ee3fa)

<a name="v2.3.2"></a>
## [v2.3.2](https://github.com/SolidBench/rdf-dataset-fragmenter.js/compare/v2.3.1...v2.3.2) - 2022-08-09

### Fixed
* [Fix varying transformer breaking on triples for different transformers](https://github.com/SolidBench/rdf-dataset-fragmenter.js/commit/ee1a7bcb1539ca2d0493982510cac79c7ea9935e)

<a name="v2.3.1"></a>
## [v2.3.1](https://github.com/SolidBench/rdf-dataset-fragmenter.js/compare/v2.3.0...v2.3.1) - 2022-08-09

### Fixed
* [Fix incomplete mapped resources missing related objects](https://github.com/SolidBench/rdf-dataset-fragmenter.js/commit/03d025b28a8729dca7cf41454bfa4e1ba6818491)

<a name="v2.3.0"></a>
## [v2.3.0](https://github.com/SolidBench/rdf-dataset-fragmenter.js/compare/v2.2.1...v2.3.0) - 2022-08-02

### Added
* [Add append quad transformer](https://github.com/SolidBench/rdf-dataset-fragmenter.js/commit/80159eea751cb224b217bfb07b98ad3f3278b0b9)

<a name="v2.2.1"></a>
## [v2.2.1](https://github.com/rubensworks/rdf-dataset-fragmenter.js/compare/v2.2.0...v2.2.1) - 2022-05-25

### Fixed
* [Fix quads near the stream end sometimes being lost](https://github.com/rubensworks/rdf-dataset-fragmenter.js/commit/f16958ac2f5702ed3a0811cc6a7498c5822c4b68)

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
