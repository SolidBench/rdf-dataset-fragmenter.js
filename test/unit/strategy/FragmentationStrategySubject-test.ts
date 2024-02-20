import { Readable } from 'stream';
import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import { FragmentationStrategySubject } from '../../../lib/strategy/FragmentationStrategySubject';

const streamifyArray = require('streamify-array');

const DF = new DataFactory();

jest.mock('../../../lib/io/ParallelFileWriter');

describe('FragmentationStrategySubject', () => {
  let strategy: FragmentationStrategySubject;
  let quadsEmpty: RDF.Quad[];
  let quadsNoBnodes: RDF.Quad[];
  let quadsNoBnodesTrailingSlash: RDF.Quad[];
  let quadsVariables: RDF.Quad[];
  let quadsOwnedBnode: RDF.Quad[];
  let quadsOwnedBnodeReverse: RDF.Quad[];
  let quadsOwnedBnodeChained: RDF.Quad[];
  let quadsOwnedBnodeChainedReverse: RDF.Quad[];
  let quadsOwnedBnodes: RDF.Quad[];
  let quadsOwnedBnodeMultipleSameDoc: RDF.Quad[];
  let quadsOwnedBnodeMultipleDiffDoc: RDF.Quad[];
  let quadsUnownedBnode: RDF.Quad[];
  let sink: any;
  beforeEach(() => {
    sink = {
      push: jest.fn(),
    };
    quadsEmpty = [];
    quadsNoBnodes = [
      DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
      DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
      DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    ];
    quadsNoBnodesTrailingSlash = [
      DF.quad(DF.namedNode('ex:s1/'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
      DF.quad(DF.namedNode('ex:s1/'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
      DF.quad(DF.namedNode('ex:s2/'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    ];
    quadsVariables = [
      DF.quad(DF.variable('ex:s1'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    ];
    quadsOwnedBnode = [
      DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
      DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    ];
    quadsOwnedBnodeReverse = [
      DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
      DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
    ];
    quadsOwnedBnodeChained = [
      DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
      DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.blankNode('b2')),
      DF.quad(DF.blankNode('b2'), DF.namedNode('ex:p'), DF.blankNode('b3')),
      DF.quad(DF.blankNode('b3'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    ];
    quadsOwnedBnodeChainedReverse = [
      DF.quad(DF.blankNode('b3'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
      DF.quad(DF.blankNode('b2'), DF.namedNode('ex:p'), DF.blankNode('b3')),
      DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.blankNode('b2')),
      DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
    ];
    quadsOwnedBnodes = [
      DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
      DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
      DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p'), DF.blankNode('b2')),
      DF.quad(DF.blankNode('b2'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    ];
    quadsOwnedBnodeMultipleSameDoc = [
      DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
      DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.namedNode('ex:o1')),
      DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.namedNode('ex:o2')),
    ];
    quadsOwnedBnodeMultipleDiffDoc = [
      DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
      DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p'), DF.blankNode('b1')),
      DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    ];
    quadsUnownedBnode = [
      DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
      DF.quad(DF.blankNode('b2'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    ];
  });

  describe('without eager flushing', () => {
    beforeEach(() => {
      strategy = new FragmentationStrategySubject(false);
    });

    describe('fragment', () => {
      it('should handle an empty stream', async() => {
        await strategy.fragment(streamifyArray([ ...quadsEmpty ]), sink);
        expect(sink.push).not.toHaveBeenCalled();
      });

      it('should handle a stream without blank nodes', async() => {
        await strategy.fragment(streamifyArray([ ...quadsNoBnodes ]), sink);
        expect(sink.push).toHaveBeenCalledTimes(3);
        expect(sink.push).toHaveBeenNthCalledWith(1, 'ex:s1', quadsNoBnodes[0]);
        expect(sink.push).toHaveBeenNthCalledWith(2, 'ex:s1', quadsNoBnodes[1]);
        expect(sink.push).toHaveBeenNthCalledWith(3, 'ex:s2', quadsNoBnodes[2]);
      });

      it('should handle a stream with variables', async() => {
        await strategy.fragment(streamifyArray([ ...quadsVariables ]), sink);
        expect(sink.push).not.toHaveBeenCalled();
      });

      it('should handle a stream with owned blank node', async() => {
        await strategy.fragment(streamifyArray([ ...quadsOwnedBnode ]), sink);
        expect(sink.push).toHaveBeenCalledTimes(2);
        expect(sink.push).toHaveBeenNthCalledWith(1, 'ex:s1', quadsOwnedBnode[0]);
        expect(sink.push).toHaveBeenNthCalledWith(2, 'ex:s1', quadsOwnedBnode[1]);
      });

      it('should handle a stream with owned blank node in reverse link order', async() => {
        await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeReverse ]), sink);
        expect(sink.push).toHaveBeenCalledTimes(2);
        expect(sink.push).toHaveBeenNthCalledWith(1, 'ex:s1', quadsOwnedBnodeReverse[1]);
        expect(sink.push).toHaveBeenNthCalledWith(2, 'ex:s1', quadsOwnedBnodeReverse[0]);
      });

      it('should handle a stream with owned chained blank node', async() => {
        await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeChained ]), sink);
        expect(sink.push).toHaveBeenCalledTimes(4);
        expect(sink.push).toHaveBeenNthCalledWith(1, 'ex:s1', quadsOwnedBnodeChained[0]);
        expect(sink.push).toHaveBeenNthCalledWith(2, 'ex:s1', quadsOwnedBnodeChained[1]);
        expect(sink.push).toHaveBeenNthCalledWith(3, 'ex:s1', quadsOwnedBnodeChained[2]);
        expect(sink.push).toHaveBeenNthCalledWith(4, 'ex:s1', quadsOwnedBnodeChained[3]);
      });

      it('should handle a stream with owned chained blank node in reverse link order', async() => {
        await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeChainedReverse ]), sink);
        expect(sink.push).toHaveBeenCalledTimes(4);
        expect(sink.push).toHaveBeenNthCalledWith(1, 'ex:s1', quadsOwnedBnodeChainedReverse[3]);
        expect(sink.push).toHaveBeenNthCalledWith(2, 'ex:s1', quadsOwnedBnodeChainedReverse[2]);
        expect(sink.push).toHaveBeenNthCalledWith(3, 'ex:s1', quadsOwnedBnodeChainedReverse[1]);
        expect(sink.push).toHaveBeenNthCalledWith(4, 'ex:s1', quadsOwnedBnodeChainedReverse[0]);
      });

      it('should handle a stream with multiple owned blank nodes', async() => {
        await strategy.fragment(streamifyArray([ ...quadsOwnedBnodes ]), sink);
        expect(sink.push).toHaveBeenCalledTimes(4);
        expect(sink.push).toHaveBeenNthCalledWith(1, 'ex:s1', quadsOwnedBnodes[0]);
        expect(sink.push).toHaveBeenNthCalledWith(2, 'ex:s2', quadsOwnedBnodes[2]);
        expect(sink.push).toHaveBeenNthCalledWith(3, 'ex:s1', quadsOwnedBnodes[1]);
        expect(sink.push).toHaveBeenNthCalledWith(4, 'ex:s2', quadsOwnedBnodes[3]);
      });

      it('should handle a stream with owned blank nodes in the same document', async() => {
        await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeMultipleSameDoc ]), sink);
        expect(sink.push).toHaveBeenCalledTimes(3);
        expect(sink.push).toHaveBeenNthCalledWith(1, 'ex:s1', quadsOwnedBnodeMultipleSameDoc[0]);
        expect(sink.push).toHaveBeenNthCalledWith(2, 'ex:s1', quadsOwnedBnodeMultipleSameDoc[1]);
        expect(sink.push).toHaveBeenNthCalledWith(3, 'ex:s1', quadsOwnedBnodeMultipleSameDoc[2]);
      });

      it('should handle a stream with owned blank node in multiple documents', async() => {
        await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeMultipleDiffDoc ]), sink);
        expect(sink.push).toHaveBeenCalledTimes(4);
        expect(sink.push).toHaveBeenNthCalledWith(1, 'ex:s1', quadsOwnedBnodeMultipleDiffDoc[0]);
        expect(sink.push).toHaveBeenNthCalledWith(2, 'ex:s2', quadsOwnedBnodeMultipleDiffDoc[1]);
        expect(sink.push).toHaveBeenNthCalledWith(3, 'ex:s1', quadsOwnedBnodeMultipleDiffDoc[2]);
        expect(sink.push).toHaveBeenNthCalledWith(4, 'ex:s2', quadsOwnedBnodeMultipleDiffDoc[2]);
      });

      it('should handle a stream unowned blank node, and ignore it', async() => {
        (<any> console).warn = jest.fn();
        await strategy.fragment(streamifyArray([ ...quadsUnownedBnode ]), sink);
        expect(sink.push).toHaveBeenCalledTimes(1);
        expect(sink.push).toHaveBeenNthCalledWith(1, 'ex:s1', quadsUnownedBnode[0]);
        // eslint-disable-next-line no-console
        expect(console.warn).toHaveBeenCalledTimes(2);
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

  describe('with eager flushing', () => {
    beforeEach(() => {
      strategy = new FragmentationStrategySubject();
      (<any> strategy).blankNodeBuffer.flush = () => {
        // Do nothing, as we expect earlier flushing
      };
    });

    describe('fragment', () => {
      it('should handle an empty stream', async() => {
        await strategy.fragment(streamifyArray([ ...quadsEmpty ]), sink);
        expect(sink.push).not.toHaveBeenCalled();
        expect((<any> strategy).blankNodeBuffer.pendingBlankKeyQuads).toEqual({});
      });

      it('should handle a stream without blank nodes', async() => {
        await strategy.fragment(streamifyArray([ ...quadsNoBnodes ]), sink);
        expect(sink.push).toHaveBeenCalledTimes(3);
        expect(sink.push).toHaveBeenNthCalledWith(1, 'ex:s1', quadsNoBnodes[0]);
        expect(sink.push).toHaveBeenNthCalledWith(2, 'ex:s1', quadsNoBnodes[1]);
        expect(sink.push).toHaveBeenNthCalledWith(3, 'ex:s2', quadsNoBnodes[2]);
        expect((<any> strategy).blankNodeBuffer.pendingBlankKeyQuads).toEqual({});
      });

      it('should handle a stream with variables', async() => {
        await strategy.fragment(streamifyArray([ ...quadsVariables ]), sink);
        expect(sink.push).not.toHaveBeenCalled();
        expect((<any> strategy).blankNodeBuffer.pendingBlankKeyQuads).toEqual({});
      });

      it('should handle a stream with owned blank node', async() => {
        await strategy.fragment(streamifyArray([ ...quadsOwnedBnode ]), sink);
        expect(sink.push).toHaveBeenCalledTimes(2);
        expect(sink.push).toHaveBeenNthCalledWith(1, 'ex:s1', quadsOwnedBnode[0]);
        expect(sink.push).toHaveBeenNthCalledWith(2, 'ex:s1', quadsOwnedBnode[1]);
        expect((<any> strategy).blankNodeBuffer.pendingBlankKeyQuads).toEqual({});
      });

      it('should handle a stream with owned blank node in reverse link order', async() => {
        await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeReverse ]), sink);
        expect(sink.push).toHaveBeenCalledTimes(2);
        expect(sink.push).toHaveBeenNthCalledWith(1, 'ex:s1', quadsOwnedBnodeReverse[1]);
        expect(sink.push).toHaveBeenNthCalledWith(2, 'ex:s1', quadsOwnedBnodeReverse[0]);
        expect((<any> strategy).blankNodeBuffer.pendingBlankKeyQuads).toEqual({});
      });

      it('should handle a stream with owned chained blank node', async() => {
        await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeChained ]), sink);
        expect(sink.push).toHaveBeenCalledTimes(4);
        expect(sink.push).toHaveBeenNthCalledWith(1, 'ex:s1', quadsOwnedBnodeChained[0]);
        expect(sink.push).toHaveBeenNthCalledWith(2, 'ex:s1', quadsOwnedBnodeChained[1]);
        expect(sink.push).toHaveBeenNthCalledWith(3, 'ex:s1', quadsOwnedBnodeChained[2]);
        expect(sink.push).toHaveBeenNthCalledWith(4, 'ex:s1', quadsOwnedBnodeChained[3]);
        expect((<any> strategy).blankNodeBuffer.pendingBlankKeyQuads).toEqual({});
      });

      it('should handle a stream with owned chained blank node in reverse link order', async() => {
        await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeChainedReverse ]), sink);
        expect(sink.push).toHaveBeenCalledTimes(4);
        expect(sink.push).toHaveBeenNthCalledWith(1, 'ex:s1', quadsOwnedBnodeChainedReverse[3]);
        expect(sink.push).toHaveBeenNthCalledWith(2, 'ex:s1', quadsOwnedBnodeChainedReverse[2]);
        expect(sink.push).toHaveBeenNthCalledWith(3, 'ex:s1', quadsOwnedBnodeChainedReverse[1]);
        expect(sink.push).toHaveBeenNthCalledWith(4, 'ex:s1', quadsOwnedBnodeChainedReverse[0]);
        expect((<any> strategy).blankNodeBuffer.pendingBlankKeyQuads).toEqual({});
      });

      it('should handle a stream with multiple owned blank nodes', async() => {
        await strategy.fragment(streamifyArray([ ...quadsOwnedBnodes ]), sink);
        expect(sink.push).toHaveBeenCalledTimes(4);
        expect(sink.push).toHaveBeenNthCalledWith(1, 'ex:s1', quadsOwnedBnodes[0]);
        expect(sink.push).toHaveBeenNthCalledWith(2, 'ex:s1', quadsOwnedBnodes[1]);
        expect(sink.push).toHaveBeenNthCalledWith(3, 'ex:s2', quadsOwnedBnodes[2]);
        expect(sink.push).toHaveBeenNthCalledWith(4, 'ex:s2', quadsOwnedBnodes[3]);
        expect((<any> strategy).blankNodeBuffer.pendingBlankKeyQuads).toEqual({});
      });

      it('should handle a stream with owned blank nodes in the same document', async() => {
        await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeMultipleSameDoc ]), sink);
        expect(sink.push).toHaveBeenCalledTimes(3);
        expect(sink.push).toHaveBeenNthCalledWith(1, 'ex:s1', quadsOwnedBnodeMultipleSameDoc[0]);
        expect(sink.push).toHaveBeenNthCalledWith(2, 'ex:s1', quadsOwnedBnodeMultipleSameDoc[1]);
        expect(sink.push).toHaveBeenNthCalledWith(3, 'ex:s1', quadsOwnedBnodeMultipleSameDoc[2]);
        expect((<any> strategy).blankNodeBuffer.pendingBlankKeyQuads).toEqual({});
      });

      it('should handle a stream with owned blank node in multiple documents', async() => {
        await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeMultipleDiffDoc ]), sink);
        expect(sink.push).toHaveBeenCalledTimes(4);
        expect(sink.push).toHaveBeenNthCalledWith(1, 'ex:s1', quadsOwnedBnodeMultipleDiffDoc[0]);
        expect(sink.push).toHaveBeenNthCalledWith(2, 'ex:s2', quadsOwnedBnodeMultipleDiffDoc[1]);
        expect(sink.push).toHaveBeenNthCalledWith(3, 'ex:s1', quadsOwnedBnodeMultipleDiffDoc[2]);
        expect(sink.push).toHaveBeenNthCalledWith(4, 'ex:s2', quadsOwnedBnodeMultipleDiffDoc[2]);
        expect((<any> strategy).blankNodeBuffer.pendingBlankKeyQuads).toEqual({});
      });
    });
  });

  describe('with relative path', () => {
    beforeEach(() => {
      strategy = new FragmentationStrategySubject(false, 'interests');
    });

    it('should handle a stream without blank nodes', async() => {
      await strategy.fragment(streamifyArray([ ...quadsNoBnodes ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(3);
      expect(sink.push).toHaveBeenNthCalledWith(1, 'ex:s1/interests', quadsNoBnodes[0]);
      expect(sink.push).toHaveBeenNthCalledWith(2, 'ex:s1/interests', quadsNoBnodes[1]);
      expect(sink.push).toHaveBeenNthCalledWith(3, 'ex:s2/interests', quadsNoBnodes[2]);
    });

    it('should handle a stream without blank nodes with trailing slash', async() => {
      await strategy.fragment(streamifyArray([ ...quadsNoBnodesTrailingSlash ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(3);
      expect(sink.push).toHaveBeenNthCalledWith(1, 'ex:s1/interests', quadsNoBnodesTrailingSlash[0]);
      expect(sink.push).toHaveBeenNthCalledWith(2, 'ex:s1/interests', quadsNoBnodesTrailingSlash[1]);
      expect(sink.push).toHaveBeenNthCalledWith(3, 'ex:s2/interests', quadsNoBnodesTrailingSlash[2]);
    });
  });
});
