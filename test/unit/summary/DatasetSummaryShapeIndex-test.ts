import prand from 'pure-rand';
import { DataFactory } from 'rdf-data-factory';
import type {
  IShapeEntry,
  IShapeIndexEntry,
  IUndescribedDataModel,
} from '../../../lib/summary/DatasetSummaryShapeIndex';
import { DatasetSummaryShapeIndex, ResourceFragmentation } from '../../../lib/summary/DatasetSummaryShapeIndex';

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
  const contentOfStorage = new Set([ 'comments', 'posts', 'card', 'noise' ]);
  const randomGeneratorShapeSelection: any = jest.fn();
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
        contentOfStorage,
        randomGeneratorShapeSelection,
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
          iri: `${dataset.value}/comments`,
        }],
      ]);

      expect(spy).toHaveBeenCalledTimes(1);
      expect((collector).contentHandled).toStrictEqual(expectedHandleContent);
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
          iri: `${dataset.value}/posts/`,
        }],
      ]);

      expect(spy).toHaveBeenCalledTimes(1);
      expect((collector).contentHandled).toStrictEqual(expectedHandleContent);
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
      expect((collector).contentHandled).toStrictEqual(new Map());
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
      expect((collector).contentHandled).toStrictEqual(new Map());
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
          iri: `${dataset.value}/profile/`,
        }],
      ]);

      expect(spy).toHaveBeenCalledTimes(1);
      expect((collector).contentHandled).toStrictEqual(expectedHandleContent);
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
          iri: `${dataset.value}/profile/`,
        }],
      ]);

      expect(spy).toHaveBeenCalledTimes(1);
      expect((collector).contentHandled).toStrictEqual(expectedHandleContent);

      const aSecondTriple = DF.quad(
        DF.namedNode('http://example.be#007/card#asad'),
        DF.namedNode('http://localhost:3000/internal/asw2da'),
        DF.namedNode('http://localhost:3000/foo'),
      );
      collector.register(aSecondTriple);

      expect(spy).toHaveBeenCalledTimes(1);
      expect((collector).contentHandled).toStrictEqual(expectedHandleContent);
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
          iri: `${dataset.value}/comments`,
        }],
      ]);

      expect(spy).toHaveBeenCalledTimes(1);
      expect((collector).contentHandled).toStrictEqual(expectedHandleContent);

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
          iri: `${dataset.value}/posts/`,
        }],
        [ 'comments', {
          ressourceFragmentation: ResourceFragmentation.SINGLE,
          shape: 'commentsA',
          iri: `${dataset.value}/comments`,
        }],
      ]);

      expect(spy).toHaveBeenCalledTimes(2);
      expect((collector).contentHandled).toStrictEqual(expectedHandleContentSecond);
    });
  });
});
