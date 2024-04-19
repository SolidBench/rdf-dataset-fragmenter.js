import { readFileSync } from 'fs';
import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import { FragmentationStrategyShape } from '../../../lib/strategy/FragmentationStrategyShape';

const streamifyArray = require('streamify-array');

const DF = new DataFactory();

jest.mock('fs');
jest.mock('fs/promises');

describe('FragmentationStrategyShape', () => {
  let sink: any;

  describe('generateShape', () => {
    beforeEach(() => {
      sink = {
        push: jest.fn(),
      };
    });

    it('should push the shape inside the sink given a shex shape path with one shape', async () => {
      const shexc = `
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      PREFIX ldbcvoc: <http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/>
      PREFIX schema: <http://www.w3.org/2000/01/rdf-schema#>

      <#Post> {
          ldbcvoc:id xsd:long {1} ;
          ldbcvoc:imageFile xsd:string * ;
          ldbcvoc:locationIP xsd:string {1} ;
          ldbcvoc:browserUsed xsd:string {1} ;
          ldbcvoc:creationDate xsd:dateTime {1} ;
          ldbcvoc:hasCreator IRI {1} ;
          schema:seeAlso IRI * ;
          ldbcvoc:isLocatedIn IRI ? ;
      }
  `;

      await FragmentationStrategyShape.generateShape(sink, 'http://foo.ca/', shexc);
      expect(sink.push).toHaveBeenCalledTimes(81);
    });

    it('should push the shape inside the sink given a shex shape with a template iri', async () => {
      const shexc = `
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      PREFIX ldbcvoc: <http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/>
      PREFIX schema: <http://www.w3.org/2000/01/rdf-schema#>

      <$> {
          ldbcvoc:id xsd:long {1} ;
          ldbcvoc:imageFile xsd:string * ;
          ldbcvoc:locationIP xsd:string {1} ;
          ldbcvoc:browserUsed xsd:string {1} ;
          ldbcvoc:creationDate xsd:dateTime {1} ;
          ldbcvoc:hasCreator IRI {1} ;
          schema:seeAlso IRI * ;
          ldbcvoc:isLocatedIn IRI ? ;
      }
  `;

      await FragmentationStrategyShape.generateShape(sink, 'http://foo.ca/', shexc);
      expect(sink.push).toHaveBeenCalledTimes(81);
    });

    it('should reject the promise given that the shape is not valid', async () => {
      const shexc = `
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
                                PREFIX ldbcvoc: <http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/>
                                PREFIX schema: <http://www.w3.org/2000/01/rdf-schema#>

                                <#Post> {
                                    SUPER VALID~~~!
                                    ldbcvoc:id xsd:long {1} ;
                                    ldbcvoc:imageFile xsd:string * ;
                                    ldbcvoc:locationIP xsd:string {1} ;
                                    ldbcvoc:browserUsed xsd:string {1} ;
                                    ldbcvoc:creationDate xsd:dateTime {1} ;
                                    ldbcvoc:hasCreator IRI {1} ;
                                    schema:seeAlso IRI * ;
                                    ldbcvoc:isLocatedIn IRI ? ;
                                }`;

      await expect(FragmentationStrategyShape.generateShape(sink, 'http://foo.ca/', shexc)).rejects.toBeDefined();
      expect(sink.push).toHaveBeenCalledTimes(0);
    });
  });

  describe('generateShapeIndexEntry', () => {
    const shapeIndexIRI = 'foo';
    const shapeIRI = 'bar';
    const contentIri = 'boo';

    beforeEach(() => {
      sink = {
        push: jest.fn(),
      };
    });

    it(`should add into the sink quads refering to the entry of the shape index given the resource is not at the root of the storage`, async () => {
      const isInRootOfStorage = false;
      await FragmentationStrategyShape.generateShapeIndexEntry(sink,
        shapeIndexIRI,
        shapeIRI,
        isInRootOfStorage,
        contentIri);

      expect(sink.push).toHaveBeenCalledTimes(3);
      const calls: any[] = sink.push.mock.calls;

      expect(calls[0][0]).toBe(shapeIndexIRI);
      expect((<RDF.Quad>calls[0][1]).subject).toStrictEqual(DF.namedNode(shapeIndexIRI));
      expect((<RDF.Quad>calls[0][1]).predicate).toStrictEqual(FragmentationStrategyShape.SHAPE_INDEX_ENTRY_NODE);
      const entry = (<RDF.Quad>calls[0][1]).object;

      expect(calls[1][0]).toBe(shapeIndexIRI);
      expect((<RDF.Quad>calls[1][1]).subject).toStrictEqual(entry);
      expect((<RDF.Quad>calls[1][1]).predicate).toStrictEqual(FragmentationStrategyShape.SHAPE_INDEX_BIND_BY_SHAPE_NODE);
      expect((<RDF.Quad>calls[1][1]).object).toStrictEqual(DF.namedNode(shapeIRI));

      expect(calls[2][0]).toBe(shapeIndexIRI);
      expect((<RDF.Quad>calls[2][1]).subject).toStrictEqual(entry);
      expect((<RDF.Quad>calls[2][1]).predicate).toStrictEqual(FragmentationStrategyShape.SOLID_INSTANCE_CONTAINER_NODE);
      expect((<RDF.Quad>calls[2][1]).object).toStrictEqual(DF.namedNode(contentIri));

    });

    it(`should add into the sink quads refering to the entry of the shape index given the resource is at the root of the storage`, async () => {
      const isNotInRootOfPod = true;
      await FragmentationStrategyShape.generateShapeIndexEntry(sink,
        shapeIndexIRI,
        shapeIRI,
        isNotInRootOfPod,
        contentIri);

      expect(sink.push).toHaveBeenCalledTimes(3);
      const calls: any[] = sink.push.mock.calls;

      expect(calls[0][0]).toBe(shapeIndexIRI);
      expect((<RDF.Quad>calls[0][1]).subject).toStrictEqual(DF.namedNode(shapeIndexIRI));
      expect((<RDF.Quad>calls[0][1]).predicate).toStrictEqual(FragmentationStrategyShape.SHAPE_INDEX_ENTRY_NODE);
      const entry = (<RDF.Quad>calls[0][1]).object;

      expect(calls[1][0]).toBe(shapeIndexIRI);
      expect((<RDF.Quad>calls[1][1]).subject).toStrictEqual(entry);
      expect((<RDF.Quad>calls[1][1]).predicate).toStrictEqual(FragmentationStrategyShape.SHAPE_INDEX_BIND_BY_SHAPE_NODE);
      expect((<RDF.Quad>calls[1][1]).object).toStrictEqual(DF.namedNode(shapeIRI));

      expect(calls[2][0]).toBe(shapeIndexIRI);
      expect((<RDF.Quad>calls[2][1]).subject).toStrictEqual(entry);
      expect((<RDF.Quad>calls[2][1]).predicate).toStrictEqual(FragmentationStrategyShape.SOLID_INSTANCE_NODE);
      expect((<RDF.Quad>calls[2][1]).object).toStrictEqual(DF.namedNode(contentIri));
    });
  });

  describe('generateShapeIndexLocationTriple', () => {
    const podIRI = 'foo';
    const shapeTreeIRI = 'bar';
    const iri = 'boo';

    beforeEach(() => {
      sink = {
        push: jest.fn(),
      };
    });

    it('should add a shapetree descriptor to the sink at the given iri', async () => {
      await FragmentationStrategyShape.generateShapeIndexLocationTriple(sink, podIRI, shapeTreeIRI, iri);
      expect(sink.push).toHaveBeenCalledTimes(1);
      const call = sink.push.mock.calls;
      expect(call[0][0]).toBe(iri);
      const expectedQuad = DF.quad(
        DF.namedNode(podIRI),
        FragmentationStrategyShape.SHAPE_INDEX_LOCATION_NODE,
        DF.namedNode(shapeTreeIRI),
      );
      expect((<RDF.Quad>call[0][1])).toStrictEqual(expectedQuad);
    });
  });

  describe('generateShapeIndexInformation', () => {
    const podIRI = 'http://localhost:3000/pods/00000000000000000065';
    const shapeTreeIRI = 'boo';
    const shapePath = 'bar';

    const originalImplementationgenerateShapeIndexEntry = FragmentationStrategyShape.generateShapeIndexEntry;
    const originalImplementationGenerateShape = FragmentationStrategyShape.generateShape;
    const originalImplementationGenerateShapeTreeLocator = FragmentationStrategyShape.generateShapeIndexLocationTriple;

    beforeEach(() => {
      sink = {
        push: jest.fn(),
      };
      FragmentationStrategyShape.generateShapeIndexEntry = jest.fn();
      FragmentationStrategyShape.generateShape = jest.fn();
      FragmentationStrategyShape.generateShapeIndexLocationTriple = jest.fn();
    });

    afterAll(() => {
      FragmentationStrategyShape.generateShapeIndexEntry = originalImplementationgenerateShapeIndexEntry;
      FragmentationStrategyShape.generateShape = originalImplementationGenerateShape;
      FragmentationStrategyShape.generateShapeIndexLocationTriple = originalImplementationGenerateShapeTreeLocator;
    });

    it(`should call the generateShape and the generateShapeIndexEntry when the iri is in a container in the pod.
     It should also add the iri into the resoucesHandle and irisHandled sets.`, async () => {
      const resourceId = 'http://localhost:3000/pods/00000000000000000065/posts';
      const folder = 'posts';
      const name = 'bar';

      await FragmentationStrategyShape.generateShapeIndexInformation(sink,
        resourceId,
        podIRI,
        shapeTreeIRI,
        folder,
        shapePath,
        name,
        false);
      expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledTimes(1);

      expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenNthCalledWith(
        1,
        sink,
        shapeTreeIRI,
        `${podIRI}/${folder}_shape#${name}`,
        false,
        'http://localhost:3000/pods/00000000000000000065/posts/',
      );
    });

    it(`should call the generateShape and the generateShapeIndexEntry when the iri is in the root of the pod.
     It should also add the iri into the resoucesHandled and the irisHandled sets.`, async () => {
      const resourceId = 'http://localhost:3000/pods/00000000000000000065/profile';
      const folder = 'profile';
      const name = 'bar';

      await FragmentationStrategyShape.generateShapeIndexInformation(sink,
        resourceId,
        podIRI,
        shapeTreeIRI,
        folder,
        shapePath,
        name,
        true);
      expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledTimes(1);

      expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenNthCalledWith(
        1,
        sink,
        shapeTreeIRI,
        `${podIRI}/${folder}_shape#${name}`,
        true,
        'http://localhost:3000/pods/00000000000000000065/profile',
      );
    });
  });

  describe('instanciateShapeIndex', () => {
    const shapeIndexIri = 'foo';
    const podIri = 'bar';

    beforeEach(() => {
      sink = {
        push: jest.fn(),
      };
    });

    it('should generate the triples to declare the shape index', async () => {
      const shapeIndexNode = DF.namedNode(shapeIndexIri);
      await FragmentationStrategyShape.instanciateShapeIndex(sink, shapeIndexIri, podIri);

      const expectedTypeDefinition = DF.quad(
        shapeIndexNode,
        FragmentationStrategyShape.RDF_TYPE_NODE,
        FragmentationStrategyShape.SHAPE_INDEX_CLASS_NODE
      );
      const expectedDomain = DF.quad(
        shapeIndexNode,
        FragmentationStrategyShape.SHAPE_INDEX_DOMAIN_NODE,
        DF.namedNode(podIri)
      );

      expect(sink.push).toHaveBeenCalledTimes(2);
      expect(sink.push).toHaveBeenNthCalledWith(1, shapeIndexIri, expectedTypeDefinition);
      expect(sink.push).toHaveBeenNthCalledWith(2, shapeIndexIri, expectedDomain);
    });
  });

  describe('setTheCompletenessOfTheShapeIndex', () => {
    const shapeIndexIri = 'foo';
    const expectedResources = new Set(['a', 'b', 'c'])
    beforeEach(() => {
      sink = {
        push: jest.fn(),
      };
    });

    it(`should not annotate the shape index has complete 
    if the handle resource doesn\'t have the same size as the expected resource`, async () => {
      const handledResources = new Set(['a']);
      await FragmentationStrategyShape.setTheCompletenessOfTheShapeIndex(
        sink,
        handledResources,
        expectedResources,
        shapeIndexIri);

      expect(sink.push).not.toHaveBeenCalled();
    });

    it(`should not annotate the shape index has complete 
    if the handle resource differe from the expected one`, async () => {
      const handledResources = new Set(['a', 'b', 'cpp']);
      await FragmentationStrategyShape.setTheCompletenessOfTheShapeIndex(
        sink,
        handledResources,
        expectedResources,
        shapeIndexIri);

      expect(sink.push).not.toHaveBeenCalled();
    });

    it(`should annotate the shape index given the handle resource are the same as the expected`, async () => {
      await FragmentationStrategyShape.setTheCompletenessOfTheShapeIndex(
        sink,
        expectedResources,
        expectedResources,
        shapeIndexIri);

      const isComplete = DF.quad(
        DF.namedNode(shapeIndexIri),
        FragmentationStrategyShape.SHAPE_INDEX_IS_COMPLETE_NODE,
        FragmentationStrategyShape.RDF_TRUE
      );
      expect(sink.push).toHaveBeenCalledTimes(1);
      expect(sink.push).toHaveBeenLastCalledWith(shapeIndexIri, isComplete);
    });

  });
  /**
   * @todo test `setTheCompletenessOfTheShapeIndex`
   * @todo test  `instanciateShapeIndex`
   */
  describe('fragment', () => {
    let strategy: FragmentationStrategyShape;
    const relativePath = undefined;
    const tripleShapeTreeLocator = true;
    const shapeConfig = {
      comments: {
        shape: 'comments.shexc',
        directory: 'comments',
        name: 'Comment',
      },
      posts: {
        shape: 'posts.shexc',
        directory: 'posts',
        name: 'Post',
      },
      card: {
        shape: 'profile.shexc',
        directory: 'profile',
        name: 'Profile',
      },
    };
    const contentOfStorage = ['comments', 'posts', 'card', 'publicTypeIndex', 'noise'];

    const originalImplementationgenerateShapeIndexEntry = FragmentationStrategyShape.generateShapeIndexEntry;
    const originalImplementationGenerateShape = FragmentationStrategyShape.generateShape;
    const originalImplementationGenerateShapeTreeLocator = FragmentationStrategyShape.generateShapeIndexLocationTriple;
    beforeEach(() => {
      sink = {
        push: jest.fn(),
      };

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
              }
            },
          };
        },
      );

      FragmentationStrategyShape.generateShapeIndexEntry = jest.fn();
      FragmentationStrategyShape.generateShape = jest.fn();
      FragmentationStrategyShape.generateShapeIndexLocationTriple = jest.fn();
      strategy = new FragmentationStrategyShape(shapeConfig, contentOfStorage, relativePath, tripleShapeTreeLocator);
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    afterAll(() => {
      FragmentationStrategyShape.generateShapeIndexEntry = originalImplementationgenerateShapeIndexEntry;
      FragmentationStrategyShape.generateShape = originalImplementationGenerateShape;
      FragmentationStrategyShape.generateShapeIndexLocationTriple = originalImplementationGenerateShapeTreeLocator;
    });

    it('should not handle an empty stream', async () => {
      await strategy.fragment(streamifyArray([]), sink);
      expect(sink.push).not.toHaveBeenCalled();
    });

    it('should not handle a quad not bounded by a shape', async () => {
      const quads = [
        DF.quad(
          DF.blankNode(),
          DF.namedNode('foo'),
          DF.namedNode('bar'),
        ),
      ];
      await strategy.fragment(streamifyArray([...quads]), sink);
      expect(sink.push).not.toHaveBeenCalled();
    });

    it('should handle a quad referring to a container in a pod bounded by a shape', async () => {
      const quads = [
        DF.quad(
          DF.namedNode('http://localhost:3000/pods/00000000000000000267/posts/2011-10-13#687194891562'),
          DF.namedNode('foo'),
          DF.namedNode('bar'),
        ),
      ];
      await strategy.fragment(streamifyArray([...quads]), sink);

      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledWith(
        sink,
        'http://localhost:3000/pods/00000000000000000267/posts_shape#Post',
        'posts',

      );

      expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenCalledWith(
        sink,
        `http://localhost:3000/pods/00000000000000000267/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
        'http://localhost:3000/pods/00000000000000000267/posts_shape#Post',
        false,
        'http://localhost:3000/pods/00000000000000000267/posts/',
      );

      expect(FragmentationStrategyShape.generateShapeIndexLocationTriple).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShapeIndexLocationTriple).toHaveBeenCalledWith(
        sink,
        'http://localhost:3000/pods/00000000000000000267/',
        `http://localhost:3000/pods/00000000000000000267/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
        'http://localhost:3000/pods/00000000000000000267/posts/2011-10-13#687194891562',
      );
    });

    it('should handle multiple quads with one quad referring to a container in a pod bounded by a shape', async () => {
      const quads = [
        DF.quad(
          DF.blankNode(),
          DF.namedNode('foo'),
          DF.namedNode('bar'),
        ),
        DF.quad(
          DF.namedNode('http://localhost:3000/pods/00000000000000000267/posts/2011-10-13#687194891562'),
          DF.namedNode('foo'),
          DF.namedNode('bar'),
        ),
        DF.quad(
          DF.blankNode(),
          DF.namedNode('foo'),
          DF.namedNode('bar'),
        ),
      ];
      await strategy.fragment(streamifyArray([...quads]), sink);

      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledWith(
        sink,
        'http://localhost:3000/pods/00000000000000000267/posts_shape#Post',
        'posts',

      );

      expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenCalledWith(
        sink,
        `http://localhost:3000/pods/00000000000000000267/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
        'http://localhost:3000/pods/00000000000000000267/posts_shape#Post',
        false,
        'http://localhost:3000/pods/00000000000000000267/posts/',
      );

      expect(FragmentationStrategyShape.generateShapeIndexLocationTriple).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShapeIndexLocationTriple).toHaveBeenCalledWith(
        sink,
        'http://localhost:3000/pods/00000000000000000267/',
        `http://localhost:3000/pods/00000000000000000267/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
        'http://localhost:3000/pods/00000000000000000267/posts/2011-10-13#687194891562',
      );
    });

    it(`should handle one time quads with the same suject 
    when the suject links to a resource inside a container in a pod`, async () => {
      const quads = [
        DF.quad(
          DF.namedNode('http://localhost:3000/pods/00000000000000000267/posts/2011-10-13#687194891562'),
          DF.namedNode('foo'),
          DF.namedNode('bar'),
        ),

        DF.quad(
          DF.namedNode('http://localhost:3000/pods/00000000000000000267/posts/2011-10-13#687194891562'),
          DF.namedNode('boo'),
          DF.namedNode('cook'),
        ),
      ];
      await strategy.fragment(streamifyArray([...quads]), sink);

      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledWith(
        sink,
        'http://localhost:3000/pods/00000000000000000267/posts_shape#Post',
        'posts',

      );

      expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenCalledWith(
        sink,
        `http://localhost:3000/pods/00000000000000000267/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
        'http://localhost:3000/pods/00000000000000000267/posts_shape#Post',
        false,
        'http://localhost:3000/pods/00000000000000000267/posts/',
      );

      expect(FragmentationStrategyShape.generateShapeIndexLocationTriple).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShapeIndexLocationTriple).toHaveBeenCalledWith(
        sink,
        'http://localhost:3000/pods/00000000000000000267/',
        `http://localhost:3000/pods/00000000000000000267/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
        'http://localhost:3000/pods/00000000000000000267/posts/2011-10-13#687194891562',
      );
    });

    it('should handle one time multiple subjects when the quad subjects are inside the same container of a pod',
      async () => {
        const quads = [
          DF.quad(
            DF.namedNode('http://localhost:3000/pods/00000000000000000267/posts/2011-10-13#1'),
            DF.namedNode('foo'),
            DF.namedNode('bar'),
          ),

          DF.quad(
            DF.namedNode('http://localhost:3000/pods/00000000000000000267/posts/2011-10-13#2'),
            DF.namedNode('boo'),
            DF.namedNode('cook'),
          ),

          DF.quad(
            DF.namedNode('http://localhost:3000/pods/00000000000000000267/posts/2011-10-13#3'),
            DF.namedNode('boo'),
            DF.namedNode('cook'),
          ),
        ];
        await strategy.fragment(streamifyArray([...quads]), sink);

        expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledTimes(1);
        expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledWith(
          sink,
          'http://localhost:3000/pods/00000000000000000267/posts_shape#Post',
          'posts',

        );

        expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenCalledTimes(1);
        expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenCalledWith(
          sink,
          `http://localhost:3000/pods/00000000000000000267/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
          'http://localhost:3000/pods/00000000000000000267/posts_shape#Post',
          false,
          'http://localhost:3000/pods/00000000000000000267/posts/',
        );

        expect(FragmentationStrategyShape.generateShapeIndexLocationTriple).toHaveBeenCalledTimes(3);
        expect(FragmentationStrategyShape.generateShapeIndexLocationTriple).toHaveBeenNthCalledWith(1,
          sink,
          'http://localhost:3000/pods/00000000000000000267/',
          `http://localhost:3000/pods/00000000000000000267/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
          'http://localhost:3000/pods/00000000000000000267/posts/2011-10-13#1');
        expect(FragmentationStrategyShape.generateShapeIndexLocationTriple).toHaveBeenNthCalledWith(2,
          sink,
          'http://localhost:3000/pods/00000000000000000267/',
          `http://localhost:3000/pods/00000000000000000267/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
          'http://localhost:3000/pods/00000000000000000267/posts/2011-10-13#2');
        expect(FragmentationStrategyShape.generateShapeIndexLocationTriple).toHaveBeenNthCalledWith(3,
          sink,
          'http://localhost:3000/pods/00000000000000000267/',
          `http://localhost:3000/pods/00000000000000000267/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
          'http://localhost:3000/pods/00000000000000000267/posts/2011-10-13#3');
      });

    it(`should handle a quad inside a container in a pod bounded by shape when tripleShapeTreeLocator is false`, async () => {
      strategy = new FragmentationStrategyShape(shapeConfig, contentOfStorage, relativePath, false);
      const quads = [
        DF.quad(
          DF.namedNode('http://localhost:3000/pods/00000000000000000267/posts/2011-10-13#687194891562'),
          DF.namedNode('foo'),
          DF.namedNode('bar'),
        ),
      ];
      await strategy.fragment(streamifyArray([...quads]), sink);

      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledWith(
        sink,
        'http://localhost:3000/pods/00000000000000000267/posts_shape#Post',
        'posts',

      );

      expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenCalledWith(
        sink,
        `http://localhost:3000/pods/00000000000000000267/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
        'http://localhost:3000/pods/00000000000000000267/posts_shape#Post',
        false,
        'http://localhost:3000/pods/00000000000000000267/posts/',
      );

      expect(FragmentationStrategyShape.generateShapeIndexLocationTriple).not.toHaveBeenCalled();
    });

    it('should handle a quad referring to a resource in the root of a pod bounded by a shape', async () => {
      const quads = [
        DF.quad(
          DF.namedNode('http://localhost:3000/pods/00000000000000000267/posts#1'),
          DF.namedNode('foo'),
          DF.namedNode('bar'),
        ),
      ];
      await strategy.fragment(streamifyArray([...quads]), sink);

      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledWith(
        sink,
        'http://localhost:3000/pods/00000000000000000267/posts_shape#Post',
        'posts',

      );

      expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenCalledWith(
        sink,
        `http://localhost:3000/pods/00000000000000000267/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
        'http://localhost:3000/pods/00000000000000000267/posts_shape#Post',
        true,
        'http://localhost:3000/pods/00000000000000000267/posts',
      );

      expect(FragmentationStrategyShape.generateShapeIndexLocationTriple).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShapeIndexLocationTriple).toHaveBeenCalledWith(
        sink,
        'http://localhost:3000/pods/00000000000000000267/',
        `http://localhost:3000/pods/00000000000000000267/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
        'http://localhost:3000/pods/00000000000000000267/posts#1',
      );
    });

    it(`should handle multiple quads with one quad referring to resource in the root of a pod bounded by a shape`,
      async () => {
        const quads = [
          DF.quad(
            DF.namedNode('http://localhost:3000/pods/00000000000000000267/posts#1'),
            DF.namedNode('foo'),
            DF.namedNode('bar'),
          ),
          DF.quad(
            DF.blankNode(),
            DF.namedNode('foo'),
            DF.namedNode('bar'),
          ),
          DF.quad(
            DF.blankNode(),
            DF.namedNode('foo'),
            DF.namedNode('bar'),
          ),
        ];
        await strategy.fragment(streamifyArray([...quads]), sink);

        expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledTimes(1);
        expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledWith(
          sink,
          'http://localhost:3000/pods/00000000000000000267/posts_shape#Post',
          'posts',

        );

        expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenCalledTimes(1);
        expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenCalledWith(
          sink,
          `http://localhost:3000/pods/00000000000000000267/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
          'http://localhost:3000/pods/00000000000000000267/posts_shape#Post',
          true,
          'http://localhost:3000/pods/00000000000000000267/posts',
        );

        expect(FragmentationStrategyShape.generateShapeIndexLocationTriple).toHaveBeenCalledTimes(1);
        expect(FragmentationStrategyShape.generateShapeIndexLocationTriple).toHaveBeenCalledWith(
          sink,
          'http://localhost:3000/pods/00000000000000000267/',
          `http://localhost:3000/pods/00000000000000000267/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
          'http://localhost:3000/pods/00000000000000000267/posts#1',
        );
      });

    it('should handle one time multiple quads refering to resources in the root of a pod bounded by a shape',
      async () => {
        const quads = [
          DF.quad(
            DF.namedNode('http://localhost:3000/pods/00000000000000000267/posts#1'),
            DF.namedNode('foo'),
            DF.namedNode('bar'),
          ),
          DF.quad(
            DF.namedNode('http://localhost:3000/pods/00000000000000000267/posts#2'),
            DF.namedNode('foo'),
            DF.namedNode('bar'),
          ),
        ];
        await strategy.fragment(streamifyArray([...quads]), sink);

        expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledTimes(1);
        expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledWith(
          sink,
          'http://localhost:3000/pods/00000000000000000267/posts_shape#Post',
          'posts',

        );

        expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenCalledTimes(1);
        expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenCalledWith(
          sink,
          `http://localhost:3000/pods/00000000000000000267/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
          'http://localhost:3000/pods/00000000000000000267/posts_shape#Post',
          true,
          'http://localhost:3000/pods/00000000000000000267/posts',
        );

        expect(FragmentationStrategyShape.generateShapeIndexLocationTriple).toHaveBeenCalledTimes(2);
        expect(FragmentationStrategyShape.generateShapeIndexLocationTriple).toHaveBeenNthCalledWith(1,
          sink,
          'http://localhost:3000/pods/00000000000000000267/',
          `http://localhost:3000/pods/00000000000000000267/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
          'http://localhost:3000/pods/00000000000000000267/posts#1');
        expect(FragmentationStrategyShape.generateShapeIndexLocationTriple).toHaveBeenNthCalledWith(2,
          sink,
          'http://localhost:3000/pods/00000000000000000267/',
          `http://localhost:3000/pods/00000000000000000267/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
          'http://localhost:3000/pods/00000000000000000267/posts#2');
      });

    it('should handle multiple quads refering to resources in multiple pod roots that are bounded by a shape',
      async () => {
        const quads = [
          DF.quad(
            DF.namedNode('http://localhost:3000/pods/00000000000000000267/posts#1'),
            DF.namedNode('foo'),
            DF.namedNode('bar'),
          ),
          DF.quad(
            DF.namedNode('http://localhost:3000/pods/000000000000000002671/posts#2'),
            DF.namedNode('foo'),
            DF.namedNode('bar'),
          ),
        ];

        const pods = [
          'http://localhost:3000/pods/00000000000000000267',
          'http://localhost:3000/pods/000000000000000002671',
        ];
        await strategy.fragment(streamifyArray([...quads]), sink);

        expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledTimes(2);
        expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenCalledTimes(2);
        expect(FragmentationStrategyShape.generateShapeIndexLocationTriple).toHaveBeenCalledTimes(2);

        for (let i = 1; i < quads.length + 1; i++) {
          expect(FragmentationStrategyShape.generateShape).toHaveBeenNthCalledWith(i,
            sink,
            `${pods[i - 1]}/posts_shape#Post`,
            'posts');
          expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenNthCalledWith(i,
            sink,
            `${pods[i - 1]}/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
            `${pods[i - 1]}/posts_shape#Post`,
            true,
            `${pods[i - 1]}/posts`);
          expect(FragmentationStrategyShape.generateShapeIndexLocationTriple).toHaveBeenNthCalledWith(i,
            sink,
            `${pods[i - 1]}/`,
            `${pods[i - 1]}/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
            quads[i - 1].subject.value);
        }
      });

    it(`should handle multiple quads with the same subject and different object and predication 
    when the subject is in a container of a pod`, async () => {
      strategy = new FragmentationStrategyShape(shapeConfig, contentOfStorage, relativePath, true);
      const quads = [
        DF.quad(
          DF.namedNode('http://localhost:3000/pods/00000000000000000267/posts/2010-09-24#2'),
          DF.namedNode('foo'),
          DF.namedNode('bar'),
        ),
        DF.quad(
          DF.namedNode('http://localhost:3000/pods/00000000000000000267/posts/2010-09-24#2'),
          DF.namedNode('foo1'),
          DF.namedNode('bar1'),
        ),
        DF.quad(
          DF.namedNode('http://localhost:3000/pods/00000000000000000267/posts/2010-09-24#2'),
          DF.namedNode('foo2'),
          DF.namedNode('bar2'),
        ),
      ];
      await strategy.fragment(streamifyArray([...quads]), sink);

      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledWith(
        sink,
        'http://localhost:3000/pods/00000000000000000267/posts_shape#Post',
        'posts',

      );

      expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenCalledWith(
        sink,
        `http://localhost:3000/pods/00000000000000000267/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
        'http://localhost:3000/pods/00000000000000000267/posts_shape#Post',
        false,
        'http://localhost:3000/pods/00000000000000000267/posts/',
      );

      expect(FragmentationStrategyShape.generateShapeIndexLocationTriple).toHaveBeenCalledTimes(1);
    });

    it(`should handle a quad inside the root of a pod bounded by shape when tripleShapeTreeLocator is false`, async () => {
      strategy = new FragmentationStrategyShape(shapeConfig, contentOfStorage, relativePath, false);
      const quads = [
        DF.quad(
          DF.namedNode('http://localhost:3000/pods/00000000000000000267/posts#1'),
          DF.namedNode('foo'),
          DF.namedNode('bar'),
        ),
      ];
      await strategy.fragment(streamifyArray([...quads]), sink);

      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledWith(
        sink,
        'http://localhost:3000/pods/00000000000000000267/posts_shape#Post',
        'posts',

      );

      expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenCalledWith(
        sink,
        `http://localhost:3000/pods/00000000000000000267/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
        'http://localhost:3000/pods/00000000000000000267/posts_shape#Post',
        true,
        'http://localhost:3000/pods/00000000000000000267/posts',
      );

      expect(FragmentationStrategyShape.generateShapeIndexLocationTriple).not.toHaveBeenCalled();
    });

    it('should handle multiples quads where some are bounded to shapes and other not', async () => {
      const quads = [
        DF.quad(
          DF.namedNode('http://localhost:3000/pods/00000000000000000267/profile/card#68732194891562'),
          DF.namedNode('foo'),
          DF.namedNode('bar'),
        ),
        DF.quad(
          DF.namedNode('http://localhost:3000/pods/00000000000000000267/posts#1'),
          DF.namedNode('foo'),
          DF.namedNode('bar'),
        ),
        DF.quad(
          DF.blankNode(),
          DF.namedNode('foo'),
          DF.namedNode('bar'),
        ),
        DF.quad(
          DF.namedNode('http://localhost:3000/pods/000000000000000002671/posts#2'),
          DF.namedNode('foo'),
          DF.namedNode('bar'),
        ),
        DF.quad(
          DF.namedNode('http://localhost:3000/pods/000000000000000002671/posts#2'),
          DF.namedNode('foo'),
          DF.namedNode('bar'),
        ),
        DF.quad(
          DF.namedNode('http://localhost:3000/pods/000000000000000002671/comments/comments#3'),
          DF.namedNode('foo'),
          DF.namedNode('bar'),
        ),
        DF.quad(
          DF.namedNode('http://localhost:3000/pods/000000000000000002671/comments/alpha#3'),
          DF.namedNode('foo'),
          DF.namedNode('bar'),
        ),
        DF.quad(
          DF.blankNode(),
          DF.namedNode('foo'),
          DF.namedNode('bar'),
        ),
        DF.quad(
          DF.namedNode('http://localhost:3000/pods/000000000000000002671/bar#3'),
          DF.namedNode('foo'),
          DF.namedNode('bar'),
        ),
        DF.quad(
          DF.namedNode('http://localhost:3000/pods/000000000000000002671/bar/foo#3'),
          DF.namedNode('foo'),
          DF.namedNode('bar'),
        ),
      ];
      await strategy.fragment(streamifyArray([...quads]), sink);

      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledTimes(4);
      expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenCalledTimes(4);
      expect(FragmentationStrategyShape.generateShapeIndexLocationTriple).toHaveBeenCalledTimes(5);

      expect(FragmentationStrategyShape.generateShape).toHaveBeenNthCalledWith(1,
        sink,
        'http://localhost:3000/pods/00000000000000000267/profile_shape#Profile',
        'profile');
      expect(FragmentationStrategyShape.generateShape).toHaveBeenNthCalledWith(2,
        sink,
        'http://localhost:3000/pods/00000000000000000267/posts_shape#Post',
        'posts');
      expect(FragmentationStrategyShape.generateShape).toHaveBeenNthCalledWith(3,
        sink,
        'http://localhost:3000/pods/000000000000000002671/posts_shape#Post',
        'posts');

      expect(FragmentationStrategyShape.generateShape).toHaveBeenNthCalledWith(4,
        sink,
        'http://localhost:3000/pods/000000000000000002671/comments_shape#Comment',
        'comments');

      expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenNthCalledWith(1,
        sink,
        `http://localhost:3000/pods/00000000000000000267/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
        'http://localhost:3000/pods/00000000000000000267/profile_shape#Profile',
        false,
        'http://localhost:3000/pods/00000000000000000267/profile/');
      expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenNthCalledWith(2,
        sink,
        `http://localhost:3000/pods/00000000000000000267/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
        'http://localhost:3000/pods/00000000000000000267/posts_shape#Post',
        true,
        'http://localhost:3000/pods/00000000000000000267/posts');
      expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenNthCalledWith(3,
        sink,
        `http://localhost:3000/pods/000000000000000002671/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
        'http://localhost:3000/pods/000000000000000002671/posts_shape#Post',
        true,
        'http://localhost:3000/pods/000000000000000002671/posts');
      expect(FragmentationStrategyShape.generateShapeIndexEntry).toHaveBeenNthCalledWith(4,
        sink,
        `http://localhost:3000/pods/000000000000000002671/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
        'http://localhost:3000/pods/000000000000000002671/comments_shape#Comment',
        false,
        'http://localhost:3000/pods/000000000000000002671/comments/');

      expect(FragmentationStrategyShape.generateShapeIndexLocationTriple).toHaveBeenNthCalledWith(1,
        sink,
        'http://localhost:3000/pods/00000000000000000267/',
        `http://localhost:3000/pods/00000000000000000267/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
        'http://localhost:3000/pods/00000000000000000267/profile/card#68732194891562');
      expect(FragmentationStrategyShape.generateShapeIndexLocationTriple).toHaveBeenNthCalledWith(2,
        sink,
        'http://localhost:3000/pods/00000000000000000267/',
        `http://localhost:3000/pods/00000000000000000267/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
        'http://localhost:3000/pods/00000000000000000267/posts#1');
      expect(FragmentationStrategyShape.generateShapeIndexLocationTriple).toHaveBeenNthCalledWith(3,
        sink,
        'http://localhost:3000/pods/000000000000000002671/',
        `http://localhost:3000/pods/000000000000000002671/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
        'http://localhost:3000/pods/000000000000000002671/posts#2');
      expect(FragmentationStrategyShape.generateShapeIndexLocationTriple).toHaveBeenNthCalledWith(4,
        sink,
        'http://localhost:3000/pods/000000000000000002671/',
        `http://localhost:3000/pods/000000000000000002671/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`,
        'http://localhost:3000/pods/000000000000000002671/comments/comments#3');
    });
  });

});
