# RDF Dataset Fragmenter

[![Build status](https://github.com/SolidBench/rdf-dataset-fragmenter.js/workflows/CI/badge.svg)](https://github.com/SolidBench/rdf-dataset-fragmenter.js/actions?query=workflow%3ACI)
[![Coverage Status](https://coveralls.io/repos/github/SolidBench/rdf-dataset-fragmenter.js/badge.svg?branch=master)](https://coveralls.io/github/SolidBench/rdf-dataset-fragmenter.js?branch=master)
[![npm version](https://badge.fury.io/js/rdf-dataset-fragmenter.svg)](https://www.npmjs.com/package/rdf-dataset-fragmenter)

This tool takes one or more datasets as input,
and fragments it into multiple smaller datasets as output,
based on the selected fragmentation strategy.

This reads and writes datasets in a streaming manner,
to support datasets larger than memory.

## Installation

```bash
$ npm install -g rdf-dataset-fragmenter
```
or
```bash
$ yarn global add rdf-dataset-fragmenter
```

## Usage

### Invoke from the command line

This tool can be used on the command line as `rdf-dataset-fragmenter`,
which takes as single parameter the path to a config file:

```bash
$ rdf-dataset-fragmenter path/to/config.json
```

### Config file

The config file that should be passed to the command line tool has the following JSON structure:

```json
{
  "@context": "https://linkedsoftwaredependencies.org/bundles/npm/rdf-dataset-fragmenter/^2.0.0/components/context.jsonld",
  "@id": "urn:rdf-dataset-fragmenter:default",
  "@type": "Fragmenter",
  "quadSource": {
    "@type": "QuadSourceFile",
    "filePath": "path/to/dataset.ttl"
  },
  "fragmentationStrategy": {
    "@type": "FragmentationStrategySubject"
  },
  "quadSink": {
    "@type": "QuadSinkFile",
    "log": true,
    "outputFormat": "application/n-quads",
    "iriToPath": {
      "http://example.org/base/": "output/base/",
      "http://example.org/other/": "output/other/"
    }
  }
}
```

The important parts in this config file are:
* `"quadSource"`: The source from which RDF triples/quads should be read from.
* `"fragmentationStrategy"`: The strategy that will be employed for fragmentation.
* `"quadSink"`: The target into which fragmented RDF triples/quads will be written from.
* `"transformers"`: Optional transformations over the quad stream.

In this example, the config file will read from the `"path/to/dataset.ttl"` file,
employ subject-based fragmentation, and will write into files in the `"output/"` directory.
For example, the triple `<http://example.org/base/ex1> a <ex:thing>` will be saved into the file `output/base/ex1`,
while the triple `<http://example.org/other/ex2> a <ex:thing>` will be saved into the file `output/other/ex2`.

The available configuration components will be explained in more detail hereafter.

## Configure

### Quad Sources

A quad source is able to provide a stream of quads as input to the fragmentation process.

#### File Quad Source

A file quad source takes as parameter the path to a local RDF file.

```json
{
  "quadSource": {
    "@type": "QuadSourceFile",
    "filePath": "path/to/dataset.ttl"
  }
}
```

#### Composite Quad Source

A composite quad source allows you to read from multiple quad sources in parallel.

```json
{
  "quadSource": {
    "@type": "QuadSourceComposite",
    "sources": [
      {
        "@type": "QuadSourceFile",
        "filePath": "path/to/dataset1.ttl"
      },
      {
        "@type": "QuadSourceFile",
        "filePath": "path/to/dataset2.ttl"
      },
      {
        "@type": "QuadSourceFile",
        "filePath": "path/to/dataset3.ttl"
      }
    ]
  }
}
```

### Fragmentation Strategy

A fragmentation strategy that fragments a stream of quads into different documents.
Concretely, it takes quads from the source, and pipes them into a quad sink.

#### Subject Fragmentation Strategy

A fragmentation strategy that places quads into their subject's document.

```json
{
  "fragmentationStrategy": {
    "@type": "FragmentationStrategySubject"
  }
}
```

Optionally, the `relativePath` property can be used
to define a relative IRI that should be applied to the subject IRI before determining its document.
This will not change the quad, only the document IRI.

#### Object Fragmentation Strategy

A fragmentation strategy that places quads into their object's document.

```json
{
  "fragmentationStrategy": {
    "@type": "FragmentationStrategyObject"
  }
}
```

#### Composite Fragmentation Strategy

A fragmentation strategy that combines multiple strategies.
This means that all the given strategies will be executed in parallel.

```json
{
  "fragmentationStrategy": {
    "@type": "FragmentationStrategyComposite",
    "strategies": [
      { "@type": "FragmentationStrategySubject" },
      { "@type": "FragmentationStrategyObject" }
    ]
  }
}
```

#### Resource Object Fragmentation Strategy

A fragmentation strategy that groups triples by (subject) resources,
and places quads into the document identified by the given predicate value.

Blank nodes are not supported.

```json
{
  "fragmentationStrategy": {
    "@type": "FragmentationStrategyResourceObject",
    "targetPredicateRegex": "vocabulary/hasMaliciousCreator$"
  }
}
```

#### Exception Fragmentation Strategy

A fragmentation strategy that delegates quads to a base strategy,
but allows defining exceptions that should be delegated to other strategies.
These exceptions are defined in terms of a matcher (e.g. match by quad predicate).

The following config uses the subject-based strategy for everything,
except for predicate1 and predicate2 that will be delegated to the object-based strategy.

```json
{
  "fragmentationStrategy": {
    "@type": "FragmentationStrategyException",
    "strategy": {
      "@type": "FragmentationStrategySubject"
    },
    "exceptions": [
      {
        "@type": "FragmentationStrategyExceptionEntry",
        "matcher": {
          "@type": "QuadMatcherPredicate",
          "predicateRegex": "vocabulary/predicate1"
        },
        "strategy": {
          "@type": "FragmentationStrategyObject"
        }
      },
      {
        "@type": "FragmentationStrategyExceptionEntry",
        "matcher": {
          "@type": "QuadMatcherPredicate",
          "predicateRegex": "vocabulary/predicate2"
        },
        "strategy": {
          "@type": "FragmentationStrategyObject"
        }
      }
    ]
  }
}
```

#### Constant Fragmentation Strategy

A fragmentation strategy that delegates all quads towards a single path.

```json
{
  "fragmentationStrategy": {
    "@type": "FragmentationConstant",
    "path": "http://localhost:3000/datadump"
  }
}
```

#### VoID Description Fragmentation Strategy

Fragmentation strategy that generates partial dataset descriptions
using the standard [VoID vocabulary](https://www.w3.org/TR/void/).
The dataset URIs are determined based on quad subject values using regular expressions.

```json
{
  "fragmentationStrategy": {
    "@type": "FragmentationStrategyDatasetSummaryVoID",
    "datasetPatterns": [
      "^(.*\\/pods\\/[0-9]+\\/)"
    ]
  }
}
```

#### Bloom Filter Fragmentation Strategy

Fragmentation strategy that generates Bloom filters to capture co-occurrence of resources and properties,
using the custom [membership filter vocabulary](http://semweb.mmlab.be/ns/membership).
The filters are generated per-dataset, where the dataset URI is determined based on quad subject values using regular expressions.
After generation, the summaries can be re-mapped to a different document URI.

```json
{
  "fragmentationStrategy": {
    "@type": "FragmentationStrategyDatasetSummaryBloom",
    "hashBits": 256,
    "hashCount": 4,
    "datasetPatterns": [
      "^(.+\\/pods\\/[0-9]+\\/)"
    ],
    "locationPatterns": [
      "^(.+\\/pods\\/[0-9]+\\/)"
    ]
  }
}
```
#### Shape Index Fragmentation Strategy
Fragmentation strategy that generate a shape index in each sub-datasets.
The sub-datasets are defined by the IRI template at the field `datasetPatterns`.

```json
{
  "fragmentationStrategy": {
    "@type": "FragmentationStrategyDatasetSummaryShapeIndex",
    "shapeConfig": {
      "comments": {
        "shapes": [
          "./shapes/comments.shexc"
        ],
        "directory": "comments",
        "name": "Comment"
      },
      "posts": {
        "shapes": [
          "./shapes/posts.shexc"
        ],
        "directory": "posts",
        "name": "Post"
      },
      "card": {
        "shapes": [
          "./shapes/profile.shexc"
        ],
        "directory": "profile",
        "name": "Profile"
      }
    },
    "resourceTypesOfDatasets": [
      "comments",
      "posts",
      "card"
    ],
    "randomSeed": 1,
    "iriFragmentationOneFile": [
      "http://localhost:3000/internal/FragmentationOneFile"
    ],
    "iriFragmentationMultipleFiles": [
      "http://localhost:3000/internal/FragmentationPerResource",
      "http://localhost:3000/internal/FragmentationLocation",
      "http://localhost:3000/internal/FragmentationCreationDate"
    ],
    "datasetObjectFragmentationPredicate": {
      "comments": "http://localhost:3000/internal/commentsFragmentation",
      "posts": "http://localhost:3000/internal/postsFragmentation"
    },
    "datasetResourceFragmentationException": {
      "card": {
        "name": "card",
        "fragmentation": 0
      },
      "noise": {
        "name": "noise",
        "fragmentation": 0
      }
    },
    "generationProbability": 100,
    "datasetPatterns": [
      "^(.*\\/pods\\/[0-9]+)"
    ]
  }
}
```

Options:

- `"shapeConfig"`: Define the shape of each datasets.
  - `"shapes"`: A list of path to shape templates following the [`ShExC`](https://shex.io/shex-semantics/index.html#shexc) format. If the IRI of the shape is `$` then the IRI will be tied to the current dataset.
  Another shape IRI in the same dataset can be refered by using `{:ShapeName}`. E.g.
`ldbcvoc:id <{:Comment}> ;` where `Comment` is the `name` of a shape define
in the config. When multiple shapes are defined then for each dataset one shape will be chosen randomly with consideration to the `randomSeed`.
  - `"directory"`: The name of a container of the resource.
  - `"name"`: The name of the shape.
- `"resourceTypesOfDatasets"`: The type of resource inside of a dataset. They **should** be related to the `shapeConfig` keys.
- `"randomSeed"`: The initial random seed for the stochastic operations in the generation of the shape index. Each dataset will have its random seed. The seed will be determined by giving the `randomSeed` to the first dataset and incrementing the latest random Seed given to a dataset by one to the next datasets encountered.
- `"iriFragmentationOneFile"`: The IRI from a triple `<subject> <datasetObjectFragmentationPredicateField> <iriFragmentationOneFile>`,
defining a fragmentation in one file of the resource type.
- `"iriFragmentationMultipleFiles"`: The IRI from a triple `<subject> <datasetObjectFragmentationPredicateField> <iriFragmentationMultipleFiles>`,
defining a fragmentation in multiple file of the resource type.
- `"datasetObjectFragmentationPredicate"`: The predicate describing the resource type. The keys **must** be the related to the keys of `shapeConfig`.
- `"datasetResourceFragmentationException"`: Describe the resource type where the fragmentation is not describe in the data model. The keys **must** be the related to the keys of `shapeConfig`.
  - `"name"`: Substring in the IRI (at the subject position) describing the resource
  - `"fragmentation"`: Define the fragmentation of the resource type `0` identify a distributed fragmentation and `1` a fragmentation in one file.
- `"generationProbability"`: The probability a shape index entry is define with regard to the `randomSeed`.
- `"datasetPatterns"`: The IRI template of a dataset

A sample output file tree and its associated files is displayed below.

```
├── comments
│   ├── 2012-08-10.nq
│   └── 2012-08-17.nq
├── comments_shape.nq
├── noise
│   ├── NOISE-12310.nq
│   └── NOISE-9909.nq
├── posts.nq
├── posts_shape.nq
├── profile
│   └── card.nq
├── profile_shape.nq
├── settings
│   └── publicTypeIndex.nq
└── shapeIndex.nq
```

`http://localhost:3000/pods/00000000000000000768/profile_shape`
(sample of the output)
```nquad
<http://localhost:3000/pods/00000000000000000768/profile_shape#Profile> <http://www.w3.org/ns/shex#shapeExpr> _:df_1829_49 .
_:df_1829_50 <http://www.w3.org/1999/02/22-rdf-syntax-ns#first> <http://localhost:3000/pods/00000000000000000768/profile_shape#Profile> .
_:df_1829_50 <http://www.w3.org/1999/02/22-rdf-syntax-ns#rest> <http://www.w3.org/1999/02/22-rdf-syntax-ns#nil> .
_:df_1829_51 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/ns/shex#Schema> .
_:df_1829_51 <http://www.w3.org/ns/shex#shapes> _:df_1829_50 .
_:df_1829_0 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/ns/shex#NodeConstraint> .
_:df_1829_0 <http://www.w3.org/ns/shex#nodeKind> <http://www.w3.org/ns/shex#iri> .
_:df_1829_1 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/ns/shex#TripleConstraint> .
_:df_1829_1 <http://www.w3.org/ns/shex#predicate> <http://www.w3.org/ns/pim/space#storage> .
_:df_1829_1 <http://www.w3.org/ns/shex#valueExpr> _:df_1829

```
Shape template of a post

```
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX ldbcvoc: <http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/>
PREFIX schema: <http://www.w3.org/2000/01/rdf-schema#>

<$> CLOSED {
    a ldbcvoc:Comment?;
    ldbcvoc:id xsd:long ;
    ldbcvoc:creationDate xsd:dateTime ;
    ldbcvoc:locationIP xsd:string  ;
    ldbcvoc:browserUsed xsd:string ;
    ldbcvoc:content xsd:string?;
    ldbcvoc:lenght xsd:int ;
    ldbcvoc:hasTag IRI *;
    (
        ldbcvoc:replyOf @<{:Post}> *;
        |
        ldbcvoc:replyOf @<{:Comment}> *;
    );
    ldbcvoc:isLocatedIn IRI ;
    ldbcvoc:hasCreator @<{:Profile}> ;
}
```

`http://localhost:3000/pods/00000000000000000065/shapeIndex`

```nquad
<http://localhost:3000/pods/00000000000000000065/shapeIndex> <https://shapeIndex.com#ShapeIndex> <http://localhost:3000/pods/00000000000000000065/shapeIndex> .
<http://localhost:3000/pods/00000000000000000065/shapeIndex> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://shapeIndex.com#ShapeIndex> .
<http://localhost:3000/pods/00000000000000000065/shapeIndex> <https://shapeIndex.com#domain> "http://localhost:3000/pods/00000000000000000065/.*" .
<http://localhost:3000/pods/00000000000000000065/shapeIndex> <https://shapeIndex.com#entry> _:Profile .
_:Profile <https://shapeIndex.com#bindByShape> <http://localhost:3000/pods/00000000000000000065/profile_shape#Profile> .
_:Profile <http://www.w3.org/ns/solid/terms#instanceContainer> <http://localhost:3000/pods/00000000000000000065/profile/> .
<http://localhost:3000/pods/00000000000000000065/shapeIndex> <https://shapeIndex.com#entry> _:Post .
_:Post <https://shapeIndex.com#bindByShape> <http://localhost:3000/pods/00000000000000000065/posts_shape#Post> .
_:Post <http://www.w3.org/ns/solid/terms#instanceContainer> <http://localhost:3000/pods/00000000000000000065/posts/> .
<http://localhost:3000/pods/00000000000000000065/shapeIndex> <https://shapeIndex.com#entry> _:Comment .
_:Comment <https://shapeIndex.com#bindByShape> <http://localhost:3000/pods/00000000000000000065/comments_shape#Comment> .
_:Comment <http://www.w3.org/ns/solid/terms#instanceContainer> <http://localhost:3000/pods/00000000000000000065/comments/> .
<http://localhost:3000/pods/00000000000000000065/shapeIndex> <https://shapeIndex.com#isComplete> "true"^^<http://www.w3.org/2001/XMLSchema#boolean> .

```

### Quad Sinks

A quad sink is able to direct a stream of quads as output from the fragmentation process.

#### File Quad Sink

A quad sink that writes to files using an IRI to local file system path mapping.

```json
{
  "quadSink": {
    "@type": "QuadSinkFile",
    "log": true,
    "outputFormat": "application/n-quads",
    "fileExtension": "$.nq",
    "iriToPath": {
      "http://example.org/base/": "output/base/",
      "http://example.org/other/": "output/other/"
    }
  }
}
```

Options:
* `"log"`: If a quad counter should be shown to show the current progress.
* `"outputFormat"`: The desired output serialization. (Only `"application/n-quads"` is considered stable at the moment).
* `"fileExtension"`: An optional extension to add to resulting files.
* `"iriToPath"`: A collection of mappings that indicate what URL patterns should be translated into what folder structure.

#### Annotated File Quad Sink

A quad sink that writes to files using an IRI to local file system path mapping and add an triple annotation to each file.

```json
{
  "quadSink": {
    "@type": "QuadSinkAnnotateFile",
    "annotation": "<$> <https://shapeIndex.com#ShapeIndex> <{}/shapeIndex> .",
    "iriPatterns": ["^(.*\\/pods\\/[0-9]+)"],
    "log": true,
    "outputFormat": "application/n-quads",
    "fileExtension": ".nq",
    "iriToPath": {
      "http://": "out-fragments/http/",
      "https://": "out-fragments/https/"
    }
  }
}
```
Options:
* `"log"`: If a quad counter should be shown to show the current progress.
* `"outputFormat"`: The desired output serialization. (Only `"application/n-quads"` is considered stable at the moment).
* `"fileExtension"`: An optional extension to add to resulting files.
* `"iriToPath"`: A collection of mappings that indicate what URL patterns should be translated into what folder structure.
* `"annotation"`: Triple annotation for each file of the dataset. `$` signifies the IRI of the current file and `{}` signifies the
matching instance of the pattern.
* `"iriPatterns"`: The IRI pattern of the file to annotate.

#### HDT Quad Sink

A quad sink that writes to files using an IRI to local file system path mapping and then converts the files into an [HDT document](https://www.rdfhdt.org/what-is-hdt/).
The implementation uses the [docker](https://www.docker.com/) image [HDT-Docker](https://github.com/rdfhdt/hdt-docker) of the [hdt-cpp](https://github.com/rdfhdt/hdt-cpp) library.
The docker operations to acquire the image and execute the transformations into HDT are performed by the sink.

**WARNING: Can be very slow for many files**

```json
{
  "quadSink": {
    "@type": "QuadSinkHdt",
    "log": true,
    "outputFormat": "application/n-quads",
    "fileExtension": "$.nq",
    "iriToPath": {
      "http://example.org/base/": "output/base/",
      "http://example.org/other/": "output/other/"
    },
    "poolSize": 1,
    "deleteSourceFiles": false,
    "errorFileDockerRfdhdt": "./error_log_docker_rfdhdt.txt"
  }
}
```

Options:
* `"log"`: If a quad counter should be shown to show the current progress.
* `"outputFormat"`: The desired output serialization. (Only `"application/n-quads"` is considered stable at the moment).
* `"fileExtension"`: An optional extension to add to resulting files.
* `"iriToPath"`: A collection of mappings that indicate what URL patterns should be translated into what folder structure.
* `"poolSize"`: The number of concurrent HDT conversion operations. By the default `1`.
* `"deleteSourceFiles"`: If the sink should delete the source RDF file after the conversion into HDT.
* `"errorFileDockerRfdhdt"`: File where the error of HDT-Docker will be outputed. By default `"./error_log_docker_rfdhdt.txt"`.

#### Composite Quad Sink

A quad sink that combines multiple quad sinks.

```json
{
  "quadSink": {
    "@type": "QuadSinkComposite",
    "sinks": [
      {
        "@type": "QuadSinkFile",
        "log": true,
        "outputFormat": "application/n-quads",
        "fileExtension": "$.nq",
        "iriToPath": {
          "http://example.org/base/": "output/base/",
          "http://example.org/other/": "output/other/"
        }
      },
      {
        "@type": "QuadSinkFile",
        "log": true,
        "outputFormat": "application/n-quads",
        "fileExtension": "$.nq2",
        "iriToPath": {
          "http://example.org/base/": "output-2/base/",
          "http://example.org/other/": "output-2/other/"
        }
      }
    ]
  }
}
```

Options:
* `"sinks"`: The quad sinks to delegate to.

#### Filtered Quad Sink

A quad sink that wraps over another quad sink and only passes the quads through that match the given filter.

```json
{
  "quadSink": {
    "@type": "QuadSinkFiltered",
    "filter": {
      "@type": "QuadMatcherResourceType",
      "typeRegex": "vocabulary/Person$",
      "matchFullResource": false
    },
    "sink": [
      {
        "@type": "QuadSinkFile",
        "log": true,
        "outputFormat": "application/n-quads",
        "fileExtension": "$.nq",
        "iriToPath": {
          "http://example.org/base/": "output/base/",
          "http://example.org/other/": "output/other/"
        }
      }
    ]
  }
}
```

Options:
* `"sink"`: The sink to filter on.
* `"filter"`: The filter to apply on quads.

#### CSV Quad Sink

A quad sink that writes quads to a CSV file.

```json
{
  "quadSink": {
    "@type": "QuadSinkCsv",
    "file": "../rdf-dataset-fragmenter-out/output-solid/aux/parameters-comments.csv",
    "columns": [
      "subject"
    ]
  }
}
```

Options:
* `"file"`: The file to write to.
* `"columns"`: The quad term names that will be serialized as columns.

### Quad Transformers

__Optional__

A quad transformer can transform a stream of quads into another stream of quads.

#### Distinct Quad Transformer

A quad transformer that wraps over another quad transformer and removes duplicates.
Only quads that are produced by the quad transformer (and are unequal to the incoming quad) will be filtered away.

```json
{
  "transformers": [
    {
      "@type": "QuadTransformerDistinct",
      "transformer": {
        "@type": "QuadTransformerSetIriExtension",
        "extension": "nq",
        "iriPattern": "^http://dbpedia.org"
      }
    }
  ]
}
```

Options:
* `"transformer"`: The quad transformer to wrap over.

#### Set IRI Extension Quad Transformer

A quad transformer that enforces the configured extension on all named nodes.

```json
{
  "transformers": [
    {
      "@type": "QuadTransformerSetIriExtension",
      "extension": "nq",
      "iriPattern": "^http://dbpedia.org"
    }
  ]
}
```

Options:
* `"extension"`: The extension to set, excluding `.`.
* `"iriPattern"`: An optional regex that to indicate what IRIs this transformer should be applied to. If undefined, all IRIs will be matched.

#### Replace IRI Quad Transformer

A quad transformer that that replaces (parts of) IRIs.

```json
{
  "transformers": [
    {
      "@type": "QuadTransformerReplaceIri",
      "searchRegex": "^http://www.ldbc.eu",
      "replacementString": "http://localhost:3000/www.ldbc.eu"
    }
  ]
}
```

This also supports group-based replacements,
where a group can be identified via `()` in the search regex,
and a reference to the group can be made via `$...`.

```json
{
  "transformers": [
    {
      "@type": "QuadTransformerReplaceIri",
      "searchRegex": "^http://www.ldbc.eu/data/pers([0-9]*)$",
      "replacementString": "http://www.ldbc.eu/pods/$1/profile/card#me"
    }
  ]
}
```

Options:
* `"searchRegex"`: The regex to search for.
* `"replacementString"`: The string to replace.

#### Replace and Distribute IRI Quad Transformer

A quad transformer that that replaces (parts of) IRIs, deterministically distributing the replacements over a list of multiple destination IRI based on a matched number.

```json
{
  "transformers": [
    {
      "@type": "QuadTransformerDistributeIri",
      "searchRegex": "^http://www.ldbc.eu/data/pers([0-9]*)$",
      "replacementStrings": [
        "https://a.example.com/users$1/profile/card#me",
        "https://b.example.com/users$1/profile/card#me",
        "https://c.example.com/users$1/profile/card#me",
        "https://d.example.com/users$1/profile/card#me"
      ]
    }
  ]
}
```

This requires at least one group-based replacement, of which the first group must match a number.

The matched number is used to choose one of the `replacementStrings` in a deterministic way: `replacementStrings[number % replacementStrings.length]`

Options:
* `"searchRegex"`: The regex to search for. A group is identified via `()` in the search regex. There must be at least one group. The first group must match a number.
* `"replacementStrings"`: A list of string to use as replacements. A reference to the matched group can be made via `$...`.

#### Replace BlankNode by NamedNode Transformer

A quad transformer that replaces BlankNodes by NamedNodes if the node-value changes when performing search/ replacement.

```json
{
  "transformers": [
    {
      "@type": "QuadTransformerBlankToNamed",
      "searchRegex": "^b0_tagclass",
      "replacementString": "http://localhost:3000/www.ldbc.eu/tag"
    }
  ]
}
```

This supports group-based replacements just like the [QuadTransformerReplaceIri](#replace-iri-quad-transformer)

Options:
* `"searchRegex"`: The regex to search for.
* `"replacementString"`: The string to replace.

#### Remap Resource Identifier Transformer

A quad transformer that matches all resources of the given type,
and rewrites its (subject) IRI (across all triples) so that it becomes part of the targeted resource.

For example, a transformer matching on type `Post` for identifier predicate `hasId` and target predicate `hasCreator`
will modify all post IRIs to become a hash-based IRI inside the object IRI of `hasCreator`.
Concretely, `<ex:post1> a <Post>. <ex:post1> <hasId> '1'. <ex:post1> <hasCreator> <urn:person1>`
will become
`<urn:person1#Post1> a <Post>. <urn:person1#Post1> <hasId> '1'. <urn:person1#post1> <hasCreator> <urn:person1>`.

**WARNING:** This transformer assumes that all the applicable resources
have `rdf:type` occurring as first triple with the resource IRI as subject.

```json
{
  "transformers": [
    {
      "@type": "QuadTransformerRemapResourceIdentifier",
      "newIdentifierSeparator": "#Post",
      "typeRegex": "vocabulary/Post$",
      "identifierPredicateRegex": "vocabulary/id$",
      "targetPredicateRegex": "vocabulary/hasCreator$"
    }
  ]
}
```

Optionally, the discovered identifier values can be modified using _value modifiers_:

```json
{
  "transformers": [
    {
      "@type": "QuadTransformerRemapResourceIdentifier",
      "newIdentifierSeparator": "#Post",
      "typeRegex": "vocabulary/Post$",
      "identifierPredicateRegex": "vocabulary/id$",
      "targetPredicateRegex": "vocabulary/hasCreator$",
      "identifierValueModifier": {
        "@type": "ValueModifierRegexReplaceGroup",
        "regex": "^.*/([^/]*)$"
      }
    }
  ]
}
```

Options:
* `"newIdentifierSeparator"`: Separator string to use inbetween the target IRI and the identifier value when minting a new resource IRI. This may also be a relative IRI.
* `"typeRegex"`: The RDF type that should be used to capture resources.
* `"identifierPredicateRegex"`: Predicate regex that contains a resource identifier.
* `"targetPredicateRegex"`: Predicate regex that contains an IRI onto which the resource identifier should be remapped.
* `"identifierValueModifier""`: An optional value modifier that will be applied on matched identifier values. _(defaults to `undefined`)_
* `"keepSubjectFragment"`: If the fragment of the original subject should be inherited onto the new identifier IRI. _(defaults to `false`)_

#### Append Quad Transformer

A quad transformer that appends a quad to matching quads (e.g. match by quad predicate).

The example below will effectively add a reverse of quads with the `containerOf` predicate.

```json
{
  "transformers": [
    {
      "@type": "QuadTransformerAppendQuad",
      "matcher": {
        "@type": "QuadMatcherPredicate",
        "predicateRegex": "vocabulary/containerOf$"
      },
      "subject": {
        "@type": "TermTemplateQuadComponent",
        "component": "object"
      },
      "predicate": {
        "@type": "TermTemplateStaticNamedNode",
        "value": "http:/example.org/vocabulary/containedIn"
      },
      "object": {
        "@type": "TermTemplateQuadComponent",
        "component": "subject"
      },
      "graph": {
        "@type": "TermTemplateQuadComponent",
        "component": "graph"
      }
    }
  ]
}
```

Options:
* `"matcher"`: A quad matcher.
* `"subject"`: A term template for the resulting quad's subject.
* `"predicate"`: A term template for the resulting quad's predicate.
* `"object"`: A term template for the resulting quad's object.
* `"graph"`: A term template for the resulting quad's graph.

More details on term templates can be found later in this README.

#### Append Quad Link Transformer

A quad transformer that appends a link to matching quads (e.g. match by quad predicate).

```json
{
  "transformers": [
    {
      "@type": "QuadTransformerAppendQuadLink",
      "matcher": {
        "@type": "QuadMatcherPredicate",
        "predicateRegex": "vocabulary/hasCreator$"
      },
      "predicate": "http://example.org/postsIndex",
      "link": "/posts"
    }
  ]
}
```

Options:
* `"matcher"`: A quad matcher.
* `"identifier"`: The matched quad component that is considered the identifier (`subject`, `predicate`, `object`, or `graph`).
* `"predicate"`: Predicate IRI to define the link.
* `"link"`: The relative link from the resource identifier.
* `"linkType"`: Optional: `rdf:type` IRI that should be assigned to the link IRI as an extra triple.
* `"reverse"`: Optional: If the subject and object of the link triple should be revered.
* `"linkRemoveTrailingSlash"`: Optional: If trailing slashes should be forcefully removed from the link IRI.

#### Append Resource Link Transformer

A quad transformer that matches all resources of the given type, and appends a link.

```json
{
  "transformers": [
    {
      "@type": "QuadTransformerAppendResourceLink",
      "typeRegex": "vocabulary/Person$",
      "predicate": "http://example.org/postsIndex",
      "link": "/posts"
    }
  ]
}
```

Options:
* `"typeRegex"`: The RDF type that should be used to capture resources.
* `"predicate"`: Predicate IRI to define the link.
* `"link"`: The relative link from the resource identifier.
* `"linkType"`: Optional: `rdf:type` IRI that should be assigned to the link IRI as an extra triple.
* `"reverse"`: Optional: If the subject and object of the link triple should be revered.
* `"linkRemoveTrailingSlash"`: Optional: If trailing slashes should be forcefully removed from the link IRI.

#### Append Resource SCL Transformer

A quad transformer that matches all resources of the given type,
and appends an ACL policy using the `scl:appliesTo` and `scl:scope` predicates.

Example output:
```turtle
<http://example.org/person> a <http://example.org/vocabulary/Person>.
<http://example.org/person#policy-posts> scl:appliesTo <http://example.org/person>;
                                         scl:scope "---MY POLICY---".
```

```json
{
  "transformers": [
    {
      "@type": "QuadTransformerAppendResourceScl",
      "typeRegex": "vocabulary/Person$",
      "identifierSuffix": "#policy-posts",
      "sclPolicy": "FOLLOW ?posts { <> <http://www.w3.org/1999/02/22-rdf-syntax-ns#seeAlso> ?posts }"
    }
  ]
}
```

Options:
* `"typeRegex"`: The RDF type that should be used to capture resources.
* `"identifierSuffix"`: String to append to the resource IRI to mint the policy IRI.
* `"sclPolicy"`: The SCL policy to append.

#### Append Resource Solid Type Index

A quad transformer that matches all resources of the given type,
and adds an entry for it to the [Solid type index](https://github.com/solid/solid/blob/main/proposals/data-discovery.md).
This also includes quads required for the creation of this type index, and its link to the user's profile.

If multiple entries of the same type can be matched, it is recommended to wrap this transformer using `QuadTransformerDistinct`,
since duplicate quads can be produced.

Example output:

_Profile:_
```turtle
<http://example.org/profile/card#me> solid:publicTypeIndex <http://example.org/settings/publicTypeIndex> .
```

_Type index:_
```turtle
<http://example.org/settings/publicTypeIndex> a solid:TypeIndex> .
<http://example.org/settings/publicTypeIndex> a solid:ListedDocument> .
<http://example.org/settings/publicTypeIndex#comments> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> solid:TypeRegistration> .
<http://example.org/settings/publicTypeIndex#comments> solid:forClass <http://example.org/vocabulary/Comment> .
<http://example.org/settings/publicTypeIndex#comments> solid:instanceContainer <http://example.org/comments/> .
```

```json
{
  "transformers": [
    {
      "@type": "QuadTransformerAppendResourceSolidTypeIndex",
      "typeRegex": "vocabulary/Comment$",
      "profilePredicateRegex": "vocabulary/hasCreator$",
      "typeIndex": "../settings/publicTypeIndex",
      "entrySuffix": "#comments",
      "entryReference": "../comments/",
      "entryContainer": "true"
    }
  ]
}
```

Options:
* `"typeRegex"`: The RDF type that should be used to capture resources.
* `"profilePredicateRegex"`: Predicate regex on the resource that contains a reference to the relevant Solid profile.
* `"typeIndex"` URL relative to the Solid profile URL for the type index.
* `"entrySuffix"`: String to append to the type index entry.
* `"entryReference"`: URL relative to the Solid profile URL for the type index instances reference.
* `"entryContainer"` If the `entryReference` refers to a Solid container, otherwise it refers to a single index file.

#### Composite Sequential Transformer

Executes a collection of transformers in sequence.

This is mainly useful in cases you want to group transformers together as group within another composite transformer.

```json
{
  "transformers": [
    {
      "@type": "QuadTransformerCompositeSequential",
      "transformers": [
        {
          "@type": "QuadTransformerSetIriExtension",
          "extension": "nq",
          "iriPattern": "^http://dbpedia.org"
        },
        {
          "@type": "QuadTransformerSetIriExtension",
          "extension": "ttl",
          "iriPattern": "^http://something.org"
        }
      ]
    }
  ]
}
```

Options:
* `"transformers""`: A list of transformers to vary on.
* `"typeRegex"`: The RDF type that should be used to capture resources.
* `"targetPredicateRegex"`: Predicate regex that contains an IRI onto which the resource identifier should be remapped.

#### Composite Varying Resource Transformer

A quad transformer that wraps over other quad transformers,
and varies between based based on the configured resource type.

Concretely, it will match all resources of the given type,
and evenly distribute these resources to the different quad transformers.
It will make sure that different triples from a given resources will remain coupled.

**WARNING:** This transformer assumes that all the applicable resources
have `rdf:type` occurring as first triple with the resource IRI as subject.

```json
{
  "transformers": [
    {
      "@type": "QuadTransformerCompositeVaryingResource",
      "typeRegex": "vocabulary/Post$",
      "targetPredicateRegex": "vocabulary/hasCreator$",
      "transformers": [
        {
          "@type": "QuadTransformerRemapResourceIdentifier",
          "newIdentifierSeparator": "../posts/",
          "typeRegex": "vocabulary/Post$",
          "identifierPredicateRegex": "vocabulary/id$",
          "targetPredicateRegex": "vocabulary/hasCreator$"
        },
        {
          "@type": "QuadTransformerRemapResourceIdentifier",
          "newIdentifierSeparator": "../posts#",
          "typeRegex": "vocabulary/Post$",
          "identifierPredicateRegex": "vocabulary/id$",
          "targetPredicateRegex": "vocabulary/hasCreator$"
        }
      ]
    }
  ]
}
```

Options:
* `"transformers""`: A list of transformers to vary on.
* `"typeRegex"`: The RDF type that should be used to capture resources.
* `"targetPredicateRegex"`: Predicate regex that contains an IRI onto which the resource identifier should be remapped.

### Quad Matchers

Different strategies for matching quads.
These matchers can for example be used for `QuadTransformerAppendQuadLink` or `FragmentationStrategyExceptionEntry`.

#### Predicate Matcher

Matches a quad by the given predicate regex.

```json
{
  "fragmentationStrategy": {
    "@type": "FragmentationStrategyException",
    "strategy": {
      "@type": "FragmentationStrategySubject"
    },
    "exceptions": [
      {
        "@type": "FragmentationStrategyExceptionEntry",
        "matcher": {
          "@type": "QuadMatcherPredicate",
          "predicateRegex": "vocabulary/predicate1"
        },
        "strategy": {
          "@type": "FragmentationStrategyObject"
        }
      }
    ]
  }
}
```

#### Resource Type Matcher

A quad matcher that matches all resources of the given type.

Blank nodes are not supported.

**WARNING:** This matcher assumes that all the applicable resources
have `rdf:type` occurring as first triple with the resource IRI as subject.

```json
{
  "fragmentationStrategy": {
    "@type": "FragmentationStrategyException",
    "strategy": {
      "@type": "FragmentationStrategySubject"
    },
    "exceptions": [
      {
        "@type": "FragmentationStrategyExceptionEntry",
        "matcher": {
          "@type": "QuadMatcherResourceType",
          "typeRegex": "vocabulary/Person$"
        },
        "strategy": {
          "@type": "FragmentationStrategyResourceObject",
          "targetPredicateRegex": "vocabulary/hasMaliciousCreator$"
        }
      }
    ]
  }
}
```

Options:
* `"type""`: Regular expression for type IRIs that need to be matched.
* `"matchFullResource""`: If not only the quad containing the type must be matched, but also all other quads sharing the same subject of that quad.

### Value modifiers

Different strategies for modifying RDF term values.
These modifiers could for example be used in `QuadTransformerRemapResourceIdentifier`.

#### Regex Replace Group Value Modifier

A value modifier that applies the given regex on the value and replaces it with the first group match.

```json
{
  "@type": "ValueModifierRegexReplaceGroup",
  "regex": "^.*/([^/]*)$"
}
```

### Term templates

Different templates for deriving a quad component from an incoming quad.
Theses templates could for example be used in `QuadTransformerAppendQuad`.

#### Quad Component

A term template that returns a given quad's component.

The example below refers to the object of a quad.

```json
{
  "@type": "TermTemplateQuadComponent",
  "component": "object"
}
```

Options:
* `"component"`: The quad component: `subject`, `predicate`, `object`, or `graph`.

#### Static Named Node.

A term template that always returns a Named Node with the given value.

```json
{
  "@type": "TermTemplateStaticNamedNode",
  "value": "http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/containedIn"
}
```

Options:
* `"value"`: The IRI value of the Named Node.

## Extend

This tool has been created with extensibility in mind.
After forking+cloning this repo and running `npm install` or `yarn install`,
you can create new components inside the `lib/` directory.

The following TypeScript interfaces are available for implementing new components:
* `IQuadSource`: A quad source is able to provide a stream of quads.
* `IFragmentationStrategy`: A fragmentation strategy that fragments quads into different documents.
* `IQuadSink`: A quad sink is able to consume quads to document IRI targets.

If you want to use your newly created component, make sure to execute `npm run build` or `yarn run build`.
After that, you can include your components in your config file by referring to them from `@type` with their class name.

## License
This software is written by [Ruben Taelman](http://rubensworks.net/).

This code is released under the [MIT license](http://opensource.org/licenses/MIT).
