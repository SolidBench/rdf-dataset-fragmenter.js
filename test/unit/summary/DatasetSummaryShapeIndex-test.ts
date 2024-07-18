import prand from 'pure-rand';
import { DataFactory } from 'rdf-data-factory';
import type { IDatasetSummaryOutput } from '../../../lib/summary/DatasetSummary';
import type {
  IShapeEntry,
  IShapeIndexEntry,
  IUndescribedDataModel,
} from '../../../lib/summary/DatasetSummaryShapeIndex';
import { DatasetSummaryShapeIndex, ResourceFragmentation } from '../../../lib/summary/DatasetSummaryShapeIndex';
import 'jest-rdf';

const DF = new DataFactory();

describe('DatasetSummaryShapeIndex', () => {
  const dataset = DF.namedNode('http://example.be#007');
  const iriFragmentationMultipleFiles = new Set([
    'http://localhost:3000/internal/FragmentationPerResource',
    'http://localhost:3000/internal/FragmentationLocation',
    'http://localhost:3000/internal/FragmentationCreationDate',
  ]);
  const iriFragmentationOneFile = new Set([
    'http://localhost:3000/internal/FragmentationOneFile',
  ]);
  const datasetObjectFragmentationPredicate = {
    comments: 'http://localhost:3000/internal/commentsFragmentation',
    posts: 'http://localhost:3000/internal/postsFragmentation',
  };
  const shapeMap: Record<string, IShapeEntry> = {
    comments: {
      shapes: [ 'commentsA', 'commentsB', 'commentsC' ],
      directory: 'comments',
      name: 'Comment',
    },
    posts: {
      shapes: [ 'postA', 'postB', 'postC' ],
      directory: 'posts',
      name: 'Post',
    },
    card: {
      shapes: [ 'profile' ],
      directory: 'profile',
      name: 'Profile',
    },
    noise: {
      shapes: [ 'noise' ],
      directory: 'noise',
      name: 'noise',
    },
  };
  const contentTypesOfDatasets = new Set([ 'comments', 'posts', 'card', 'noise' ]);
  const randomSeed: any = jest.fn();
  const datasetObjectExeption: Record<string, IUndescribedDataModel> = {
    card: { name: 'card', fragmentation: ResourceFragmentation.DISTRIBUTED },
    noise: { name: 'noise', fragmentation: ResourceFragmentation.DISTRIBUTED },
  };

  describe('register', () => {
    let collector: any;
    beforeEach(() => {
      jest.resetAllMocks();
      collector = new DatasetSummaryShapeIndex({
        dataset: dataset.value,
        iriFragmentationOneFile,
        iriFragmentationMultipleFiles,
        datasetObjectFragmentationPredicate,
        shapeMap,
        contentTypesOfDatasets,
        randomSeed,
        datasetObjectExeption,
      });
    });

    it('should register a triple with a single fragmentation', () => {
      const spy = jest.spyOn(prand, 'uniformIntDistribution')
        .mockImplementationOnce(() => {
          return <any>[ 0, this ];
        });
      const aTriple = DF.quad(
        DF.namedNode('http://example.be#007'),
        DF.namedNode('http://localhost:3000/internal/commentsFragmentation'),
        DF.namedNode('http://localhost:3000/internal/FragmentationOneFile'),
      );
      collector.register(aTriple);
      const expectedHandleContent: Map<string, IShapeIndexEntry> = new Map([
        [ 'comments', {
          ressourceFragmentation: ResourceFragmentation.SINGLE,
          shape: 'commentsA',
          shapeInfo: {
            name: 'Comment',
            directory: 'comments',
          },
          iri: `${dataset.value}/comments`,
        }],
      ]);

      expect(spy).toHaveBeenCalledTimes(1);
      expect((collector).registeredEntries).toStrictEqual(expectedHandleContent);
    });

    it('should register a triple with a distributed fragmentation', () => {
      const spy = jest.spyOn(prand, 'uniformIntDistribution')
        .mockImplementationOnce(() => {
          return <any>[ 1, this ];
        });

      const aTriple = DF.quad(
        DF.namedNode('http://example.be#007'),
        DF.namedNode('http://localhost:3000/internal/postsFragmentation'),
        DF.namedNode('http://localhost:3000/internal/FragmentationCreationDate'),
      );
      collector.register(aTriple);
      const expectedHandleContent: Map<string, IShapeIndexEntry> = new Map([
        [ 'posts', {
          ressourceFragmentation: ResourceFragmentation.DISTRIBUTED,
          shape: 'postB',
          shapeInfo: {
            name: 'Post',
            directory: 'posts',
          },
          iri: `${dataset.value}/posts/`,
        }],
      ]);

      expect(spy).toHaveBeenCalledTimes(1);
      expect((collector).registeredEntries).toStrictEqual(expectedHandleContent);
    });

    it('should not register a triple with a subject not related to the dataset', () => {
      const spy = jest.spyOn(prand, 'uniformIntDistribution')
        .mockImplementationOnce(() => {
          return <any>[ 1, this ];
        });

      const aTriple = DF.quad(
        DF.namedNode('http://example.be#008'),
        DF.namedNode('http://localhost:3000/internal/postsFragmentation'),
        DF.namedNode('http://localhost:3000/internal/FragmentationCreationDate'),
      );
      collector.register(aTriple);

      expect(spy).toHaveBeenCalledTimes(0);
      expect((collector).registeredEntries).toStrictEqual(new Map());
    });

    it('should not register a triple not related to the data model', () => {
      const spy = jest.spyOn(prand, 'uniformIntDistribution')
        .mockImplementationOnce(() => {
          return <any>[ 1, this ];
        });

      const aTriple = DF.quad(
        DF.namedNode('http://example.be#007'),
        DF.namedNode('http://localhost:3000/internal/whatIsIt'),
        DF.namedNode('http://localhost:3000/internal/FragmentationCreationDate'),
      );
      collector.register(aTriple);

      expect(spy).toHaveBeenCalledTimes(0);
      expect((collector).registeredEntries).toStrictEqual(new Map());
    });

    it('should register a triple from an undescribe triple', () => {
      const spy = jest.spyOn(prand, 'uniformIntDistribution')
        .mockImplementationOnce(() => {
          return <any>[ 0, this ];
        });

      const aTriple = DF.quad(
        DF.namedNode('http://example.be#007/card#asad'),
        DF.namedNode('http://localhost:3000/internal/asda'),
        DF.namedNode('http://localhost:3000/foo'),
      );
      collector.register(aTriple);
      const expectedHandleContent: Map<string, IShapeIndexEntry> = new Map([
        [ 'card', {
          ressourceFragmentation: ResourceFragmentation.DISTRIBUTED,
          shape: 'profile',
          shapeInfo: {
            name: 'Profile',
            directory: 'profile',
          },
          iri: `${dataset.value}/profile/`,
        }],
      ]);

      expect(spy).toHaveBeenCalledTimes(1);
      expect((collector).registeredEntries).toStrictEqual(expectedHandleContent);
    });

    it('should not register a triple from an undescribe triple multiple time', () => {
      const spy = jest.spyOn(prand, 'uniformIntDistribution')
        .mockImplementationOnce(() => {
          return <any>[ 0, this ];
        });

      const aTriple = DF.quad(
        DF.namedNode('http://example.be#007/card#asad'),
        DF.namedNode('http://localhost:3000/internal/asda'),
        DF.namedNode('http://localhost:3000/foo'),
      );
      collector.register(aTriple);
      const expectedHandleContent: Map<string, IShapeIndexEntry> = new Map([
        [ 'card', {
          ressourceFragmentation: ResourceFragmentation.DISTRIBUTED,
          shape: 'profile',
          shapeInfo: {
            name: 'Profile',
            directory: 'profile',
          },
          iri: `${dataset.value}/profile/`,
        }],
      ]);

      expect(spy).toHaveBeenCalledTimes(1);
      expect((collector).registeredEntries).toStrictEqual(expectedHandleContent);

      const aSecondTriple = DF.quad(
        DF.namedNode('http://example.be#007/card#asad'),
        DF.namedNode('http://localhost:3000/internal/asw2da'),
        DF.namedNode('http://localhost:3000/foo'),
      );
      collector.register(aSecondTriple);

      expect(spy).toHaveBeenCalledTimes(1);
      expect((collector).registeredEntries).toStrictEqual(expectedHandleContent);
    });

    it('should register multiple triples', () => {
      const spy = jest.spyOn(prand, 'uniformIntDistribution')
        .mockImplementationOnce(() => {
          return <any>[ 0, this ];
        })
        .mockImplementationOnce(() => {
          return <any>[ 1, this ];
        });

      const aTriple = DF.quad(
        DF.namedNode('http://example.be#007'),
        DF.namedNode('http://localhost:3000/internal/commentsFragmentation'),
        DF.namedNode('http://localhost:3000/internal/FragmentationOneFile'),
      );
      collector.register(aTriple);
      const expectedHandleContent: Map<string, IShapeIndexEntry> = new Map([
        [ 'comments', {
          ressourceFragmentation: ResourceFragmentation.SINGLE,
          shape: 'commentsA',
          shapeInfo: {
            name: 'Comment',
            directory: 'comments',
          },
          iri: `${dataset.value}/comments`,
        }],
      ]);

      expect(spy).toHaveBeenCalledTimes(1);
      expect((collector).registeredEntries).toStrictEqual(expectedHandleContent);

      const aSecondTriple = DF.quad(
        DF.namedNode('http://example.be#007'),
        DF.namedNode('http://localhost:3000/internal/postsFragmentation'),
        DF.namedNode('http://localhost:3000/internal/FragmentationCreationDate'),
      );
      collector.register(aSecondTriple);
      const expectedHandleContentSecond: Map<string, IShapeIndexEntry> = new Map([
        [ 'posts', {
          ressourceFragmentation: ResourceFragmentation.DISTRIBUTED,
          shape: 'postB',
          shapeInfo: {
            name: 'Post',
            directory: 'posts',
          },
          iri: `${dataset.value}/posts/`,
        }],
        [ 'comments', {
          ressourceFragmentation: ResourceFragmentation.SINGLE,
          shape: 'commentsA',
          shapeInfo: {
            name: 'Comment',
            directory: 'comments',
          },
          iri: `${dataset.value}/comments`,
        }],
      ]);

      expect(spy).toHaveBeenCalledTimes(2);
      expect((collector).registeredEntries).toStrictEqual(expectedHandleContentSecond);
    });
  });

  describe('generateShapeIri', () => {
    let collector: any;

    beforeEach(() => {
      jest.resetAllMocks();
      collector = new DatasetSummaryShapeIndex({
        dataset: dataset.value,
        iriFragmentationOneFile,
        iriFragmentationMultipleFiles,
        datasetObjectFragmentationPredicate,
        shapeMap,
        contentTypesOfDatasets,
        randomSeed,
        datasetObjectExeption,
      });
    });

    it('should generate a shape Iri', () => {
      const entry = {
        directory: 'posts',
        name: 'Post',
      };
      expect(collector.generateShapeIri(entry)).toBe('http://example.be#007/posts_shape#Post');
    });
  });

  describe('transformShapeTemplateIntoShape', () => {
    let collector: any;

    beforeEach(() => {
      jest.resetAllMocks();
      collector = new DatasetSummaryShapeIndex({
        dataset: dataset.value,
        iriFragmentationOneFile,
        iriFragmentationMultipleFiles,
        datasetObjectFragmentationPredicate,
        shapeMap,
        contentTypesOfDatasets,
        randomSeed,
        datasetObjectExeption,
      });
    });

    it('should transform a shape template into a shape', () => {
      const template = `
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
}`;
      const entry = {
        directory: 'comments',
        name: 'Comment',
      };
      const shapeIri = collector.generateShapeIri(entry);

      const expectedShape = `
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX ldbcvoc: <http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/>
PREFIX schema: <http://www.w3.org/2000/01/rdf-schema#>

<http://example.be#007/comments_shape#Comment> CLOSED {
    a ldbcvoc:Comment?;
    ldbcvoc:id xsd:long ;
    ldbcvoc:creationDate xsd:dateTime ;
    ldbcvoc:locationIP xsd:string  ;
    ldbcvoc:browserUsed xsd:string ;
    ldbcvoc:content xsd:string?;
    ldbcvoc:lenght xsd:int ;
    ldbcvoc:hasTag IRI *;
    (
        ldbcvoc:replyOf @<http://example.be#007/posts_shape#Post> *;
        |
        ldbcvoc:replyOf @<http://example.be#007/comments_shape#Comment> *;
    );
    ldbcvoc:isLocatedIn IRI ;
    ldbcvoc:hasCreator @<http://example.be#007/profile_shape#Profile> ;
}`;

      expect(collector.transformShapeTemplateIntoShape(template, shapeIri)).toBe(expectedShape);
    });

    it('should transform a shape template into a shape given the template has no keys', () => {
      const template = `
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
        ldbcvoc:replyOf @<http://example.be#007/posts_shape#Post> *;
        |
        ldbcvoc:replyOf @<http://example.be#007/comments_shape#Comment> *;
    );
    ldbcvoc:isLocatedIn IRI ;
    ldbcvoc:hasCreator @<http://example.be#007/profile_shape#Profile> ;
}`;
      const entry = {
        directory: 'comments',
        name: 'Comment',
      };
      const shapeIri = collector.generateShapeIri(entry);

      const expectedShape = `
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX ldbcvoc: <http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/>
PREFIX schema: <http://www.w3.org/2000/01/rdf-schema#>

<http://example.be#007/comments_shape#Comment> CLOSED {
    a ldbcvoc:Comment?;
    ldbcvoc:id xsd:long ;
    ldbcvoc:creationDate xsd:dateTime ;
    ldbcvoc:locationIP xsd:string  ;
    ldbcvoc:browserUsed xsd:string ;
    ldbcvoc:content xsd:string?;
    ldbcvoc:lenght xsd:int ;
    ldbcvoc:hasTag IRI *;
    (
        ldbcvoc:replyOf @<http://example.be#007/posts_shape#Post> *;
        |
        ldbcvoc:replyOf @<http://example.be#007/comments_shape#Comment> *;
    );
    ldbcvoc:isLocatedIn IRI ;
    ldbcvoc:hasCreator @<http://example.be#007/profile_shape#Profile> ;
}`;

      expect(collector.transformShapeTemplateIntoShape(template, shapeIri)).toBe(expectedShape);
    });
  });

  describe('serializeShape', () => {
    let collector: any;

    beforeEach(() => {
      jest.resetAllMocks();
      collector = new DatasetSummaryShapeIndex({
        dataset: dataset.value,
        iriFragmentationOneFile,
        iriFragmentationMultipleFiles,
        datasetObjectFragmentationPredicate,
        shapeMap,
        contentTypesOfDatasets,
        randomSeed,
        datasetObjectExeption,
      });
    });

    it('should produce a data summary output of a shape', async() => {
      const template = `
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
}`;

      const entry = {
        directory: 'posts',
        name: 'Post',
      };
      const output: IDatasetSummaryOutput = await collector.serializeShape(template, collector.generateShapeIri(entry));
      expect(output.iri).toBe(collector.generateShapeIri(entry));
      expect(output.quads.length).toBeGreaterThan(0);
    });
  });

  describe('serializeCompletenessOfShapeIndex', () => {
    let collector: any;

    beforeEach(() => {
      jest.resetAllMocks();
      collector = new DatasetSummaryShapeIndex({
        dataset: dataset.value,
        iriFragmentationOneFile,
        iriFragmentationMultipleFiles,
        datasetObjectFragmentationPredicate,
        shapeMap,
        contentTypesOfDatasets,
        randomSeed,
        datasetObjectExeption,
      });
    });

    it('should indicate that the shape index is not complete given an empty index', () => {
      const output = collector.serializeCompletenessOfShapeIndex();
      const expectedOutput: IDatasetSummaryOutput = {
        iri: collector.shapeIndexIri,
        quads: [],
      };

      expect(output).toStrictEqual(expectedOutput);
    });

    it('should indicate that the shape index is not complete given a shape index with some entries', () => {
      jest.spyOn(prand, 'uniformIntDistribution')
        .mockImplementationOnce(() => {
          return <any>[ 1, this ];
        });

      const aTriple = DF.quad(
        DF.namedNode('http://example.be#007'),
        DF.namedNode('http://localhost:3000/internal/commentsFragmentation'),
        DF.namedNode('http://localhost:3000/internal/FragmentationOneFile'),
      );

      collector.register(aTriple);

      const output = collector.serializeCompletenessOfShapeIndex();
      const expectedOutput: IDatasetSummaryOutput = {
        iri: collector.shapeIndexIri,
        quads: [],
      };

      expect(output).toStrictEqual(expectedOutput);
    });

    it('should indicate that the shape index is complete', () => {
      jest.spyOn(prand, 'uniformIntDistribution')
        .mockImplementation(() => {
          return <any>[ 0, this ];
        });

      const aCommentTriple = DF.quad(
        DF.namedNode('http://example.be#007'),
        DF.namedNode('http://localhost:3000/internal/commentsFragmentation'),
        DF.namedNode('http://localhost:3000/internal/FragmentationOneFile'),
      );

      const aPostTriple = DF.quad(
        DF.namedNode('http://example.be#007'),
        DF.namedNode('http://localhost:3000/internal/postsFragmentation'),
        DF.namedNode('http://localhost:3000/internal/FragmentationCreationDate'),
      );

      const aProfileTriple = DF.quad(
        DF.namedNode('http://example.be#007/card#asad'),
        DF.namedNode('http://localhost:3000/internal/asda'),
        DF.namedNode('http://localhost:3000/foo'),
      );

      const aNoiseTriple = DF.quad(
        DF.namedNode('http://example.be#007/noise#asad'),
        DF.namedNode('http://localhost:3000/internal/asda'),
        DF.namedNode('http://localhost:3000/foo'),
      );

      collector.register(aCommentTriple);
      collector.register(aPostTriple);
      collector.register(aProfileTriple);
      collector.register(aNoiseTriple);

      const output = collector.serializeCompletenessOfShapeIndex();
      const expectedOutput: IDatasetSummaryOutput = {
        iri: collector.shapeIndexIri,
        quads: [ DF.quad(
          DF.namedNode(collector.shapeIndexIri),
          DatasetSummaryShapeIndex.SHAPE_INDEX_IS_COMPLETE_NODE,
          DatasetSummaryShapeIndex.RDF_TRUE,
        ) ],
      };

      expect(output).toStrictEqual(expectedOutput);
    });

    it('should indicate that the shape index is incomplete if a different model object is provided', () => {
      collector = new DatasetSummaryShapeIndex({
        dataset: dataset.value,
        iriFragmentationOneFile,
        iriFragmentationMultipleFiles,
        datasetObjectFragmentationPredicate,
        shapeMap,
        contentTypesOfDatasets: new Set([ 'comments', 'posts', 'card', 'foo' ]),
        randomSeed,
        datasetObjectExeption,
      });

      jest.spyOn(prand, 'uniformIntDistribution')
        .mockImplementation(() => {
          return <any>[ 0, this ];
        });

      const aCommentTriple = DF.quad(
        DF.namedNode('http://example.be#007'),
        DF.namedNode('http://localhost:3000/internal/commentsFragmentation'),
        DF.namedNode('http://localhost:3000/internal/FragmentationOneFile'),
      );

      const aPostTriple = DF.quad(
        DF.namedNode('http://example.be#007'),
        DF.namedNode('http://localhost:3000/internal/postsFragmentation'),
        DF.namedNode('http://localhost:3000/internal/FragmentationCreationDate'),
      );

      const aProfileTriple = DF.quad(
        DF.namedNode('http://example.be#007/card#asad'),
        DF.namedNode('http://localhost:3000/internal/asda'),
        DF.namedNode('http://localhost:3000/foo'),
      );

      const aNoiseTriple = DF.quad(
        DF.namedNode('http://example.be#007/noise#asad'),
        DF.namedNode('http://localhost:3000/internal/asda'),
        DF.namedNode('http://localhost:3000/foo'),
      );

      collector.register(aCommentTriple);
      collector.register(aPostTriple);
      collector.register(aProfileTriple);
      collector.register(aNoiseTriple);

      const output = collector.serializeCompletenessOfShapeIndex();
      const expectedOutput: IDatasetSummaryOutput = {
        iri: collector.shapeIndexIri,
        quads: [],
      };

      expect(output).toStrictEqual(expectedOutput);
    });

    it('should indicate that the shape index not complete given an empty index content list', () => {
      collector = new DatasetSummaryShapeIndex({
        dataset: dataset.value,
        iriFragmentationOneFile,
        iriFragmentationMultipleFiles,
        datasetObjectFragmentationPredicate,
        shapeMap,
        contentTypesOfDatasets: new Set(),
        randomSeed,
        datasetObjectExeption,
      });

      const output = collector.serializeCompletenessOfShapeIndex();
      const expectedOutput: IDatasetSummaryOutput = {
        iri: collector.shapeIndexIri,
        quads: [ DF.quad(
          DF.namedNode(collector.shapeIndexIri),
          DatasetSummaryShapeIndex.SHAPE_INDEX_IS_COMPLETE_NODE,
          DatasetSummaryShapeIndex.RDF_TRUE,
        ) ],
      };

      expect(output).toStrictEqual(expectedOutput);
    });
  });

  describe('serializeShapeIndexInstance', () => {
    let collector: any;

    beforeEach(() => {
      jest.resetAllMocks();
      collector = new DatasetSummaryShapeIndex({
        dataset: dataset.value,
        iriFragmentationOneFile,
        iriFragmentationMultipleFiles,
        datasetObjectFragmentationPredicate,
        shapeMap,
        contentTypesOfDatasets,
        randomSeed,
        datasetObjectExeption,
      });
    });

    it('should serialize the shape index instance', () => {
      const shapeIndexNode = DF.namedNode(collector.shapeIndexIri);
      const typeDefinition = DF.quad(
        shapeIndexNode,
        DatasetSummaryShapeIndex.RDF_TYPE_NODE,
        DatasetSummaryShapeIndex.SHAPE_INDEX_CLASS_NODE,
      );

      const domain = DF.quad(
        shapeIndexNode,
        DatasetSummaryShapeIndex.SHAPE_INDEX_DOMAIN_NODE,
        DF.literal(`${dataset.value}/.*`, DatasetSummaryShapeIndex.RDF_STRING_TYPE),
      );

      const expectedOutput = {
        iri: collector.shapeIndexIri,
        quads: [ typeDefinition, domain ],
      };

      expect(collector.serializeShapeIndexInstance()).toStrictEqual(expectedOutput);
    });
  });

  describe('serializeShapeIndexEntries', () => {
    let collector: any;

    beforeEach(() => {
      const commentShape = `
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
}`;

      const postShape = `
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX ldbcvoc: <http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/>
PREFIX schema: <http://www.w3.org/2000/01/rdf-schema#>

<$> CLOSED {
    a ldbcvoc:Post?;
    ldbcvoc:id xsd:long;
    ldbcvoc:imageFile xsd:string * ;
    ldbcvoc:language xsd:string *;
    ldbcvoc:locationIP xsd:string;
    ldbcvoc:browserUsed xsd:string;
    ldbcvoc:creationDate xsd:dateTime;
    ldbcvoc:hasCreator @<{:Profile}>;
    ldbcvoc:hasTag IRI *;
    ldbcvoc:content xsd:string?;
    schema:seeAlso IRI *;
    ldbcvoc:isLocatedIn IRI ?;
}`;

      const profileShape = `
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX ldbcvoc: <http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/>
PREFIX schema: <http://www.w3.org/2000/01/rdf-schema#>

<$> CLOSED {
    a ldbcvoc:Person ?;
    <http://www.w3.org/ns/pim/space#storage> IRI ? ;
    ldbcvoc:id xsd:long;
    ldbcvoc:firstName xsd:string;
    ldbcvoc:lastName xsd:string;
    ldbcvoc:gender ["male" "female" "other"];
    ldbcvoc:birthday xsd:date;
    ldbcvoc:locationIP xsd:string;
    ldbcvoc:browserUsed xsd:string;
    ldbcvoc:creationDate xsd:date;
    ldbcvoc:isLocatedIn IRI;
    ldbcvoc:speaks xsd:string + ;
    ldbcvoc:email xsd:string *;
    ldbcvoc:hasInterest IRI *;
    ldbcvoc:studyAt IRI *;
    ldbcvoc:likes IRI *;
}
`;
      const shapeMapWithRealShape: Record<string, IShapeEntry> = {
        comments: {
          shapes: [ commentShape ],
          directory: 'comments',
          name: 'Comment',
        },
        posts: {
          shapes: [ postShape ],
          directory: 'posts',
          name: 'Post',
        },
        card: {
          shapes: [ profileShape ],
          directory: 'profile',
          name: 'Profile',
        },
      };
      jest.resetAllMocks();
      collector = new DatasetSummaryShapeIndex({
        dataset: dataset.value,
        iriFragmentationOneFile,
        iriFragmentationMultipleFiles,
        datasetObjectFragmentationPredicate,
        shapeMap: shapeMapWithRealShape,
        contentTypesOfDatasets,
        randomSeed,
        datasetObjectExeption,
      });
    });

    it('should generate no entry given no triple registered', async() => {
      const output = await collector.serializeShapeIndexEntries();

      expect(output).toStrictEqual([{ iri: collector.shapeIndexIri, quads: []}, []]);
    });

    it('should generate an entry', async() => {
      jest.spyOn(prand, 'uniformIntDistribution')
        .mockImplementationOnce(() => {
          return <any>[ 0, this ];
        }).mockImplementationOnce(() => {
          return <any>[ 0, this ];
        });

      const aTriple = DF.quad(
        DF.namedNode('http://example.be#007'),
        DF.namedNode('http://localhost:3000/internal/commentsFragmentation'),
        DF.namedNode('http://localhost:3000/internal/FragmentationOneFile'),
      );

      collector.register(aTriple);

      const [ entry, shapes ] = await collector.serializeShapeIndexEntries();

      expect(shapes).toHaveLength(1);

      expect(shapes[0].iri).toBe(collector.generateShapeIri({
        directory: 'comments',
        name: 'Comment',
      }));

      expect(shapes[0].quads.length).toBeGreaterThan(1);

      expect(entry.iri).toBe(collector.shapeIndexIri);
      const currentEntry = DF.blankNode();
      const entryTypeDefinition = DF.quad(
        DF.namedNode(collector.shapeIndexIri),
        DatasetSummaryShapeIndex.SHAPE_INDEX_ENTRY_NODE,
        currentEntry,
      );
      const bindByShape = DF.quad(
        currentEntry,
        DatasetSummaryShapeIndex.SHAPE_INDEX_BIND_BY_SHAPE_NODE,
        DF.namedNode(collector.generateShapeIri({
          directory: 'comments',
          name: 'Comment',
        })),
      );

      const target = DF.quad(
        currentEntry,
        DatasetSummaryShapeIndex.SOLID_INSTANCE_NODE,
        DF.namedNode(`${collector.dataset}/comments`),
      );

      expect(entry.quads).toBeRdfIsomorphic(
        [
          entryTypeDefinition,
          bindByShape,
          target,
        ],
      );
    });

    it('should generate not generate an entry based on a generation probability', async() => {
      collector = new DatasetSummaryShapeIndex({
        dataset: dataset.value,
        iriFragmentationOneFile,
        iriFragmentationMultipleFiles,
        datasetObjectFragmentationPredicate,
        shapeMap: collector.shapeMap,
        contentTypesOfDatasets,
        randomSeed,
        datasetObjectExeption,
        generationProbability: 20,
      });
      jest.spyOn(prand, 'uniformIntDistribution')
        .mockImplementationOnce(() => {
          return <any>[ 0, this ];
        }).mockImplementationOnce(() => {
          return <any>[ 33, this ];
        });

      const aTriple = DF.quad(
        DF.namedNode('http://example.be#007'),
        DF.namedNode('http://localhost:3000/internal/commentsFragmentation'),
        DF.namedNode('http://localhost:3000/internal/FragmentationOneFile'),
      );

      collector.register(aTriple);

      const [ entry, shapes ] = await collector.serializeShapeIndexEntries();
      expect(entry.quads).toHaveLength(0);
      expect(shapes).toHaveLength(0);
    });

    it('should generate multiple entries', async() => {
      jest.spyOn(prand, 'uniformIntDistribution')
        .mockImplementation(() => {
          return <any>[ 0, this ];
        });

      const aCommentTriple = DF.quad(
        DF.namedNode('http://example.be#007'),
        DF.namedNode('http://localhost:3000/internal/commentsFragmentation'),
        DF.namedNode('http://localhost:3000/internal/FragmentationOneFile'),
      );

      const aPostTriple = DF.quad(
        DF.namedNode('http://example.be#007'),
        DF.namedNode('http://localhost:3000/internal/postsFragmentation'),
        DF.namedNode('http://localhost:3000/internal/FragmentationCreationDate'),
      );

      collector.register(aCommentTriple);
      collector.register(aPostTriple);

      const [ entry, shapes ] = await collector.serializeShapeIndexEntries();

      expect(shapes).toHaveLength(2);

      expect(shapes[0].iri).toBe(collector.generateShapeIri({
        directory: 'comments',
        name: 'Comment',
      }));

      expect(shapes[1].quads.length).toBeGreaterThan(1);

      expect(shapes[1].iri).toBe(collector.generateShapeIri({
        directory: 'posts',
        name: 'Post',
      }));

      expect(shapes[1].quads.length).toBeGreaterThan(1);

      const commentEntry = DF.blankNode();
      const entryTypeDefinitionComment = DF.quad(
        DF.namedNode(collector.shapeIndexIri),
        DatasetSummaryShapeIndex.SHAPE_INDEX_ENTRY_NODE,
        commentEntry,
      );
      const bindByShapeComment = DF.quad(
        commentEntry,
        DatasetSummaryShapeIndex.SHAPE_INDEX_BIND_BY_SHAPE_NODE,
        DF.namedNode(collector.generateShapeIri({
          directory: 'comments',
          name: 'Comment',
        })),
      );

      const targetComment = DF.quad(
        commentEntry,
        DatasetSummaryShapeIndex.SOLID_INSTANCE_NODE,
        DF.namedNode(`${collector.dataset}/comments`),
      );

      const postEntry = DF.blankNode();
      const entryTypeDefinitionPost = DF.quad(
        DF.namedNode(collector.shapeIndexIri),
        DatasetSummaryShapeIndex.SHAPE_INDEX_ENTRY_NODE,
        postEntry,
      );
      const bindByShapePost = DF.quad(
        postEntry,
        DatasetSummaryShapeIndex.SHAPE_INDEX_BIND_BY_SHAPE_NODE,
        DF.namedNode(collector.generateShapeIri({
          directory: 'posts',
          name: 'Post',
        })),
      );

      const targetPost = DF.quad(
        postEntry,
        DatasetSummaryShapeIndex.SOLID_INSTANCE_CONTAINER_NODE,
        DF.namedNode(`${collector.dataset}/posts/`),
      );

      expect(entry.quads).toBeRdfIsomorphic(
        [
          entryTypeDefinitionComment,
          bindByShapeComment,
          targetComment,

          entryTypeDefinitionPost,
          bindByShapePost,
          targetPost,
        ],
      );
    });
  });

  describe('serialize', () => {
    let collector: any;

    beforeEach(() => {
      const commentShape = `
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
}`;

      const postShape = `
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX ldbcvoc: <http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/>
PREFIX schema: <http://www.w3.org/2000/01/rdf-schema#>

<$> CLOSED {
    a ldbcvoc:Post?;
    ldbcvoc:id xsd:long;
    ldbcvoc:imageFile xsd:string * ;
    ldbcvoc:language xsd:string *;
    ldbcvoc:locationIP xsd:string;
    ldbcvoc:browserUsed xsd:string;
    ldbcvoc:creationDate xsd:dateTime;
    ldbcvoc:hasCreator @<{:Profile}>;
    ldbcvoc:hasTag IRI *;
    ldbcvoc:content xsd:string?;
    schema:seeAlso IRI *;
    ldbcvoc:isLocatedIn IRI ?;
}`;

      const profileShape = `
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX ldbcvoc: <http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/>
PREFIX schema: <http://www.w3.org/2000/01/rdf-schema#>

<$> CLOSED {
    a ldbcvoc:Person ?;
    <http://www.w3.org/ns/pim/space#storage> IRI ? ;
    ldbcvoc:id xsd:long;
    ldbcvoc:firstName xsd:string;
    ldbcvoc:lastName xsd:string;
    ldbcvoc:gender ["male" "female" "other"];
    ldbcvoc:birthday xsd:date;
    ldbcvoc:locationIP xsd:string;
    ldbcvoc:browserUsed xsd:string;
    ldbcvoc:creationDate xsd:date;
    ldbcvoc:isLocatedIn IRI;
    ldbcvoc:speaks xsd:string + ;
    ldbcvoc:email xsd:string *;
    ldbcvoc:hasInterest IRI *;
    ldbcvoc:studyAt IRI *;
    ldbcvoc:likes IRI *;
}
`;
      const shapeMapWithRealShape: Record<string, IShapeEntry> = {
        comments: {
          shapes: [ commentShape ],
          directory: 'comments',
          name: 'Comment',
        },
        posts: {
          shapes: [ postShape ],
          directory: 'posts',
          name: 'Post',
        },
        card: {
          shapes: [ profileShape ],
          directory: 'profile',
          name: 'Profile',
        },
      };
      jest.resetAllMocks();
      collector = new DatasetSummaryShapeIndex({
        dataset: dataset.value,
        iriFragmentationOneFile,
        iriFragmentationMultipleFiles,
        datasetObjectFragmentationPredicate,
        shapeMap: shapeMapWithRealShape,
        contentTypesOfDatasets,
        randomSeed,
        datasetObjectExeption,
      });
    });

    it('should provide an empty output given no entries', async() => {
      const output = await collector.serialize();
      expect(output).toHaveLength(0);
    });

    it('should provide an output', async() => {
      jest.spyOn(prand, 'uniformIntDistribution')
        .mockImplementationOnce(() => {
          return <any>[ 0, this ];
        });

      const spySerializeShapeIndexEntries = jest.spyOn(collector, 'serializeShapeIndexEntries')
        .mockResolvedValueOnce([{ quads: [ '' ]}, [ '', '', '' ]]);
      const spySerializeShapeIndexInstance = jest.spyOn(collector, 'serializeShapeIndexInstance')
        .mockReturnValueOnce({ quads: []});
      const spySerializeCompletenessOfShapeIndex = jest.spyOn(collector, 'serializeCompletenessOfShapeIndex')
        .mockReturnValueOnce([{ quads: []}]);

      const output = await collector.serialize();
      expect(output).toHaveLength(4);

      expect(spySerializeShapeIndexEntries).toHaveBeenCalledTimes(1);
      expect(spySerializeShapeIndexInstance).toHaveBeenCalledTimes(1);
      expect(spySerializeCompletenessOfShapeIndex).toHaveBeenCalledTimes(1);
    });
  });
});
