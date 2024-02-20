import { readFileSync } from 'fs';
import { readFile } from 'fs/promises';
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

    it('should push the shape inside the sink given a shex shape path with one shape', async() => {
      (<jest.Mock>readFile).mockReturnValueOnce(
        new Promise(resolve => {
          resolve({
            toString() {
              return `
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
            },
          });
        }),
      );

      await FragmentationStrategyShape.generateShape(sink, 'http://foo.ca/', 'bar');
      expect(sink.push).toHaveBeenCalledTimes(81);
    });

    it('should reject the promise given that the shape is not valid', async() => {
      (<jest.Mock>readFile).mockReturnValueOnce(
        new Promise(resolve => {
          resolve({
            toString() {
              return `
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
                                }
                            `;
            },
          });
        }),
      );

      await expect(FragmentationStrategyShape.generateShape(sink, 'http://foo.ca/', 'bar')).rejects.toBeDefined();
      expect(sink.push).toHaveBeenCalledTimes(0);
    });
  });

  describe('generateShapetreeTriples', () => {
    const shapeTreeIRI = 'foo';
    const shapeIRI = 'bar';
    const contentIri = 'boo';

    const orderedInfoInQuad = [ shapeIRI, contentIri ];

    beforeEach(() => {
      sink = {
        push: jest.fn(),
      };
    });

    it(`should add into the sink the quad related to the type,
     the shape and the target and interpret correctly that the data is inside a container a pod`, async() => {
      const isInRootOfPod = false;
      await FragmentationStrategyShape.generateShapetreeTriples(sink,
        shapeTreeIRI,
        shapeIRI,
        isInRootOfPod,
        contentIri);

      expect(sink.push).toHaveBeenCalledTimes(2);
      const calls: any[] = sink.push.mock.calls;
      for (const [ i, call ] of calls.entries()) {
        expect(call[0]).toBe(shapeTreeIRI);
        expect((<RDF.Quad>call[1]).object.value).toBe(orderedInfoInQuad[i]);
      }

      expect((<RDF.Quad>calls[1][1]).predicate).toStrictEqual(FragmentationStrategyShape.solidInstanceContainer);
    });

    it(`should add into the sink the quad related to the type,
     the shape and the target and interpret correctly that the data is at the root of a pod`, async() => {
      const isNotInRootOfPod = true;
      await FragmentationStrategyShape.generateShapetreeTriples(sink,
        shapeTreeIRI,
        shapeIRI,
        isNotInRootOfPod,
        contentIri);

      expect(sink.push).toHaveBeenCalledTimes(2);
      const calls: any[] = sink.push.mock.calls;
      for (const [ i, call ] of calls.entries()) {
        expect(call[0]).toBe(shapeTreeIRI);
        expect((<RDF.Quad>call[1]).object.value).toBe(orderedInfoInQuad[i]);
      }

      expect((<RDF.Quad>calls[1][1]).predicate).toStrictEqual(FragmentationStrategyShape.solidInstance);
    });
  });

  describe('generateShapeTreeLocator', () => {
    const podIRI = 'foo';
    const shapeTreeIRI = 'bar';
    const iri = 'boo';

    beforeEach(() => {
      sink = {
        push: jest.fn(),
      };
    });

    it('should add a shape tree descriptor to the content iri', async() => {
      await FragmentationStrategyShape.generateShapeTreeLocator(sink, podIRI, shapeTreeIRI, iri);
      expect(sink.push).toHaveBeenCalledTimes(1);
      const call = sink.push.mock.calls;
      expect(call[0][0]).toBe(iri);
      const expectedQuad = DF.quad(
        DF.namedNode(podIRI),
        FragmentationStrategyShape.shapeTreeLocator,
        DF.namedNode(shapeTreeIRI),
      );
      expect((<RDF.Quad>call[0][1])).toStrictEqual(expectedQuad);
    });
  });

  describe('generateShapeIndexInformation', () => {
    let iriHandled: Set<string> = new Set();
    let resourceHandled: Set<string> = new Set();

    const podIRI = 'http://localhost:3000/pods/00000000000000000065';
    const shapeTreeIRI = 'boo';
    const shapePath = 'bar';

    const originalImplementationGenerateShapetreeTriples = FragmentationStrategyShape.generateShapetreeTriples;
    const originalImplementationGenerateShape = FragmentationStrategyShape.generateShape;
    const originalImplementationGenerateShapeTreeLocator = FragmentationStrategyShape.generateShapeTreeLocator;

    beforeEach(() => {
      iriHandled = new Set();
      resourceHandled = new Set();
      sink = {
        push: jest.fn(),
      };
      FragmentationStrategyShape.generateShapetreeTriples = jest.fn();
      FragmentationStrategyShape.generateShape = jest.fn();
      FragmentationStrategyShape.generateShapeTreeLocator = jest.fn();
    });

    afterAll(() => {
      FragmentationStrategyShape.generateShapetreeTriples = originalImplementationGenerateShapetreeTriples;
      FragmentationStrategyShape.generateShape = originalImplementationGenerateShape;
      FragmentationStrategyShape.generateShapeTreeLocator = originalImplementationGenerateShapeTreeLocator;
    });

    it(`should call the generateShape and the generateShapetreeTriples when the iri is in a resource in the pod.
     It should also add the iri into the resouceHandle.`, async() => {
      const iri = 'http://localhost:3000/pods/00000000000000000065/posts/2012-05-08#893353212198';
      const resourceId = 'http://localhost:3000/pods/00000000000000000065/posts';
      const folder = 'posts';

      await FragmentationStrategyShape.generateShapeIndexInformation(sink,
        iriHandled,
        resourceHandled,
        resourceId,
        iri,
        podIRI,
        shapeTreeIRI,
        folder,
        shapePath,
        false);
      expect(FragmentationStrategyShape.generateShapetreeTriples).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledTimes(1);

      expect(FragmentationStrategyShape.generateShapetreeTriples).toHaveBeenNthCalledWith(
        1,
        sink,
        shapeTreeIRI,
        `${podIRI}/${folder}_shape`,
        false,
        'http://localhost:3000/pods/00000000000000000065/posts/',
      );

      expect(iriHandled.size).toBe(1);
      expect(iriHandled.has(iri)).toBe(true);
      expect(resourceHandled.size).toBe(1);
      expect(resourceHandled.has(resourceId)).toBe(true);
    });

    it(`should call the generateShape and the generateShapetreeTriples when the iri is in the root.
     It should also add the iri into the resouceHandle.`, async() => {
      const iri = 'http://localhost:3000/pods/00000000000000000065/profile/card#me';
      const resourceId = 'http://localhost:3000/pods/00000000000000000065/profile';
      const folder = 'profile';

      await FragmentationStrategyShape.generateShapeIndexInformation(sink,
        iriHandled,
        resourceHandled,
        resourceId,
        iri,
        podIRI,
        shapeTreeIRI,
        folder,
        shapePath,
        true);
      expect(FragmentationStrategyShape.generateShapetreeTriples).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledTimes(1);

      expect(FragmentationStrategyShape.generateShapetreeTriples).toHaveBeenNthCalledWith(
        1,
        sink,
        shapeTreeIRI,
        `${podIRI}/${folder}_shape`,
        true,
        'http://localhost:3000/pods/00000000000000000065/profile',
      );

      expect(iriHandled.size).toBe(1);
      expect(iriHandled.has(iri)).toBe(true);
      expect(resourceHandled.size).toBe(1);
      expect(resourceHandled.has(resourceId)).toBe(true);
    });
  });

  describe('fragment', () => {
    let strategy: FragmentationStrategyShape;
    const shapeFolder = 'foo';
    const relativePath = undefined;
    const tripleShapeTreeLocator = true;

    const originalImplementationGenerateShapetreeTriples = FragmentationStrategyShape.generateShapetreeTriples;
    const originalImplementationGenerateShape = FragmentationStrategyShape.generateShape;
    const originalImplementationGenerateShapeTreeLocator = FragmentationStrategyShape.generateShapeTreeLocator;

    beforeEach(() => {
      sink = {
        push: jest.fn(),
      };

      (<jest.Mock>readFileSync).mockReturnValue(
        {
          toString: () => `{
            "shapes": {
                "comments": {
                    "shape": "comments.shexc",
                    "folder": "comments"
                },
                "posts": {
                    "shape": "posts.shexc",
                    "folder": "posts"
                },
                "card": {
                    "shape": "profile.shexc",
                    "folder": "profile"
                }
            }
        }`,
        },
      );

      FragmentationStrategyShape.generateShapetreeTriples = jest.fn();
      FragmentationStrategyShape.generateShape = jest.fn();
      FragmentationStrategyShape.generateShapeTreeLocator = jest.fn();

      strategy = new FragmentationStrategyShape(shapeFolder, relativePath, tripleShapeTreeLocator);
    });

    afterAll(() => {
      FragmentationStrategyShape.generateShapetreeTriples = originalImplementationGenerateShapetreeTriples;
      FragmentationStrategyShape.generateShape = originalImplementationGenerateShape;
      FragmentationStrategyShape.generateShapeTreeLocator = originalImplementationGenerateShapeTreeLocator;
    });

    it('should handle an empty stream', async() => {
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

    it('should handle a quad referring to a container in a pod bounded by a shape', async() => {
      const quads = [
        DF.quad(
          DF.namedNode('http://localhost:3000/pods/00000000000000000267/posts/2011-10-13#687194891562'),
          DF.namedNode('foo'),
          DF.namedNode('bar'),
        ),
      ];
      await strategy.fragment(streamifyArray([ ...quads ]), sink);

      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledWith(
        sink,
        'http://localhost:3000/pods/00000000000000000267/posts_shape',
        `${shapeFolder}/posts.shexc`,

      );

      expect(FragmentationStrategyShape.generateShapetreeTriples).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShapetreeTriples).toHaveBeenCalledWith(
        sink,
        'http://localhost:3000/pods/00000000000000000267/shapetree',
        'http://localhost:3000/pods/00000000000000000267/posts_shape',
        false,
        'http://localhost:3000/pods/00000000000000000267/posts/',
      );

      expect(FragmentationStrategyShape.generateShapeTreeLocator).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShapeTreeLocator).toHaveBeenCalledWith(
        sink,
        'http://localhost:3000/pods/00000000000000000267/',
        'http://localhost:3000/pods/00000000000000000267/shapetree',
        'http://localhost:3000/pods/00000000000000000267/posts/2011-10-13#687194891562',
      );
    });

    it('should handle multiple quads with one quad referring to a container in a pod bounded by a shape', async() => {
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
      await strategy.fragment(streamifyArray([ ...quads ]), sink);

      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledWith(
        sink,
        'http://localhost:3000/pods/00000000000000000267/posts_shape',
        `${shapeFolder}/posts.shexc`,

      );

      expect(FragmentationStrategyShape.generateShapetreeTriples).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShapetreeTriples).toHaveBeenCalledWith(
        sink,
        'http://localhost:3000/pods/00000000000000000267/shapetree',
        'http://localhost:3000/pods/00000000000000000267/posts_shape',
        false,
        'http://localhost:3000/pods/00000000000000000267/posts/',
      );

      expect(FragmentationStrategyShape.generateShapeTreeLocator).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShapeTreeLocator).toHaveBeenCalledWith(
        sink,
        'http://localhost:3000/pods/00000000000000000267/',
        'http://localhost:3000/pods/00000000000000000267/shapetree',
        'http://localhost:3000/pods/00000000000000000267/posts/2011-10-13#687194891562',
      );
    });

    it(`should handle one time quads with the same suject 
    when the suject link to a resource inside a container in a pod`, async() => {
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
      await strategy.fragment(streamifyArray([ ...quads ]), sink);

      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledWith(
        sink,
        'http://localhost:3000/pods/00000000000000000267/posts_shape',
        `${shapeFolder}/posts.shexc`,

      );

      expect(FragmentationStrategyShape.generateShapetreeTriples).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShapetreeTriples).toHaveBeenCalledWith(
        sink,
        'http://localhost:3000/pods/00000000000000000267/shapetree',
        'http://localhost:3000/pods/00000000000000000267/posts_shape',
        false,
        'http://localhost:3000/pods/00000000000000000267/posts/',
      );

      expect(FragmentationStrategyShape.generateShapeTreeLocator).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShapeTreeLocator).toHaveBeenCalledWith(
        sink,
        'http://localhost:3000/pods/00000000000000000267/',
        'http://localhost:3000/pods/00000000000000000267/shapetree',
        'http://localhost:3000/pods/00000000000000000267/posts/2011-10-13#687194891562',
      );
    });

    it('should handle multiple subjects when the quad subject is inside a container in the root of a pod', async() => {
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
      await strategy.fragment(streamifyArray([ ...quads ]), sink);

      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledWith(
        sink,
        'http://localhost:3000/pods/00000000000000000267/posts_shape',
        `${shapeFolder}/posts.shexc`,

      );

      expect(FragmentationStrategyShape.generateShapetreeTriples).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShapetreeTriples).toHaveBeenCalledWith(
        sink,
        'http://localhost:3000/pods/00000000000000000267/shapetree',
        'http://localhost:3000/pods/00000000000000000267/posts_shape',
        false,
        'http://localhost:3000/pods/00000000000000000267/posts/',
      );

      expect(FragmentationStrategyShape.generateShapeTreeLocator).toHaveBeenCalledTimes(3);
      for (let i = 1; i < quads.length + 1; i++) {
        expect(FragmentationStrategyShape.generateShapeTreeLocator).toHaveBeenNthCalledWith(i,
          sink,
          'http://localhost:3000/pods/00000000000000000267/',
          'http://localhost:3000/pods/00000000000000000267/shapetree',
          quads[i - 1].subject.value);
      }
    });

    it(`should handle a quad given that the quad is inside a container in a pod bounded by shape
     when tripleShapeTreeLocator is false`, async() => {
      strategy = new FragmentationStrategyShape(shapeFolder, relativePath, false);
      const quads = [
        DF.quad(
          DF.namedNode('http://localhost:3000/pods/00000000000000000267/posts/2011-10-13#687194891562'),
          DF.namedNode('foo'),
          DF.namedNode('bar'),
        ),
      ];
      await strategy.fragment(streamifyArray([ ...quads ]), sink);

      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledWith(
        sink,
        'http://localhost:3000/pods/00000000000000000267/posts_shape',
        `${shapeFolder}/posts.shexc`,

      );

      expect(FragmentationStrategyShape.generateShapetreeTriples).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShapetreeTriples).toHaveBeenCalledWith(
        sink,
        'http://localhost:3000/pods/00000000000000000267/shapetree',
        'http://localhost:3000/pods/00000000000000000267/posts_shape',
        false,
        'http://localhost:3000/pods/00000000000000000267/posts/',
      );

      expect(FragmentationStrategyShape.generateShapeTreeLocator).not.toHaveBeenCalled();
    });

    it('should handle a quad referring to resource in the root of a pod bounded by a shape', async() => {
      const quads = [
        DF.quad(
          DF.namedNode('http://localhost:3000/pods/00000000000000000267/posts#1'),
          DF.namedNode('foo'),
          DF.namedNode('bar'),
        ),
      ];
      await strategy.fragment(streamifyArray([ ...quads ]), sink);

      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledWith(
        sink,
        'http://localhost:3000/pods/00000000000000000267/posts_shape',
        `${shapeFolder}/posts.shexc`,

      );

      expect(FragmentationStrategyShape.generateShapetreeTriples).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShapetreeTriples).toHaveBeenCalledWith(
        sink,
        'http://localhost:3000/pods/00000000000000000267/shapetree',
        'http://localhost:3000/pods/00000000000000000267/posts_shape',
        true,
        'http://localhost:3000/pods/00000000000000000267/posts',
      );

      expect(FragmentationStrategyShape.generateShapeTreeLocator).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShapeTreeLocator).toHaveBeenCalledWith(
        sink,
        'http://localhost:3000/pods/00000000000000000267/',
        'http://localhost:3000/pods/00000000000000000267/shapetree',
        'http://localhost:3000/pods/00000000000000000267/posts#1',
      );
    });

    it(`should handle multiple quads with one quad referring to resource in the root of a pod bounded by a shape`,
      async() => {
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
        await strategy.fragment(streamifyArray([ ...quads ]), sink);

        expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledTimes(1);
        expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledWith(
          sink,
          'http://localhost:3000/pods/00000000000000000267/posts_shape',
          `${shapeFolder}/posts.shexc`,

        );

        expect(FragmentationStrategyShape.generateShapetreeTriples).toHaveBeenCalledTimes(1);
        expect(FragmentationStrategyShape.generateShapetreeTriples).toHaveBeenCalledWith(
          sink,
          'http://localhost:3000/pods/00000000000000000267/shapetree',
          'http://localhost:3000/pods/00000000000000000267/posts_shape',
          true,
          'http://localhost:3000/pods/00000000000000000267/posts',
        );

        expect(FragmentationStrategyShape.generateShapeTreeLocator).toHaveBeenCalledTimes(1);
        expect(FragmentationStrategyShape.generateShapeTreeLocator).toHaveBeenCalledWith(
          sink,
          'http://localhost:3000/pods/00000000000000000267/',
          'http://localhost:3000/pods/00000000000000000267/shapetree',
          'http://localhost:3000/pods/00000000000000000267/posts#1',
        );
      });

    it('should handle multiple quads refering to resource in the root of a pod root bounded by a shape',
      async() => {
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
        await strategy.fragment(streamifyArray([ ...quads ]), sink);

        expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledTimes(1);
        expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledWith(
          sink,
          'http://localhost:3000/pods/00000000000000000267/posts_shape',
          `${shapeFolder}/posts.shexc`,

        );

        expect(FragmentationStrategyShape.generateShapetreeTriples).toHaveBeenCalledTimes(1);
        expect(FragmentationStrategyShape.generateShapetreeTriples).toHaveBeenCalledWith(
          sink,
          'http://localhost:3000/pods/00000000000000000267/shapetree',
          'http://localhost:3000/pods/00000000000000000267/posts_shape',
          true,
          'http://localhost:3000/pods/00000000000000000267/posts',
        );

        expect(FragmentationStrategyShape.generateShapeTreeLocator).toHaveBeenCalledTimes(2);

        for (let i = 1; i < quads.length + 1; i++) {
          expect(FragmentationStrategyShape.generateShapeTreeLocator).toHaveBeenNthCalledWith(i,
            sink,
            'http://localhost:3000/pods/00000000000000000267/',
            'http://localhost:3000/pods/00000000000000000267/shapetree',
            quads[i - 1].subject.value);
        }
      });

    it('should handle multiple quads refering to resource in multiple pod roots that are bounded by a shape',
      async() => {
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
        await strategy.fragment(streamifyArray([ ...quads ]), sink);

        expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledTimes(2);
        expect(FragmentationStrategyShape.generateShapetreeTriples).toHaveBeenCalledTimes(2);
        expect(FragmentationStrategyShape.generateShapeTreeLocator).toHaveBeenCalledTimes(2);

        for (let i = 1; i < quads.length + 1; i++) {
          expect(FragmentationStrategyShape.generateShape).toHaveBeenNthCalledWith(i,
            sink,
            `${pods[i - 1]}/posts_shape`,
            `${shapeFolder}/posts.shexc`);
          expect(FragmentationStrategyShape.generateShapetreeTriples).toHaveBeenNthCalledWith(i,
            sink,
            `${pods[i - 1]}/shapetree`,
            `${pods[i - 1]}/posts_shape`,
            true,
            `${pods[i - 1]}/posts`);
          expect(FragmentationStrategyShape.generateShapeTreeLocator).toHaveBeenNthCalledWith(i,
            sink,
            `${pods[i - 1]}/`,
            `${pods[i - 1]}/shapetree`,
            quads[i - 1].subject.value);
        }
      });

    it(`should handle a quad given that the quad is inside the root of a pod bounded by shape
     when tripleShapeTreeLocator is false`, async() => {
      strategy = new FragmentationStrategyShape(shapeFolder, relativePath, false);
      const quads = [
        DF.quad(
          DF.namedNode('http://localhost:3000/pods/00000000000000000267/posts#1'),
          DF.namedNode('foo'),
          DF.namedNode('bar'),
        ),
      ];
      await strategy.fragment(streamifyArray([ ...quads ]), sink);

      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledWith(
        sink,
        'http://localhost:3000/pods/00000000000000000267/posts_shape',
        `${shapeFolder}/posts.shexc`,

      );

      expect(FragmentationStrategyShape.generateShapetreeTriples).toHaveBeenCalledTimes(1);
      expect(FragmentationStrategyShape.generateShapetreeTriples).toHaveBeenCalledWith(
        sink,
        'http://localhost:3000/pods/00000000000000000267/shapetree',
        'http://localhost:3000/pods/00000000000000000267/posts_shape',
        true,
        'http://localhost:3000/pods/00000000000000000267/posts',
      );

      expect(FragmentationStrategyShape.generateShapeTreeLocator).not.toHaveBeenCalled();
    });

    it('should handle multiples quads where some are bounded to shapes and other not', async() => {
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
      await strategy.fragment(streamifyArray([ ...quads ]), sink);

      expect(FragmentationStrategyShape.generateShape).toHaveBeenCalledTimes(4);
      expect(FragmentationStrategyShape.generateShapetreeTriples).toHaveBeenCalledTimes(4);
      expect(FragmentationStrategyShape.generateShapeTreeLocator).toHaveBeenCalledTimes(5);

      expect(FragmentationStrategyShape.generateShape).toHaveBeenNthCalledWith(1,
        sink,
        'http://localhost:3000/pods/00000000000000000267/profile_shape',
        `${shapeFolder}/profile.shexc`);
      expect(FragmentationStrategyShape.generateShape).toHaveBeenNthCalledWith(2,
        sink,
        'http://localhost:3000/pods/00000000000000000267/posts_shape',
        `${shapeFolder}/posts.shexc`);
      expect(FragmentationStrategyShape.generateShape).toHaveBeenNthCalledWith(3,
        sink,
        'http://localhost:3000/pods/000000000000000002671/posts_shape',
        `${shapeFolder}/posts.shexc`);

      expect(FragmentationStrategyShape.generateShape).toHaveBeenNthCalledWith(4,
        sink,
        'http://localhost:3000/pods/000000000000000002671/comments_shape',
        `${shapeFolder}/comments.shexc`);

      expect(FragmentationStrategyShape.generateShapetreeTriples).toHaveBeenNthCalledWith(1,
        sink,
        'http://localhost:3000/pods/00000000000000000267/shapetree',
        'http://localhost:3000/pods/00000000000000000267/profile_shape',
        false,
        'http://localhost:3000/pods/00000000000000000267/profile/');
      expect(FragmentationStrategyShape.generateShapetreeTriples).toHaveBeenNthCalledWith(2,
        sink,
        'http://localhost:3000/pods/00000000000000000267/shapetree',
        'http://localhost:3000/pods/00000000000000000267/posts_shape',
        true,
        'http://localhost:3000/pods/00000000000000000267/posts');
      expect(FragmentationStrategyShape.generateShapetreeTriples).toHaveBeenNthCalledWith(3,
        sink,
        'http://localhost:3000/pods/000000000000000002671/shapetree',
        'http://localhost:3000/pods/000000000000000002671/posts_shape',
        true,
        'http://localhost:3000/pods/000000000000000002671/posts');
      expect(FragmentationStrategyShape.generateShapetreeTriples).toHaveBeenNthCalledWith(4,
        sink,
        'http://localhost:3000/pods/000000000000000002671/shapetree',
        'http://localhost:3000/pods/000000000000000002671/comments_shape',
        false,
        'http://localhost:3000/pods/000000000000000002671/comments/');

      expect(FragmentationStrategyShape.generateShapeTreeLocator).toHaveBeenNthCalledWith(1,
        sink,
        'http://localhost:3000/pods/00000000000000000267/',
        'http://localhost:3000/pods/00000000000000000267/shapetree',
        'http://localhost:3000/pods/00000000000000000267/profile/card#68732194891562');
      expect(FragmentationStrategyShape.generateShapeTreeLocator).toHaveBeenNthCalledWith(2,
        sink,
        'http://localhost:3000/pods/00000000000000000267/',
        'http://localhost:3000/pods/00000000000000000267/shapetree',
        'http://localhost:3000/pods/00000000000000000267/posts#1');
      expect(FragmentationStrategyShape.generateShapeTreeLocator).toHaveBeenNthCalledWith(3,
        sink,
        'http://localhost:3000/pods/000000000000000002671/',
        'http://localhost:3000/pods/000000000000000002671/shapetree',
        'http://localhost:3000/pods/000000000000000002671/posts#2');
      expect(FragmentationStrategyShape.generateShapeTreeLocator).toHaveBeenNthCalledWith(4,
        sink,
        'http://localhost:3000/pods/000000000000000002671/',
        'http://localhost:3000/pods/000000000000000002671/shapetree',
        'http://localhost:3000/pods/000000000000000002671/comments/comments#3');
    });
  });
});
