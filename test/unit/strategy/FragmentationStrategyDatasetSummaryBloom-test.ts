import { Readable } from 'stream';
import type * as RDF from '@rdfjs/types';
import { Bloem } from 'bloem';
import { DataFactory } from 'rdf-data-factory';
import {
  FragmentationStrategyDatasetSummaryBloom,
} from '../../../lib/strategy/FragmentationStrategyDatasetSummaryBloom';
import { DatasetSummaryBloom } from '../../../lib/summary/DatasetSummaryBloom';

const streamifyArray = require('streamify-array');

const DF = new DataFactory();

jest.mock('../../../lib/io/ParallelFileWriter');

describe('FragmentationStrategySubject', () => {
  const quadsEmpty: RDF.Quad[] = [];
  const quadsNoBnodes = [
    DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
  ];
  const quadsVariables = [
    DF.quad(DF.variable('ex:s1'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
  ];
  const quadsOwnedBnode = [
    DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
    DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
  ];
  const quadsOwnedBnodeReverse = [
    DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
  ];
  const quadsOwnedBnodeChained = [
    DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
    DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.blankNode('b2')),
    DF.quad(DF.blankNode('b2'), DF.namedNode('ex:p'), DF.blankNode('b3')),
    DF.quad(DF.blankNode('b3'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
  ];
  const quadsOwnedBnodeChainedReverse = [
    DF.quad(DF.blankNode('b3'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    DF.quad(DF.blankNode('b2'), DF.namedNode('ex:p'), DF.blankNode('b3')),
    DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.blankNode('b2')),
    DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
  ];
  const quadsOwnedBnodes = [
    DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
    DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p'), DF.blankNode('b2')),
    DF.quad(DF.blankNode('b2'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
  ];
  const quadsOwnedBnodeMultipleSameDoc = [
    DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
    DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.namedNode('ex:o1')),
    DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.namedNode('ex:o2')),
  ];
  const quadsOwnedBnodeMultipleDiffDoc = [
    DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
    DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p'), DF.blankNode('b1')),
    DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
  ];
  const quadsUnownedBnode = [
    DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
    DF.quad(DF.blankNode('b2'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
  ];

  let strategy: FragmentationStrategyDatasetSummaryBloom;
  let producedFilters: Bloem[];
  let sinkPushes: number;
  let sink: any;

  const hashBits = 256;
  const hashCount = 4;

  const hasBeenRegisteredInFilters = (quad: RDF.Quad): boolean => {
    return producedFilters.some(bloem =>
      (quad.subject.termType === 'NamedNode' && bloem.has(Buffer.from(quad.subject.value))) ||
      (quad.predicate.termType === 'NamedNode' && bloem.has(Buffer.from(quad.predicate.value))) ||
      (quad.object.termType === 'NamedNode' && bloem.has(Buffer.from(quad.object.value))));
  };

  beforeEach(() => {
    producedFilters = [];
    sinkPushes = 0;
    sink = {
      push(iri: string, quad: RDF.Quad) {
        sinkPushes++;
        if (
          quad.object.termType === 'Literal' &&
          quad.object.datatype.value === DatasetSummaryBloom.XSD_BASE64.value
        ) {
          const buffer = Buffer.from(quad.object.value, 'base64');
          const filter = new Bloem(hashBits, hashCount, buffer);
          producedFilters.push(filter);
        }
      },
    };
    strategy = new FragmentationStrategyDatasetSummaryBloom({
      iriToDataset: { '^(ex:[a-z0-9]+)$': '$1' },
      hashBits,
      hashCount,
    });
  });

  describe('fragment', () => {
    it('should handle an empty stream', async() => {
      await strategy.fragment(streamifyArray([ ...quadsEmpty ]), sink);
      expect(sinkPushes).toEqual(0);
    });

    it('should handle a stream without blank nodes', async() => {
      await strategy.fragment(streamifyArray([ ...quadsNoBnodes ]), sink);
      expect(sinkPushes).toEqual(66);
      for (const quad of quadsNoBnodes) {
        expect(hasBeenRegisteredInFilters(quad)).toBeTruthy();
      }
    });

    it('should handle a stream with variables', async() => {
      await strategy.fragment(streamifyArray([ ...quadsVariables ]), sink);
      expect(sinkPushes).toEqual(0);
    });

    it('should handle a stream with owned blank node', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnode ]), sink);
      expect(sinkPushes).toEqual(33);
      for (const quad of quadsOwnedBnode) {
        expect(hasBeenRegisteredInFilters(quad)).toBeTruthy();
      }
    });

    it('should handle a stream with owned blank node in reverse link order', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeReverse ]), sink);
      expect(sinkPushes).toEqual(33);
      for (const quad of quadsOwnedBnodeReverse) {
        expect(hasBeenRegisteredInFilters(quad)).toBeTruthy();
      }
    });

    it('should handle a stream with owned chained blank node', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeChained ]), sink);
      expect(sinkPushes).toEqual(33);
      for (const quad of quadsOwnedBnodeChained) {
        expect(hasBeenRegisteredInFilters(quad)).toBeTruthy();
      }
    });

    it('should handle a stream with owned chained blank node in reverse link order', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeChainedReverse ]), sink);
      expect(sinkPushes).toEqual(33);
      for (const quad of quadsOwnedBnodeChainedReverse) {
        expect(hasBeenRegisteredInFilters(quad)).toBeTruthy();
      }
    });

    it('should handle a stream with multiple owned blank nodes', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnodes ]), sink);
      expect(sinkPushes).toEqual(66);
      for (const quad of quadsOwnedBnodes) {
        expect(hasBeenRegisteredInFilters(quad)).toBeTruthy();
      }
    });

    it('should handle a stream with owned blank nodes in the same document', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeMultipleSameDoc ]), sink);
      expect(sinkPushes).toEqual(43);
      for (const quad of quadsOwnedBnodeMultipleSameDoc) {
        expect(hasBeenRegisteredInFilters(quad)).toBeTruthy();
      }
    });

    it('should handle a stream with owned blank node in multiple documents', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeMultipleDiffDoc ]), sink);
      expect(sinkPushes).toEqual(66);
      for (const quad of quadsOwnedBnodeMultipleDiffDoc) {
        expect(hasBeenRegisteredInFilters(quad)).toBeTruthy();
      }
    });

    it('should handle a stream unowned blank node, and ignore it', async() => {
      await strategy.fragment(streamifyArray([ ...quadsUnownedBnode ]), sink);
      expect(sinkPushes).toEqual(23);
      for (const quad of quadsUnownedBnode) {
        expect(hasBeenRegisteredInFilters(quad)).toBeTruthy();
      }
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
