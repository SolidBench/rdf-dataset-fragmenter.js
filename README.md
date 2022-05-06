# RDF Dataset Fragmenter

[![Build status](https://github.com/rubensworks/rdf-dataset-fragmenter.js/workflows/CI/badge.svg)](https://github.com/rubensworks/rdf-dataset-fragmenter.js/actions?query=workflow%3ACI)
[![Coverage Status](https://coveralls.io/repos/github/rubensworks/rdf-dataset-fragmenter.js/badge.svg?branch=master)](https://coveralls.io/github/rubensworks/rdf-dataset-fragmenter.js?branch=master)
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
* `"quadSource"`: Optional transformations over the quad stream.

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

### Quad Transformers

__Optional__

A quad transformer can transform a stream of quads into another stream of quads.

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
* `"identifierValueModifier""`: An optional value modifier that will be applied on matched identifier values.

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
These matchers are mainly used for a `FragmentationStrategyExceptionEntry`.

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
