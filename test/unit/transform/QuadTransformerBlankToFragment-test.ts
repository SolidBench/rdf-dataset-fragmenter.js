import { DataFactory } from 'rdf-data-factory';
import type { IQuadTransformer } from '../../../lib/transform/IQuadTransformer';
import { QuadTransformerBlankToFragment } from '../../../lib/transform/QuadTransformerBlankToFragment';

describe('QuadTransformerBlankToFragment', () => {
  const DF = new DataFactory();

  let transformer: IQuadTransformer;

  beforeEach(() => {
    transformer = new QuadTransformerBlankToFragment();
  });

  it('should ignore quads without blank nodes', () => {
    const quad = DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), DF.namedNode('ex:o'));
    expect(transformer.transform(quad)).toEqual([ quad ]);
  });

  it('should map same blank node to same fragment on consecutive calls', () => {
    const blankNode = DF.blankNode('o');
    const mappedNode = DF.namedNode('ex:s#o');
    const quad1 = DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), blankNode);
    const quad2 = DF.quad(blankNode, DF.namedNode('ex:p2'), DF.namedNode('ex:o2'));
    const quad3 = DF.quad(blankNode, DF.namedNode('ex:p3'), DF.namedNode('ex:o3'));
    expect(transformer.transform(quad1)).toEqual([ DF.quad(quad1.subject, quad1.predicate, mappedNode) ]);
    expect(transformer.transform(quad2)).toEqual([ DF.quad(mappedNode, quad2.predicate, quad2.object) ]);
    expect(transformer.transform(quad3)).toEqual([ DF.quad(mappedNode, quad3.predicate, quad3.object) ]);
  });

  it('should throw error on unmapped blank node', () => {
    const quad = DF.quad(DF.blankNode(), DF.namedNode('ex:p'), DF.namedNode('ex:o'));
    expect(() => transformer.transform(quad)).toThrow('Unmapped blank node');
  });
});
