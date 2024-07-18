import { readFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import { DataFactory } from 'rdf-data-factory';
import type {
  IFragmentationStrategyDatasetSummaryShapeIndexOptions,
} from '../../../lib/strategy/FragmentationStrategyDatasetSummaryShapeIndex';
import {
  FragmentationStrategyDatasetShapeIndex,
} from '../../../lib/strategy/FragmentationStrategyDatasetSummaryShapeIndex';
import type { IDatasetSummaryOutput } from '../../../lib/summary/DatasetSummary';
import type { IShapeEntry } from '../../../lib/summary/DatasetSummaryShapeIndex';
import { ResourceFragmentation, DatasetSummaryShapeIndex } from '../../../lib/summary/DatasetSummaryShapeIndex';

const streamifyArray = require('streamify-array');

const DF = new DataFactory();

jest.mock('node:fs');
jest.mock('../../../lib/summary/DatasetSummaryShapeIndex');

describe('FragmentationStrategyDatasetShapeIndex', () => {
  describe('constructor', () => {
    beforeEach(() => {
      (<jest.Mock>readFileSync).mockImplementation(
        (val: string) => {
          return {
            toString() {
              switch (val) {
                case 'comments.shexc':
                  return 'comments';
                case 'posts.shexc':
                  return 'posts';
                case 'profile.shexc':
                  return 'profile';
                case 'settings.shexc':
                  return 'settings';
                case 'noise.shexc':
                  return 'noise';
              }
            },
          };
        },
      );
    });

    it('should use the defined random seed', () => {
      const options: IFragmentationStrategyDatasetSummaryShapeIndexOptions = {
        shapeConfig: {},
        contentOfStorage: [],
        randomSeed: 4,
        iriFragmentationOneFile: [],
        iriFragmentationMultipleFiles: [],
        datasetObjectFragmentationPredicate: {},
        datasetObjectExeption: {},
        datasetPatterns: [],
      };
      const strategy = new FragmentationStrategyDatasetShapeIndex(options);
      expect((<any>strategy).randomSeed).toBe(4);
    });

    it('should use a random random seed given no random seed is defined', () => {
      jest.spyOn(Date, 'now').mockReturnValueOnce(1);
      jest.spyOn(Math, 'random').mockReturnValueOnce(2);

      const options: IFragmentationStrategyDatasetSummaryShapeIndexOptions = {
        shapeConfig: {},
        contentOfStorage: [],
        iriFragmentationOneFile: [],
        iriFragmentationMultipleFiles: [],
        datasetObjectFragmentationPredicate: {},
        datasetObjectExeption: {},
        datasetPatterns: [],
      };
      const strategy = new FragmentationStrategyDatasetShapeIndex(options);
      expect((<any>strategy).randomSeed).toBe(2);
    });

    it('should generate the correct shape map', () => {
      const shapeMap: Record<string, IShapeEntry> = {
        comments: {
          shapes: [ 'comments.shexc', 'posts.shexc' ],
          directory: 'comments',
          name: 'Comment',
        },
        posts: {
          shapes: [ 'posts.shexc' ],
          directory: 'posts',
          name: 'Post',
        },
        card: {
          shapes: [ 'profile.shexc' ],
          directory: 'profile',
          name: 'Profile',
        },
        settings: {
          shapes: [ 'settings.shexc' ],
          directory: 'settings',
          name: 'Setting',
        },
        noise: {
          shapes: [ 'noise.shexc' ],
          directory: 'noise',
          name: 'Noise',
        },
      };
      const options: IFragmentationStrategyDatasetSummaryShapeIndexOptions = {
        shapeConfig: shapeMap,
        contentOfStorage: [],
        randomSeed: 4,
        iriFragmentationOneFile: [],
        iriFragmentationMultipleFiles: [],
        datasetObjectFragmentationPredicate: {},
        datasetObjectExeption: {},
        datasetPatterns: [],
      };
      const strategy = new FragmentationStrategyDatasetShapeIndex(options);
      expect((<any>strategy).shapeMap).toStrictEqual({
        comments: {
          shapes: [ 'comments', 'posts' ],
          directory: 'comments',
          name: 'Comment',
        },
        posts: {
          shapes: [ 'posts' ],
          directory: 'posts',
          name: 'Post',
        },
        card: {
          shapes: [ 'profile' ],
          directory: 'profile',
          name: 'Profile',
        },
        settings: {
          shapes: [ 'settings' ],
          directory: 'settings',
          name: 'Setting',
        },
        noise: {
          shapes: [ 'noise' ],
          directory: 'noise',
          name: 'Noise',
        },
      });
    });

    it('should not construct if an entry doesn\'t define a shape', () => {
      const shapeMap: Record<string, IShapeEntry> = {
        comments: {
          shapes: [ 'comments.shexc', 'posts.shexc' ],
          directory: 'comments',
          name: 'Comment',
        },
        posts: {
          shapes: [],
          directory: 'posts',
          name: 'Post',
        },
        card: {
          shapes: [ 'profile.shexc' ],
          directory: 'profile',
          name: 'Profile',
        },
        settings: {
          shapes: [ 'settings.shexc' ],
          directory: 'settings',
          name: 'Setting',
        },
        noise: {
          shapes: [ 'noise.shexc' ],
          directory: 'noise',
          name: 'Noise',
        },
      };
      const options: IFragmentationStrategyDatasetSummaryShapeIndexOptions = {
        shapeConfig: shapeMap,
        contentOfStorage: [],
        randomSeed: 4,
        iriFragmentationOneFile: [],
        iriFragmentationMultipleFiles: [],
        datasetObjectFragmentationPredicate: {},
        datasetObjectExeption: {},
        datasetPatterns: [],
      };
      expect(() => new FragmentationStrategyDatasetShapeIndex(options))
        .toThrow(new Error('every resource type defined should have at least one entry'));
    });
  });

  describe('createSummary', () => {
    let strategy: any;

    beforeEach(() => {
      (<jest.Mock>readFileSync).mockImplementation(
        (val: string) => {
          return {
            toString() {
              switch (val) {
                case 'comments.shexc':
                  return 'comments';
                case 'posts.shexc':
                  return 'posts';
                case 'profile.shexc':
                  return 'profile';
                case 'settings.shexc':
                  return 'settings';
                case 'noise.shexc':
                  return 'noise';
              }
            },
          };
        },
      );

      const shapeMap: Record<string, IShapeEntry> = {
        comments: {
          shapes: [ 'comments.shexc', 'posts.shexc' ],
          directory: 'comments',
          name: 'Comment',
        },
        posts: {
          shapes: [ 'posts.shexc' ],
          directory: 'posts',
          name: 'Post',
        },
        card: {
          shapes: [ 'profile.shexc' ],
          directory: 'profile',
          name: 'Profile',
        },
        settings: {
          shapes: [ 'settings.shexc' ],
          directory: 'settings',
          name: 'Setting',
        },
        noise: {
          shapes: [ 'noise.shexc' ],
          directory: 'noise',
          name: 'Noise',
        },
      };
      const options: IFragmentationStrategyDatasetSummaryShapeIndexOptions = {
        shapeConfig: shapeMap,
        contentOfStorage: [],
        randomSeed: 4,
        iriFragmentationOneFile: [],
        iriFragmentationMultipleFiles: [],
        datasetObjectFragmentationPredicate: {},
        datasetObjectExeption: {},
        datasetPatterns: [],
      };
      strategy = new FragmentationStrategyDatasetShapeIndex(options);
    });

    it('should create a summary and increment the random seed', () => {
      const dataset = 'http://exemple.ca';
      strategy.createSummary(dataset);
      expect(strategy.randomSeed).toBe(5);
    });
  });

  describe('fragment', () => {
    let strategy: any;
    let sink: any;

    beforeEach(() => {
      sink = {
        push: jest.fn(),
      };
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

      const noiseShape = `
            <$>  {
               
            }
            `;

      const settingShape = `
            <$>  {
               
            }
            `;
      (<jest.Mock>readFileSync).mockImplementation(
        (val: string) => {
          return {
            toString() {
              switch (val) {
                case 'comments.shexc':
                  return commentShape;
                case 'posts.shexc':
                  return postShape;
                case 'profile.shexc':
                  return profileShape;
                case 'settings.shexc':
                  return settingShape;
                case 'noise.shexc':
                  return noiseShape;
              }
            },
          };
        },
      );

      const shapeMap: Record<string, IShapeEntry> = {
        comments: {
          shapes: [ 'comments.shexc', 'posts.shexc' ],
          directory: 'comments',
          name: 'Comment',
        },
        posts: {
          shapes: [ 'posts.shexc' ],
          directory: 'posts',
          name: 'Post',
        },
        card: {
          shapes: [ 'profile.shexc' ],
          directory: 'profile',
          name: 'Profile',
        },
        settings: {
          shapes: [ 'settings.shexc' ],
          directory: 'settings',
          name: 'Setting',
        },
        noise: {
          shapes: [ 'noise.shexc' ],
          directory: 'noise',
          name: 'Noise',
        },
      };
      const options: IFragmentationStrategyDatasetSummaryShapeIndexOptions = {
        shapeConfig: shapeMap,
        contentOfStorage: [ 'noise', 'settings', 'card', 'posts', 'comments' ],
        randomSeed: 4,
        iriFragmentationOneFile: [
          'http://localhost:3000/internal/FragmentationOneFile',
        ],
        iriFragmentationMultipleFiles: [
          'http://localhost:3000/internal/FragmentationPerResource',
          'http://localhost:3000/internal/FragmentationLocation',
          'http://localhost:3000/internal/FragmentationCreationDate',
        ],
        datasetObjectFragmentationPredicate: {
          comments: 'http://localhost:3000/internal/commentsFragmentation',
          posts: 'http://localhost:3000/internal/postsFragmentation',
        },
        datasetObjectExeption: {
          card: { name: 'card', fragmentation: ResourceFragmentation.DISTRIBUTED },
          noise: { name: 'noise', fragmentation: ResourceFragmentation.DISTRIBUTED },
          settings: { name: 'settings', fragmentation: ResourceFragmentation.DISTRIBUTED },
        },
        datasetPatterns: [ '^(.*\\/pods\\/[0-9]+)' ],
      };
      strategy = new FragmentationStrategyDatasetShapeIndex(options);
    });

    it('should not handle an empty stream', async() => {
      await strategy.fragment(streamifyArray([]), sink);
      expect(sink.push).not.toHaveBeenCalled();
    });

    it('should not handle a quad not bounded by a shape', async() => {
      const quads = [
        DF.quad(
          DF.blankNode(),
          DF.namedNode('foo'),
          DF.namedNode('bar'),
        ),
      ];
      await strategy.fragment(streamifyArray([ ...quads ]), sink);
      expect(sink.push).not.toHaveBeenCalled();
    });

    it('should handle a quad not related to the datasets', async() => {
      const quads = [
        DF.quad(
          DF.namedNode('http://localhost:3000/pods/00000010995116278291'),
          DF.namedNode('http://localhost:3000/internal/barFragmentation'),
          DF.namedNode('http://localhost:3000/internal/FragmentationOneFile'),
        ),
      ];

      jest.spyOn(DatasetSummaryShapeIndex.prototype, 'serialize').mockImplementation().mockResolvedValue([]);

      await strategy.fragment(streamifyArray([ ...quads ]), sink);
      expect(sink.push).not.toHaveBeenCalled();
    });

    it('should handle a quad related to a dataset', async() => {
      const quads = [
        DF.quad(
          DF.namedNode('http://localhost:3000/pods/00000010995116278291'),
          DF.namedNode('http://localhost:3000/internal/barFragmentation'),
          DF.namedNode('http://localhost:3000/internal/FragmentationOneFile'),
        ),
      ];

      const outputs = [
        {
          iri: 'foo',
          quads: [
            DF.quad(DF.blankNode(), DF.namedNode('foo'), DF.blankNode()),
            DF.quad(DF.blankNode(), DF.namedNode('bar'), DF.blankNode()),
          ],
        },
        {
          iri: 'foo1',
          quads: [
            DF.quad(DF.blankNode(), DF.namedNode('foo1'), DF.blankNode()),
            DF.quad(DF.blankNode(), DF.namedNode('bar1'), DF.blankNode()),
          ],
        },
      ];

      const numberOfSinkCall = outputs.reduce((accumulator: number, currentValue: IDatasetSummaryOutput): number => {
        return accumulator += currentValue.quads.length;
      }, 0);

      jest.spyOn(DatasetSummaryShapeIndex.prototype, 'serialize').mockImplementation().mockResolvedValueOnce(outputs);

      await strategy.fragment(streamifyArray([ ...quads ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(numberOfSinkCall);

      expect(sink.push).toHaveBeenNthCalledWith(1, outputs[0].iri, outputs[0].quads[0]);
      expect(sink.push).toHaveBeenNthCalledWith(2, outputs[0].iri, outputs[0].quads[1]);

      expect(sink.push).toHaveBeenNthCalledWith(3, outputs[1].iri, outputs[1].quads[0]);
      expect(sink.push).toHaveBeenNthCalledWith(4, outputs[1].iri, outputs[1].quads[1]);
    });

    it('should handle quads related to multiple datasets', async() => {
      const quads = [
        DF.quad(
          DF.namedNode('http://localhost:3000/pods/00000010995116278291'),
          DF.namedNode('http://localhost:3000/internal/commentsFragmentation'),
          DF.namedNode('http://localhost:3000/internal/FragmentationOneFile'),
        ),
        DF.quad(
          DF.namedNode('http://localhost:3000/pods/00000010995116278291'),
          DF.namedNode('http://localhost:3000/internal/postsFragmentation'),
          DF.namedNode('http://localhost:3000/internal/FragmentationOneFile'),
        ),
        DF.quad(
          DF.namedNode('http://localhost:3000/pods/00000010995116278290'),
          DF.namedNode('http://localhost:3000/internal/postsFragmentation'),
          DF.namedNode('http://localhost:3000/internal/FragmentationOneFile'),
        ),
        DF.quad(
          DF.namedNode('http://localhost:3000/abcdefg'),
          DF.namedNode('http://localhost:3000/internal/postsFragmentation'),
          DF.namedNode('http://localhost:3000/internal/FragmentationOneFile'),
        ),
        DF.quad(
          DF.namedNode('http://localhost:3000/pods/00000010995116278292'),
          DF.namedNode('http://localhost:3000/internal/postsFragmentation'),
          DF.namedNode('http://localhost:3000/internal/FragmentationOneFile'),
        ),
      ];

      const outputs1 = [
        {
          iri: 'foo',
          quads: [
            DF.quad(DF.blankNode('0'), DF.namedNode('foo'), DF.blankNode('0')),
            DF.quad(DF.blankNode('0'), DF.namedNode('bar'), DF.blankNode('0')),
          ],
        },
        {
          iri: 'foo1',
          quads: [
            DF.quad(DF.blankNode('1'), DF.namedNode('foo1'), DF.blankNode('1')),
            DF.quad(DF.blankNode('1'), DF.namedNode('bar1'), DF.blankNode('1')),
          ],
        },
      ];

      const outputs2 = [
        {
          iri: 'foo2',
          quads: [
            DF.quad(DF.blankNode('2'), DF.namedNode('foo2'), DF.blankNode('2')),
            DF.quad(DF.blankNode('2'), DF.namedNode('bar2'), DF.blankNode('2')),
          ],
        },
        {
          iri: 'foo3',
          quads: [
            DF.quad(DF.blankNode('3'), DF.namedNode('foo3'), DF.blankNode('3')),
            DF.quad(DF.blankNode('3'), DF.namedNode('bar3'), DF.blankNode('3')),
          ],
        },
      ];

      jest.spyOn(DatasetSummaryShapeIndex.prototype, 'serialize').mockImplementation()
        .mockResolvedValueOnce(outputs1)
        .mockResolvedValueOnce(outputs2)
        .mockResolvedValueOnce([]);

      await strategy.fragment(streamifyArray([ ...quads ]), sink);

      const numberOfSinkCall = outputs1.reduce((accumulator: number, currentValue: IDatasetSummaryOutput): number => {
        return accumulator += currentValue.quads.length;
      }, 0) + outputs2.reduce((accumulator: number, currentValue: IDatasetSummaryOutput): number => {
        return accumulator += currentValue.quads.length;
      }, 0);

      expect(sink.push).toHaveBeenCalledTimes(numberOfSinkCall);

      expect(sink.push).toHaveBeenNthCalledWith(1, outputs1[0].iri, outputs1[0].quads[0]);
      expect(sink.push).toHaveBeenNthCalledWith(2, outputs1[0].iri, outputs1[0].quads[1]);

      expect(sink.push).toHaveBeenNthCalledWith(3, outputs1[1].iri, outputs1[1].quads[0]);
      expect(sink.push).toHaveBeenNthCalledWith(4, outputs1[1].iri, outputs1[1].quads[1]);

      expect(sink.push).toHaveBeenNthCalledWith(5, outputs2[0].iri, outputs2[0].quads[0]);
      expect(sink.push).toHaveBeenNthCalledWith(6, outputs2[0].iri, outputs2[0].quads[1]);

      expect(sink.push).toHaveBeenNthCalledWith(7, outputs2[1].iri, outputs2[1].quads[0]);
      expect(sink.push).toHaveBeenNthCalledWith(8, outputs2[1].iri, outputs2[1].quads[1]);
    });

    it('should reject on an erroring stream', async() => {
      const stream: any = new Readable();
      stream._read = () => {
        stream.emit('error', new Error('Error in stream'));
      };
      await expect(strategy.fragment(stream, sink)).rejects.toThrow(new Error('Error in stream'));
    });
  });
});
