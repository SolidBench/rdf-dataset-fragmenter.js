import { DataFactory } from 'rdf-data-factory';
import { QuadMatcherPredicate } from '../../../lib/quadmatcher/QuadMatcherPredicate';
import type { IQuadTransformer } from '../../../lib/transform/IQuadTransformer';
import { QuadTransformerAppendQuad } from '../../../lib/transform/QuadTransformerAppendQuad';
import { QuadTransformerDistinct } from '../../../lib/transform/QuadTransformerDistinct';
import { TermTemplateStaticNamedNode } from '../../../lib/transform/termtemplate/TermTemplateStaticNamedNode';

const DF = new DataFactory();

describe('QuadTransformerDistinct', () => {
  let transformer: IQuadTransformer;

  describe('over a cloning transformer', () => {
    beforeEach(() => {
      transformer = new QuadTransformerDistinct(new QuadTransformerAppendQuad(
        new QuadMatcherPredicate('ex:p'),
        new TermTemplateStaticNamedNode('ex:s2'),
        new TermTemplateStaticNamedNode('ex:p2'),
        new TermTemplateStaticNamedNode('ex:o2'),
        new TermTemplateStaticNamedNode('ex:g2'),
      ));
    });

    describe('transform', () => {
      it('does not emit duplicates', async() => {
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s'),
          DF.namedNode('ex:p'),
          DF.literal('o'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:p'),
            DF.literal('o'),
          ),
          DF.quad(
            DF.namedNode('ex:s2'),
            DF.namedNode('ex:p2'),
            DF.namedNode('ex:o2'),
            DF.namedNode('ex:g2'),
          ),
        ]);

        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s'),
          DF.namedNode('ex:p'),
          DF.literal('o'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:p'),
            DF.literal('o'),
          ),
        ]);
      });

      it('does not emit duplicates while taking into account allowedComponent', async() => {
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s'),
          DF.namedNode('ex:p'),
          DF.literal('o'),
        ), 'subject')).toEqual([
          DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:p'),
            DF.literal('o'),
          ),
          DF.quad(
            DF.namedNode('ex:s2'),
            DF.namedNode('ex:p2'),
            DF.namedNode('ex:o2'),
            DF.namedNode('ex:g2'),
          ),
        ]);

        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s'),
          DF.namedNode('ex:p'),
          DF.literal('o'),
        ), 'object')).toEqual([
          DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:p'),
            DF.literal('o'),
          ),
          DF.quad(
            DF.namedNode('ex:s2'),
            DF.namedNode('ex:p2'),
            DF.namedNode('ex:o2'),
            DF.namedNode('ex:g2'),
          ),
        ]);

        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s'),
          DF.namedNode('ex:p'),
          DF.literal('o'),
        ), 'subject')).toEqual([
          DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:p'),
            DF.literal('o'),
          ),
        ]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s'),
          DF.namedNode('ex:p'),
          DF.literal('o'),
        ), 'object')).toEqual([
          DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:p'),
            DF.literal('o'),
          ),
        ]);
      });
    });
  });

  describe('end', () => {
    it('calls end on the subtransformer', async() => {
      const subtransformer = {
        transform: jest.fn(),
        end: jest.fn(),
      };
      transformer = new QuadTransformerDistinct(subtransformer);
      transformer.end!();
      expect(subtransformer.end).toHaveBeenCalledTimes(1);
    });
  });
});
