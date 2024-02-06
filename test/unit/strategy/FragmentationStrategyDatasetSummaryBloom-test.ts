import { Readable } from 'stream';
import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import {
  FragmentationStrategyDatasetSummaryBloom,
} from '../../../lib/strategy/FragmentationStrategyDatasetSummaryBloom';
import type { IFragmentationStrategy } from '../../../lib/strategy/IFragmentationStrategy';
import { DatasetSummaryBloom } from '../../../lib/summary/DatasetSummaryBloom';

const streamifyArray = require('streamify-array');

const DF = new DataFactory();

// Jest.mock('../../../lib/io/ParallelFileWriter');

describe('FragmentationStrategyDatasetSummaryBloom', () => {
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

  let sink: any;
  let strategy: IFragmentationStrategy;

  beforeEach(() => {
    sink = {
      push: jest.fn(),
    };
    strategy = new FragmentationStrategyDatasetSummaryBloom({
      hashBits: 256,
      hashCount: 4,
      datasetPatterns: [ '^(ex:[a-z0-9]+)$' ],
      locationPatterns: [ '^(ex:[a-z0-9]+)$' ],
    });
  });

  describe('fragment', () => {
    it('should handle an empty stream', async() => {
      await strategy.fragment(streamifyArray([ ...quadsEmpty ]), sink);
      expect(sink.push).not.toHaveBeenCalled();
    });

    it('should handle a stream without blank nodes', async() => {
      await strategy.fragment(streamifyArray([ ...quadsNoBnodes ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(66);
      expect(sink.push).toHaveBeenCalledWith(
        quadsNoBnodes[0].subject.value,
        DF.quad(
          DF.namedNode('ex:s1#5670a76463f24908dfcba691d6fe9c79'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsNoBnodes[0].subject.value,
        DF.quad(
          DF.namedNode('ex:s1#86f1470729001d9d1238634dbb3c0b02'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsNoBnodes[0].subject.value,
        DF.quad(
          DF.namedNode('ex:s1#1ee9da61777dc6a7b1e94de682488194'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsNoBnodes[2].subject.value,
        DF.quad(
          DF.namedNode('ex:s2#fad260fe4a45ad63f49b6b9a47907644'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsNoBnodes[2].subject.value,
        DF.quad(
          DF.namedNode('ex:s2#e6dad3e7a620cc688224a5451e8bc628'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsNoBnodes[2].subject.value,
        DF.quad(
          DF.namedNode('ex:s2#82c6a02b37b658e2ae41a30d0e0f7a70'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
    });

    it('should handle a stream with variables', async() => {
      await strategy.fragment(streamifyArray([ ...quadsVariables ]), sink);
      expect(sink.push).not.toHaveBeenCalled();
    });

    it('should handle a stream with owned blank node', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnode ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(33);
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnode[0].subject.value,
        DF.quad(
          DF.namedNode('ex:s1#5670a76463f24908dfcba691d6fe9c79'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnode[0].subject.value,
        DF.quad(
          DF.namedNode('ex:s1#86f1470729001d9d1238634dbb3c0b02'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnode[0].subject.value,
        DF.quad(
          DF.namedNode('ex:s1#1ee9da61777dc6a7b1e94de682488194'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
    });

    it('should handle a stream with owned blank node in reverse link order', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeReverse ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(33);
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeReverse[1].subject.value,
        DF.quad(
          DF.namedNode('ex:s1#5670a76463f24908dfcba691d6fe9c79'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeReverse[1].subject.value,
        DF.quad(
          DF.namedNode('ex:s1#86f1470729001d9d1238634dbb3c0b02'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeReverse[1].subject.value,
        DF.quad(
          DF.namedNode('ex:s1#1ee9da61777dc6a7b1e94de682488194'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
    });

    it('should handle a stream with owned chained blank node', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeChained ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(33);
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeChained[0].subject.value,
        DF.quad(
          DF.namedNode('ex:s1#5670a76463f24908dfcba691d6fe9c79'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeChained[0].subject.value,
        DF.quad(
          DF.namedNode('ex:s1#86f1470729001d9d1238634dbb3c0b02'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeChained[0].subject.value,
        DF.quad(
          DF.namedNode('ex:s1#1ee9da61777dc6a7b1e94de682488194'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
    });

    it('should handle a stream with owned chained blank node in reverse link order', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeChainedReverse ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(33);
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeChainedReverse[3].subject.value,
        DF.quad(
          DF.namedNode('ex:s1#5670a76463f24908dfcba691d6fe9c79'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeChainedReverse[3].subject.value,
        DF.quad(
          DF.namedNode('ex:s1#86f1470729001d9d1238634dbb3c0b02'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeChainedReverse[3].subject.value,
        DF.quad(
          DF.namedNode('ex:s1#1ee9da61777dc6a7b1e94de682488194'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
    });

    it('should handle a stream with multiple owned blank nodes', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnodes ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(66);
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodes[0].subject.value,
        DF.quad(
          DF.namedNode('ex:s1#5670a76463f24908dfcba691d6fe9c79'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodes[0].subject.value,
        DF.quad(
          DF.namedNode('ex:s1#86f1470729001d9d1238634dbb3c0b02'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodes[0].subject.value,
        DF.quad(
          DF.namedNode('ex:s1#1ee9da61777dc6a7b1e94de682488194'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodes[2].subject.value,
        DF.quad(
          DF.namedNode('ex:s2#fad260fe4a45ad63f49b6b9a47907644'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodes[2].subject.value,
        DF.quad(
          DF.namedNode('ex:s2#e6dad3e7a620cc688224a5451e8bc628'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodes[2].subject.value,
        DF.quad(
          DF.namedNode('ex:s2#82c6a02b37b658e2ae41a30d0e0f7a70'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
    });

    it('should handle a stream with owned blank nodes in the same document', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeMultipleSameDoc ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(43);
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeMultipleSameDoc[0].subject.value,
        DF.quad(
          DF.namedNode('ex:s1#5670a76463f24908dfcba691d6fe9c79'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeMultipleSameDoc[0].subject.value,
        DF.quad(
          DF.namedNode('ex:s1#86f1470729001d9d1238634dbb3c0b02'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeMultipleSameDoc[0].subject.value,
        DF.quad(
          DF.namedNode('ex:s1#37665dc6c30042a0980b056780c6c354'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeMultipleSameDoc[0].subject.value,
        DF.quad(
          DF.namedNode('ex:s1#e70c38b4544f3df3820457c322876cec'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
    });

    it('should handle a stream with owned blank node in multiple documents', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeMultipleDiffDoc ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(66);
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeMultipleDiffDoc[0].subject.value,
        DF.quad(
          DF.namedNode('ex:s1#5670a76463f24908dfcba691d6fe9c79'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeMultipleDiffDoc[0].subject.value,
        DF.quad(
          DF.namedNode('ex:s1#86f1470729001d9d1238634dbb3c0b02'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeMultipleDiffDoc[0].subject.value,
        DF.quad(
          DF.namedNode('ex:s1#1ee9da61777dc6a7b1e94de682488194'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeMultipleDiffDoc[1].subject.value,
        DF.quad(
          DF.namedNode('ex:s2#fad260fe4a45ad63f49b6b9a47907644'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeMultipleDiffDoc[1].subject.value,
        DF.quad(
          DF.namedNode('ex:s2#e6dad3e7a620cc688224a5451e8bc628'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeMultipleDiffDoc[1].subject.value,
        DF.quad(
          DF.namedNode('ex:s2#82c6a02b37b658e2ae41a30d0e0f7a70'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
    });

    it('should handle a stream unowned blank node, and ignore it', async() => {
      await strategy.fragment(streamifyArray([ ...quadsUnownedBnode ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(23);
      expect(sink.push).toHaveBeenCalledWith(
        quadsNoBnodes[0].subject.value,
        DF.quad(
          DF.namedNode('ex:s1#5670a76463f24908dfcba691d6fe9c79'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsNoBnodes[0].subject.value,
        DF.quad(
          DF.namedNode('ex:s1#86f1470729001d9d1238634dbb3c0b02'),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
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
