import { Readable } from 'node:stream';
import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import {
  FragmentationStrategyDatasetSummaryBloom,
} from '../../../lib/strategy/FragmentationStrategyDatasetSummaryBloom';
import type { IFragmentationStrategy } from '../../../lib/strategy/IFragmentationStrategy';
import { DatasetSummaryBloom } from '../../../lib/summary/DatasetSummaryBloom';

const streamifyArray = require('streamify-array');

const DF = new DataFactory();

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
          DatasetSummaryBloom.createFragmentIri(
            quadsNoBnodes[0].subject.value,
            quadsNoBnodes[0].subject.value,
            DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER.value,
            DatasetSummaryBloom.MEM_PROP_PROJECTEDRESOURCE.value,
            quadsNoBnodes[0].object.value,
          ),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsNoBnodes[2].subject.value,
        DF.quad(
          DatasetSummaryBloom.createFragmentIri(
            quadsNoBnodes[2].subject.value,
            quadsNoBnodes[2].subject.value,
            DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER.value,
            DatasetSummaryBloom.MEM_PROP_PROJECTEDRESOURCE.value,
            quadsNoBnodes[2].object.value,
          ),
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
          DatasetSummaryBloom.createFragmentIri(
            quadsOwnedBnode[0].subject.value,
            quadsOwnedBnode[0].subject.value,
            DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER.value,
            DatasetSummaryBloom.MEM_PROP_PROJECTEDRESOURCE.value,
            quadsOwnedBnode[1].object.value,
          ),
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
          DatasetSummaryBloom.createFragmentIri(
            quadsOwnedBnodeReverse[1].subject.value,
            quadsOwnedBnodeReverse[1].subject.value,
            DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER.value,
            DatasetSummaryBloom.MEM_PROP_PROJECTEDRESOURCE.value,
            quadsOwnedBnodeReverse[0].object.value,
          ),
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
          DatasetSummaryBloom.createFragmentIri(
            quadsOwnedBnodeChained[0].subject.value,
            quadsOwnedBnodeChained[0].subject.value,
            DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER.value,
            DatasetSummaryBloom.MEM_PROP_PROJECTEDRESOURCE.value,
            quadsOwnedBnodeChained[3].object.value,
          ),
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
          DatasetSummaryBloom.createFragmentIri(
            quadsOwnedBnodeChainedReverse[3].subject.value,
            quadsOwnedBnodeChainedReverse[3].subject.value,
            DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER.value,
            DatasetSummaryBloom.MEM_PROP_PROJECTEDRESOURCE.value,
            quadsOwnedBnodeChainedReverse[0].object.value,
          ),
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
          DatasetSummaryBloom.createFragmentIri(
            quadsOwnedBnodes[0].subject.value,
            quadsOwnedBnodes[0].subject.value,
            DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER.value,
            DatasetSummaryBloom.MEM_PROP_PROJECTEDRESOURCE.value,
            quadsOwnedBnodes[1].object.value,
          ),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodes[2].subject.value,
        DF.quad(
          DatasetSummaryBloom.createFragmentIri(
            quadsOwnedBnodes[2].subject.value,
            quadsOwnedBnodes[2].subject.value,
            DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER.value,
            DatasetSummaryBloom.MEM_PROP_PROJECTEDRESOURCE.value,
            quadsOwnedBnodes[3].object.value,
          ),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
    });

    it('should handle a stream with multiple owned blank nodes in the same document', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeMultipleSameDoc ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(43);
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeMultipleSameDoc[0].subject.value,
        DF.quad(
          DatasetSummaryBloom.createFragmentIri(
            quadsOwnedBnodeMultipleSameDoc[0].subject.value,
            quadsOwnedBnodeMultipleSameDoc[0].subject.value,
            DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER.value,
            DatasetSummaryBloom.MEM_PROP_PROJECTEDRESOURCE.value,
            quadsOwnedBnodeMultipleSameDoc[1].object.value,
          ),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeMultipleSameDoc[0].subject.value,
        DF.quad(
          DatasetSummaryBloom.createFragmentIri(
            quadsOwnedBnodeMultipleSameDoc[0].subject.value,
            quadsOwnedBnodeMultipleSameDoc[0].subject.value,
            DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER.value,
            DatasetSummaryBloom.MEM_PROP_PROJECTEDRESOURCE.value,
            quadsOwnedBnodeMultipleSameDoc[2].object.value,
          ),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
    });

    it('should handle a stream with a blank node owned by multiple documents', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeMultipleDiffDoc ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(66);
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeMultipleDiffDoc[0].subject.value,
        DF.quad(
          DatasetSummaryBloom.createFragmentIri(
            quadsOwnedBnodeMultipleDiffDoc[0].subject.value,
            quadsOwnedBnodeMultipleDiffDoc[0].subject.value,
            DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER.value,
            DatasetSummaryBloom.MEM_PROP_PROJECTEDRESOURCE.value,
            quadsOwnedBnodeMultipleDiffDoc[2].object.value,
          ),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeMultipleDiffDoc[1].subject.value,
        DF.quad(
          DatasetSummaryBloom.createFragmentIri(
            quadsOwnedBnodeMultipleDiffDoc[1].subject.value,
            quadsOwnedBnodeMultipleDiffDoc[1].subject.value,
            DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER.value,
            DatasetSummaryBloom.MEM_PROP_PROJECTEDRESOURCE.value,
            quadsOwnedBnodeMultipleDiffDoc[2].object.value,
          ),
          DatasetSummaryBloom.RDF_TYPE,
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER,
        ),
      );
    });

    it('should handle a stream unowned blank node, and ignore it', async() => {
      await strategy.fragment(streamifyArray([ ...quadsUnownedBnode ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(23);
      expect(sink.push).not.toHaveBeenCalledWith(
        quadsUnownedBnode[0].subject.value,
        DF.quad(
          DatasetSummaryBloom.createFragmentIri(
            quadsUnownedBnode[0].subject.value,
            quadsUnownedBnode[0].subject.value,
            DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER.value,
            DatasetSummaryBloom.MEM_PROP_PROJECTEDRESOURCE.value,
            quadsUnownedBnode[1].object.value,
          ),
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
