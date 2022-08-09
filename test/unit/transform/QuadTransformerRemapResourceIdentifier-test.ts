import { DataFactory } from 'rdf-data-factory';
import {
  QuadTransformerRemapResourceIdentifier,
} from '../../../lib/transform/QuadTransformerRemapResourceIdentifier';
import { ValueModifierRegexReplaceGroup } from '../../../lib/transform/value/ValueModifierRegexReplaceGroup';

const DF = new DataFactory();

describe('QuadTransformerRemapResourceIdentifier', () => {
  let transformer: QuadTransformerRemapResourceIdentifier;

  describe('for a fragment-based identifier separator', () => {
    beforeEach(() => {
      transformer = new QuadTransformerRemapResourceIdentifier(
        '#Post',
        'vocabulary/Post$',
        'vocabulary/id$',
        'vocabulary/hasCreator$',
        undefined,
        false,
      );
    });

    describe('transform', () => {
      it('should not modify non-applicable terms', async() => {
        expect(transformer.transform(DF.quad(
          DF.namedNode('http://something.ldbc.eu/a.ttl'),
          DF.namedNode('ex:p'),
          DF.literal('o'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('http://something.ldbc.eu/a.ttl'),
            DF.namedNode('ex:p'),
            DF.literal('o'),
          ),
        ]);
      });

      it('should buffer applicable types', async() => {
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('ex:vocabulary/Post'),
        ))).toEqual([]);
        expect(transformer.resourceIdentifier.buffer).toEqual({
          'ex:s': {
            type: DF.namedNode('ex:vocabulary/Post'),
            quads: [
              DF.quad(
                DF.namedNode('ex:s'),
                DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
                DF.namedNode('ex:vocabulary/Post'),
              ),
            ],
          },
        });
      });

      describe('for buffer entry initialized', () => {
        beforeEach(() => {
          transformer.resourceIdentifier.buffer['ex:s'] = {
            type: <any> undefined,
            quads: [
              DF.quad(
                DF.namedNode('ex:s'),
                DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
                DF.namedNode('ex:vocabulary/Post'),
              ),
            ],
          };
        });

        it('should not modify non-applicable terms', async() => {
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s2'),
            DF.namedNode('ex:p'),
            DF.literal('o'),
          ))).toEqual([
            DF.quad(
              DF.namedNode('ex:s2'),
              DF.namedNode('ex:p'),
              DF.literal('o'),
            ),
          ]);
        });

        it('should buffer the id', async() => {
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ))).toEqual([]);

          expect(transformer.resourceIdentifier.buffer).toEqual({
            'ex:s': {
              id: DF.literal('123'),
              quads: [
                DF.quad(
                  DF.namedNode('ex:s'),
                  DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
                  DF.namedNode('ex:vocabulary/Post'),
                ),
                DF.quad(
                  DF.namedNode('ex:s'),
                  DF.namedNode('ex:vocabulary/id'),
                  DF.literal('123'),
                ),
              ],
            },
          });
        });

        it('should buffer the id with a value transformer', async() => {
          transformer = new QuadTransformerRemapResourceIdentifier(
            '#Post',
            'vocabulary/Post$',
            'vocabulary/id$',
            'vocabulary/hasCreator$',
            () => DF.literal('TRANSFORMED'),
            false,
          );
          transformer.resourceIdentifier.buffer['ex:s'] = {
            type: <any> undefined,
            quads: [
              DF.quad(
                DF.namedNode('ex:s'),
                DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
                DF.namedNode('ex:vocabulary/Post'),
              ),
            ],
          };

          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ))).toEqual([]);

          expect(transformer.resourceIdentifier.buffer).toEqual({
            'ex:s': {
              id: DF.literal('TRANSFORMED'),
              quads: [
                DF.quad(
                  DF.namedNode('ex:s'),
                  DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
                  DF.namedNode('ex:vocabulary/Post'),
                ),
                DF.quad(
                  DF.namedNode('ex:s'),
                  DF.namedNode('ex:vocabulary/id'),
                  DF.literal('123'),
                ),
              ],
            },
          });
        });

        it('should throw on duplicate ids', async() => {
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ))).toEqual([]);
          expect(() => transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ))).toThrowError(`Illegal overwrite of identifier value on resource 'ex:s'`);
        });

        it('should buffer the creator', async() => {
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('ex:c'),
          ))).toEqual([]);

          expect(transformer.resourceIdentifier.buffer).toEqual({
            'ex:s': {
              target: DF.namedNode('ex:c'),
              quads: [
                DF.quad(
                  DF.namedNode('ex:s'),
                  DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
                  DF.namedNode('ex:vocabulary/Post'),
                ),
                DF.quad(
                  DF.namedNode('ex:s'),
                  DF.namedNode('ex:vocabulary/hasCreator'),
                  DF.namedNode('ex:c'),
                ),
              ],
            },
          });
        });

        it('should throw on non-named-node creator', async() => {
          expect(() => transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.literal('ex:c'),
          ))).toThrowError(`Expected target value of type NamedNode on resource 'ex:s'`);
        });

        it('should throw on duplicate creators', async() => {
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('ex:c'),
          ))).toEqual([]);
          expect(() => transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('ex:c'),
          ))).toThrowError(`Illegal overwrite of target value on resource 'ex:s'`);
        });

        it('should buffer other triples with the given subject', async() => {
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/something'),
            DF.namedNode('ex:c'),
          ))).toEqual([]);

          expect(transformer.resourceIdentifier.buffer).toEqual({
            'ex:s': {
              quads: [
                DF.quad(
                  DF.namedNode('ex:s'),
                  DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
                  DF.namedNode('ex:vocabulary/Post'),
                ),
                DF.quad(
                  DF.namedNode('ex:s'),
                  DF.namedNode('ex:vocabulary/something'),
                  DF.namedNode('ex:c'),
                ),
              ],
            },
          });
        });

        it('should emit once id and creator are set', async() => {
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ))).toEqual([]);
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('ex:c'),
          ))).toEqual([
            DF.quad(
              DF.namedNode('ex:c#Post123'),
              DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
              DF.namedNode('ex:vocabulary/Post'),
            ),
            DF.quad(
              DF.namedNode('ex:c#Post123'),
              DF.namedNode('ex:vocabulary/id'),
              DF.literal('123'),
            ),
            DF.quad(
              DF.namedNode('ex:c#Post123'),
              DF.namedNode('ex:vocabulary/hasCreator'),
              DF.namedNode('ex:c'),
            ),
          ]);

          expect(transformer.resourceIdentifier.buffer).toEqual({});
          expect(transformer.resourceIdentifier.resourceMapping).toEqual({
            'ex:s': DF.namedNode('ex:c#Post123'),
          });
        });

        it('should throw on end', async() => {
          expect(() => transformer.end()).toThrowError(`Detected non-finalized resources in the buffer: ex:s`);
        });
      });

      describe('for defined subject mapping', () => {
        beforeEach(() => {
          transformer.resourceIdentifier.resourceMapping['ex:s'] = DF.namedNode('ex:c#Post123');
        });

        it('should not modify non-applicable terms', async() => {
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s2'),
            DF.namedNode('ex:p'),
            DF.literal('o'),
          ))).toEqual([
            DF.quad(
              DF.namedNode('ex:s2'),
              DF.namedNode('ex:p'),
              DF.literal('o'),
            ),
          ]);
          expect(transformer.resourceIdentifier.buffer).toEqual({});
        });

        it('should modify applicable subjects', async() => {
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:p'),
            DF.literal('o'),
          ))).toEqual([
            DF.quad(
              DF.namedNode('ex:c#Post123'),
              DF.namedNode('ex:p'),
              DF.literal('o'),
            ),
          ]);
          expect(transformer.resourceIdentifier.buffer).toEqual({});
        });

        it('should modify applicable objects', async() => {
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s_other'),
            DF.namedNode('ex:p'),
            DF.namedNode('ex:s'),
          ))).toEqual([
            DF.quad(
              DF.namedNode('ex:s_other'),
              DF.namedNode('ex:p'),
              DF.namedNode('ex:c#Post123'),
            ),
          ]);
          expect(transformer.resourceIdentifier.buffer).toEqual({});
        });

        it('should modify applicable subjects and objects', async() => {
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:p'),
            DF.namedNode('ex:s'),
          ))).toEqual([
            DF.quad(
              DF.namedNode('ex:c#Post123'),
              DF.namedNode('ex:p'),
              DF.namedNode('ex:c#Post123'),
            ),
          ]);
          expect(transformer.resourceIdentifier.buffer).toEqual({});
        });

        it('should modify applicable subjects even if it would match the type', async() => {
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ))).toEqual([
            DF.quad(
              DF.namedNode('ex:c#Post123'),
              DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
              DF.namedNode('ex:vocabulary/Post'),
            ),
          ]);
          expect(transformer.resourceIdentifier.buffer).toEqual({});
        });

        it('should not throw on end', async() => {
          expect(() => transformer.end()).not.toThrow();
        });
      });

      describe('processing of a full resource', () => {
        it('without other props before resource complete', async() => {
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ))).toEqual([]);
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ))).toEqual([]);
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('ex:c'),
          ))).toEqual([
            DF.quad(
              DF.namedNode('ex:c#Post123'),
              DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
              DF.namedNode('ex:vocabulary/Post'),
            ),
            DF.quad(
              DF.namedNode('ex:c#Post123'),
              DF.namedNode('ex:vocabulary/id'),
              DF.literal('123'),
            ),
            DF.quad(
              DF.namedNode('ex:c#Post123'),
              DF.namedNode('ex:vocabulary/hasCreator'),
              DF.namedNode('ex:c'),
            ),
          ]);

          expect(transformer.resourceIdentifier.buffer).toEqual({});
          expect(transformer.resourceIdentifier.resourceMapping).toEqual({
            'ex:s': DF.namedNode('ex:c#Post123'),
          });
        });

        it('with other props before resource complete', async() => {
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ))).toEqual([]);
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ))).toEqual([]);
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/something'),
            DF.namedNode('ex:c'),
          ))).toEqual([]);
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('ex:c'),
          ))).toEqual([
            DF.quad(
              DF.namedNode('ex:c#Post123'),
              DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
              DF.namedNode('ex:vocabulary/Post'),
            ),
            DF.quad(
              DF.namedNode('ex:c#Post123'),
              DF.namedNode('ex:vocabulary/id'),
              DF.literal('123'),
            ),
            DF.quad(
              DF.namedNode('ex:c#Post123'),
              DF.namedNode('ex:vocabulary/something'),
              DF.namedNode('ex:c'),
            ),
            DF.quad(
              DF.namedNode('ex:c#Post123'),
              DF.namedNode('ex:vocabulary/hasCreator'),
              DF.namedNode('ex:c'),
            ),
          ]);

          expect(transformer.resourceIdentifier.buffer).toEqual({});
          expect(transformer.resourceIdentifier.resourceMapping).toEqual({
            'ex:s': DF.namedNode('ex:c#Post123'),
          });
        });

        it('with other props after resource complete', async() => {
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ))).toEqual([]);
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ))).toEqual([]);
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('ex:c'),
          ))).toEqual([
            DF.quad(
              DF.namedNode('ex:c#Post123'),
              DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
              DF.namedNode('ex:vocabulary/Post'),
            ),
            DF.quad(
              DF.namedNode('ex:c#Post123'),
              DF.namedNode('ex:vocabulary/id'),
              DF.literal('123'),
            ),
            DF.quad(
              DF.namedNode('ex:c#Post123'),
              DF.namedNode('ex:vocabulary/hasCreator'),
              DF.namedNode('ex:c'),
            ),
          ]);
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/something'),
            DF.namedNode('ex:c'),
          ))).toEqual([
            DF.quad(
              DF.namedNode('ex:c#Post123'),
              DF.namedNode('ex:vocabulary/something'),
              DF.namedNode('ex:c'),
            ),
          ]);

          expect(transformer.resourceIdentifier.buffer).toEqual({});
          expect(transformer.resourceIdentifier.resourceMapping).toEqual({
            'ex:s': DF.namedNode('ex:c#Post123'),
          });
        });

        it('when only allowing the subject component', async() => {
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ), 'subject')).toEqual([]);
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ), 'subject')).toEqual([]);
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('ex:c'),
          ), 'subject')).toEqual([
            DF.quad(
              DF.namedNode('ex:c#Post123'),
              DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
              DF.namedNode('ex:vocabulary/Post'),
            ),
            DF.quad(
              DF.namedNode('ex:c#Post123'),
              DF.namedNode('ex:vocabulary/id'),
              DF.literal('123'),
            ),
            DF.quad(
              DF.namedNode('ex:c#Post123'),
              DF.namedNode('ex:vocabulary/hasCreator'),
              DF.namedNode('ex:c'),
            ),
          ]);

          expect(transformer.resourceIdentifier.buffer).toEqual({});
          expect(transformer.resourceIdentifier.resourceMapping).toEqual({
            'ex:s': DF.namedNode('ex:c#Post123'),
          });

          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:other'),
            DF.namedNode('ex:p'),
            DF.namedNode('ex:s'),
          ), 'subject')).toEqual([
            DF.quad(
              DF.namedNode('ex:other'),
              DF.namedNode('ex:p'),
              DF.namedNode('ex:s'),
            ),
          ]);
        });

        it('when only allowing the object component', async() => {
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ), 'object')).toEqual([
            DF.quad(
              DF.namedNode('ex:s'),
              DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
              DF.namedNode('ex:vocabulary/Post'),
            ),
          ]);
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ), 'object')).toEqual([
            DF.quad(
              DF.namedNode('ex:s'),
              DF.namedNode('ex:vocabulary/id'),
              DF.literal('123'),
            ),
          ]);
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('ex:c'),
          ), 'object')).toEqual([
            DF.quad(
              DF.namedNode('ex:s'),
              DF.namedNode('ex:vocabulary/hasCreator'),
              DF.namedNode('ex:c'),
            ),
          ]);

          expect(transformer.resourceIdentifier.buffer).toEqual({});
          expect(transformer.resourceIdentifier.resourceMapping).toEqual({});
        });
      });
    });
  });

  describe('for a relative identifier separator', () => {
    beforeEach(() => {
      transformer = new QuadTransformerRemapResourceIdentifier(
        '../posts/',
        'vocabulary/Post$',
        'vocabulary/id$',
        'vocabulary/hasCreator$',
        undefined,
        false,
      );
    });

    describe('transform', () => {
      it('should handle applicable resources', async() => {
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('ex:vocabulary/Post'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s'),
          DF.namedNode('ex:vocabulary/id'),
          DF.literal('123'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s'),
          DF.namedNode('ex:vocabulary/hasCreator'),
          DF.namedNode('http://example.org/pods/bob/profile/card#me'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/123'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/123'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/123'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('http://example.org/pods/bob/profile/card#me'),
          ),
        ]);
      });
    });
  });

  describe('that keeps subject fragments', () => {
    beforeEach(() => {
      transformer = new QuadTransformerRemapResourceIdentifier(
        '../posts/',
        'vocabulary/Post$',
        'vocabulary/id$',
        'vocabulary/hasCreator$',
        undefined,
        true,
      );
    });

    describe('transform', () => {
      it('should handle applicable resources', async() => {
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('ex:vocabulary/Post'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/id'),
          DF.literal('123'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/hasCreator'),
          DF.namedNode('http://example.org/pods/bob/profile/card#me'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/123#abc'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/123#abc'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/123#abc'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('http://example.org/pods/bob/profile/card#me'),
          ),
        ]);
      });
    });
  });

  describe('for an isLocatedIn fragmentation', () => {
    beforeEach(() => {
      transformer = new QuadTransformerRemapResourceIdentifier(
        '../posts/',
        'vocabulary/Post$',
        'vocabulary/isLocatedIn$',
        'vocabulary/hasCreator$',
        new ValueModifierRegexReplaceGroup('^.*/([^/]*)$'),
        true,
      );
    });

    describe('transform', () => {
      it('should handle applicable resources', async() => {
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('ex:vocabulary/Post'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/id'),
          DF.literal('123'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/isLocatedIn'),
          DF.namedNode('http://dbpedia.org/resource/India'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/hasCreator'),
          DF.namedNode('http://example.org/pods/bob/profile/card#me'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#abc'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#abc'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#abc'),
            DF.namedNode('ex:vocabulary/isLocatedIn'),
            DF.namedNode('http://dbpedia.org/resource/India'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#abc'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('http://example.org/pods/bob/profile/card#me'),
          ),
        ]);
      });

      it('should handle a related triple afterwards', async() => {
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('ex:vocabulary/Post'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/id'),
          DF.literal('123'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/isLocatedIn'),
          DF.namedNode('http://dbpedia.org/resource/India'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/hasCreator'),
          DF.namedNode('http://example.org/pods/bob/profile/card#me'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#abc'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#abc'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#abc'),
            DF.namedNode('ex:vocabulary/isLocatedIn'),
            DF.namedNode('http://dbpedia.org/resource/India'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#abc'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('http://example.org/pods/bob/profile/card#me'),
          ),
        ]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:fora#forum1'),
          DF.namedNode('ex:vocabulary/containerOf'),
          DF.namedNode('ex:s#abc'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('ex:fora#forum1'),
            DF.namedNode('ex:vocabulary/containerOf'),
            DF.namedNode('http://example.org/pods/bob/posts/India#abc'),
          ),
        ]);
      });

      it('should handle an intermediary related triple', async() => {
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('ex:vocabulary/Post'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/id'),
          DF.literal('123'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/isLocatedIn'),
          DF.namedNode('http://dbpedia.org/resource/India'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:fora#forum1'),
          DF.namedNode('ex:vocabulary/containerOf'),
          DF.namedNode('ex:s#abc'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/hasCreator'),
          DF.namedNode('http://example.org/pods/bob/profile/card#me'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#abc'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#abc'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#abc'),
            DF.namedNode('ex:vocabulary/isLocatedIn'),
            DF.namedNode('http://dbpedia.org/resource/India'),
          ),
          DF.quad(
            DF.namedNode('ex:fora#forum1'),
            DF.namedNode('ex:vocabulary/containerOf'),
            DF.namedNode('http://example.org/pods/bob/posts/India#abc'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#abc'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('http://example.org/pods/bob/profile/card#me'),
          ),
        ]);
      });

      it('should handle transformation of subject and object', async() => {
        // Handle the first resource
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('ex:vocabulary/Post'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/id'),
          DF.literal('123'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/isLocatedIn'),
          DF.namedNode('http://dbpedia.org/resource/India'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/hasCreator'),
          DF.namedNode('http://example.org/pods/bob/profile/card#me'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#abc'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#abc'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#abc'),
            DF.namedNode('ex:vocabulary/isLocatedIn'),
            DF.namedNode('http://dbpedia.org/resource/India'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#abc'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('http://example.org/pods/bob/profile/card#me'),
          ),
        ]);

        // Handle the second resource, that also links to the first one
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#def'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('ex:vocabulary/Post'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#def'),
          DF.namedNode('ex:vocabulary/id'),
          DF.literal('456'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#def'),
          DF.namedNode('ex:vocabulary/isLocatedIn'),
          DF.namedNode('http://dbpedia.org/resource/India'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#def'),
          DF.namedNode('ex:vocabulary/replyOf'),
          DF.namedNode('ex:s#abc'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#def'),
          DF.namedNode('ex:vocabulary/hasCreator'),
          DF.namedNode('http://example.org/pods/bob/profile/card#me'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#def'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#def'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('456'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#def'),
            DF.namedNode('ex:vocabulary/isLocatedIn'),
            DF.namedNode('http://dbpedia.org/resource/India'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#def'),
            DF.namedNode('ex:vocabulary/replyOf'),
            DF.namedNode('http://example.org/pods/bob/posts/India#abc'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#def'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('http://example.org/pods/bob/profile/card#me'),
          ),
        ]);
      });

      it('should handle transformation of subject and objec in reverse', async() => {
        // Handle the first resource
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('ex:vocabulary/Post'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/id'),
          DF.literal('123'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/isLocatedIn'),
          DF.namedNode('http://dbpedia.org/resource/India'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/hasCreator'),
          DF.namedNode('http://example.org/pods/bob/profile/card#me'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#abc'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#abc'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#abc'),
            DF.namedNode('ex:vocabulary/isLocatedIn'),
            DF.namedNode('http://dbpedia.org/resource/India'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#abc'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('http://example.org/pods/bob/profile/card#me'),
          ),
        ]);

        // Handle the second resource, that also links to the first one
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#def'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('ex:vocabulary/Post'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#def'),
          DF.namedNode('ex:vocabulary/id'),
          DF.literal('456'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#def'),
          DF.namedNode('ex:vocabulary/isLocatedIn'),
          DF.namedNode('http://dbpedia.org/resource/India'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/replyOf'),
          DF.namedNode('ex:s#def'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#def'),
          DF.namedNode('ex:vocabulary/hasCreator'),
          DF.namedNode('http://example.org/pods/bob/profile/card#me'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#def'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#def'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('456'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#def'),
            DF.namedNode('ex:vocabulary/isLocatedIn'),
            DF.namedNode('http://dbpedia.org/resource/India'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#abc'),
            DF.namedNode('ex:vocabulary/replyOf'),
            DF.namedNode('http://example.org/pods/bob/posts/India#def'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#def'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('http://example.org/pods/bob/profile/card#me'),
          ),
        ]);
      });
    });
  });
});
