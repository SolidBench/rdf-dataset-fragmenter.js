import { DataFactory } from 'rdf-data-factory';
import {
  QuadTransformerRemapResourceIdentifier,
} from '../../../lib/transform/QuadTransformerRemapResourceIdentifier';

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
        expect(transformer.buffer).toEqual({
          'ex:s': {
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
          transformer.buffer['ex:s'] = {
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

          expect(transformer.buffer).toEqual({
            'ex:s': {
              id: '123',
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

        it('should throw on non-literal id', async() => {
          expect(() => transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/id'),
            DF.namedNode('123'),
          ))).toThrowError(`Expected identifier value of type Literal on resource 'ex:s'`);
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

          expect(transformer.buffer).toEqual({
            'ex:s': {
              creator: DF.namedNode('ex:c'),
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

          expect(transformer.buffer).toEqual({
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

          expect(transformer.buffer).toEqual({});
          expect(transformer.subjectMapping).toEqual({
            'ex:s': DF.namedNode('ex:c#Post123'),
          });
        });

        it('should throw on end', async() => {
          expect(() => transformer.end()).toThrowError(`Detected non-finalized resources in the buffer: ex:s`);
        });
      });

      describe('for defined subject mapping', () => {
        beforeEach(() => {
          transformer.subjectMapping['ex:s'] = DF.namedNode('ex:c#Post123');
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
          expect(transformer.buffer).toEqual({});
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
          expect(transformer.buffer).toEqual({});
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
          expect(transformer.buffer).toEqual({});
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

          expect(transformer.buffer).toEqual({});
          expect(transformer.subjectMapping).toEqual({
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

          expect(transformer.buffer).toEqual({});
          expect(transformer.subjectMapping).toEqual({
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

          expect(transformer.buffer).toEqual({});
          expect(transformer.subjectMapping).toEqual({
            'ex:s': DF.namedNode('ex:c#Post123'),
          });
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
});
