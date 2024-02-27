import { Readable } from 'stream';
import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import { FragmentationStrategyDatasetSummary } from '../../../lib/strategy/FragmentationStrategyDatasetSummary';
import type { IFragmentationStrategy } from '../../../lib/strategy/IFragmentationStrategy';

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

  let sink: any;
  let collector: any;
  let strategy: IFragmentationStrategy;

  beforeEach(() => {
    sink = {
      push: jest.fn(),
    };
    collector = {
      register: jest.fn(),
      toQuads: jest.fn(() => new Map()),
    };
    strategy = new FragmentationStrategyDatasetSummary({
      collectors: [ collector ],
      subjectToDataset: { '^(ex:[a-z0-9]+)$': '$1' },
      datasetToSummary: { '^(ex:[a-z0-9]+)$': '$1' },
    });
  });

  describe('fragment', () => {
    it('should handle an empty stream', async() => {
      await strategy.fragment(streamifyArray([ ...quadsEmpty ]), sink);
      expect(sink.push).not.toHaveBeenCalled();
      expect(collector.toQuads).toHaveBeenCalledTimes(1);
      expect(collector.register).not.toHaveBeenCalled();
    });

    it('should handle a stream without blank nodes', async() => {
      await strategy.fragment(streamifyArray([ ...quadsNoBnodes ]), sink);
      expect(sink.push).not.toHaveBeenCalled();
      expect(collector.toQuads).toHaveBeenCalledTimes(1);
      expect(collector.register).toHaveBeenCalledWith(quadsNoBnodes[0].subject.value, quadsNoBnodes[0]);
      expect(collector.register).toHaveBeenCalledWith(quadsNoBnodes[1].subject.value, quadsNoBnodes[1]);
      expect(collector.register).toHaveBeenCalledWith(quadsNoBnodes[2].subject.value, quadsNoBnodes[2]);
    });

    it('should handle a stream with variables', async() => {
      await strategy.fragment(streamifyArray([ ...quadsVariables ]), sink);
      expect(sink.push).not.toHaveBeenCalled();
      expect(collector.toQuads).toHaveBeenCalledTimes(1);
    });

    it('should handle a stream with owned blank node', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnode ]), sink);
      expect(sink.push).not.toHaveBeenCalled();
      expect(collector.toQuads).toHaveBeenCalledTimes(1);
      expect(collector.register).toHaveBeenCalledWith(quadsOwnedBnode[0].subject.value, quadsOwnedBnode[0]);
      expect(collector.register).toHaveBeenCalledWith(quadsOwnedBnode[0].subject.value, quadsOwnedBnode[1]);
    });

    it('should handle a stream with owned blank node in reverse link order', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeReverse ]), sink);
      expect(sink.push).not.toHaveBeenCalled();
      expect(collector.toQuads).toHaveBeenCalledTimes(1);
      expect(collector.register).toHaveBeenCalledWith(
        quadsOwnedBnodeReverse[1].subject.value,
        quadsOwnedBnodeReverse[0],
      );
      expect(collector.register).toHaveBeenCalledWith(
        quadsOwnedBnodeReverse[1].subject.value,
        quadsOwnedBnodeReverse[1],
      );
    });

    it('should handle a stream with owned chained blank node', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeChained ]), sink);
      expect(sink.push).not.toHaveBeenCalled();
      expect(collector.toQuads).toHaveBeenCalledTimes(1);
      expect(collector.register).toHaveBeenCalledWith(
        quadsOwnedBnodeChained[0].subject.value,
        quadsOwnedBnodeChained[0],
      );
      expect(collector.register).toHaveBeenCalledWith(
        quadsOwnedBnodeChained[0].subject.value,
        quadsOwnedBnodeChained[1],
      );
      expect(collector.register).toHaveBeenCalledWith(
        quadsOwnedBnodeChained[0].subject.value,
        quadsOwnedBnodeChained[2],
      );
      expect(collector.register).toHaveBeenCalledWith(
        quadsOwnedBnodeChained[0].subject.value,
        quadsOwnedBnodeChained[3],
      );
    });

    it('should handle a stream with owned chained blank node in reverse link order', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeChainedReverse ]), sink);
      expect(sink.push).not.toHaveBeenCalled();
      expect(collector.toQuads).toHaveBeenCalledTimes(1);
      expect(collector.register).toHaveBeenCalledWith(
        quadsOwnedBnodeChainedReverse[3].subject.value,
        quadsOwnedBnodeChainedReverse[0],
      );
      expect(collector.register).toHaveBeenCalledWith(
        quadsOwnedBnodeChainedReverse[3].subject.value,
        quadsOwnedBnodeChainedReverse[1],
      );
      expect(collector.register).toHaveBeenCalledWith(
        quadsOwnedBnodeChainedReverse[3].subject.value,
        quadsOwnedBnodeChainedReverse[2],
      );
      expect(collector.register).toHaveBeenCalledWith(
        quadsOwnedBnodeChainedReverse[3].subject.value,
        quadsOwnedBnodeChainedReverse[3],
      );
    });

    it('should handle a stream with multiple owned blank nodes', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnodes ]), sink);
      expect(sink.push).not.toHaveBeenCalled();
      expect(collector.toQuads).toHaveBeenCalledTimes(1);
      expect(collector.register).toHaveBeenCalledWith(quadsOwnedBnodes[0].subject.value, quadsOwnedBnodes[0]);
      expect(collector.register).toHaveBeenCalledWith(quadsOwnedBnodes[0].subject.value, quadsOwnedBnodes[1]);
      expect(collector.register).toHaveBeenCalledWith(quadsOwnedBnodes[2].subject.value, quadsOwnedBnodes[2]);
      expect(collector.register).toHaveBeenCalledWith(quadsOwnedBnodes[2].subject.value, quadsOwnedBnodes[3]);
    });

    it('should handle a stream with owned blank nodes in the same document', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeMultipleSameDoc ]), sink);
      expect(sink.push).not.toHaveBeenCalled();
      expect(collector.toQuads).toHaveBeenCalledTimes(1);
      expect(collector.register).toHaveBeenCalledWith(
        quadsOwnedBnodeMultipleSameDoc[0].subject.value,
        quadsOwnedBnodeMultipleSameDoc[0],
      );
      expect(collector.register).toHaveBeenCalledWith(
        quadsOwnedBnodeMultipleSameDoc[0].subject.value,
        quadsOwnedBnodeMultipleSameDoc[1],
      );
      expect(collector.register).toHaveBeenCalledWith(
        quadsOwnedBnodeMultipleSameDoc[0].subject.value,
        quadsOwnedBnodeMultipleSameDoc[2],
      );
    });

    it('should handle a stream with owned blank node in multiple documents', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeMultipleDiffDoc ]), sink);
      expect(sink.push).not.toHaveBeenCalled();
      expect(collector.toQuads).toHaveBeenCalledTimes(1);
      expect(collector.register).toHaveBeenCalledWith(
        quadsOwnedBnodeMultipleDiffDoc[0].subject.value,
        quadsOwnedBnodeMultipleDiffDoc[0],
      );
      expect(collector.register).toHaveBeenCalledWith(
        quadsOwnedBnodeMultipleDiffDoc[0].subject.value,
        quadsOwnedBnodeMultipleDiffDoc[2],
      );
      expect(collector.register).toHaveBeenCalledWith(
        quadsOwnedBnodeMultipleDiffDoc[1].subject.value,
        quadsOwnedBnodeMultipleDiffDoc[1],
      );
      expect(collector.register).toHaveBeenCalledWith(
        quadsOwnedBnodeMultipleDiffDoc[1].subject.value,
        quadsOwnedBnodeMultipleDiffDoc[2],
      );
    });

    it('should handle a stream unowned blank node, and ignore it', async() => {
      await strategy.fragment(streamifyArray([ ...quadsUnownedBnode ]), sink);
      expect(sink.push).not.toHaveBeenCalled();
      expect(collector.toQuads).toHaveBeenCalledTimes(1);
      expect(collector.register).toHaveBeenCalledTimes(1);
      expect(collector.register).toHaveBeenCalledWith(quadsUnownedBnode[0].subject.value, quadsUnownedBnode[0]);
    });

    it('should pass on all quads from summary collector', async() => {
      collector.toQuads = jest.fn(() => new Map([
        [ quadsNoBnodes[0].subject.value, [ quadsNoBnodes[0], quadsNoBnodes[1] ]],
        [ quadsNoBnodes[2].subject.value, [ quadsNoBnodes[2] ]],
      ]));
      await strategy.fragment(streamifyArray([ ...quadsNoBnodes ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(3);
      expect(collector.register).toHaveBeenCalledTimes(3);
      expect(collector.toQuads).toHaveBeenCalledTimes(1);
      expect(sink.push).toHaveBeenCalledWith(quadsNoBnodes[0].subject.value, quadsNoBnodes[0]);
      expect(sink.push).toHaveBeenCalledWith(quadsNoBnodes[1].subject.value, quadsNoBnodes[1]);
      expect(sink.push).toHaveBeenCalledWith(quadsNoBnodes[2].subject.value, quadsNoBnodes[2]);
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
