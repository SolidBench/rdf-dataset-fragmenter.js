import { Readable } from 'stream';
import { DataFactory } from 'rdf-data-factory';
import { Fragmenter } from '../../lib/Fragmenter';
import type { IQuadTransformer } from '../../lib/transform/IQuadTransformer';
import { QuadTransformerClone } from '../../lib/transform/QuadTransformerClone';
import { QuadTransformerIdentity } from '../../lib/transform/QuadTransformerIdentity';
import { QuadTransformerReplaceIri } from '../../lib/transform/QuadTransformerReplaceIri';

const arrayifyStream = require('arrayify-stream');
const streamifyArray = require('streamify-array');
const DF = new DataFactory();

describe('Fragmenter', () => {
  let quadSource: any;
  let fragmentationStrategy: any;
  let quadSink: any;
  let fragmenter: Fragmenter;
  let transformers: IQuadTransformer[];
  beforeEach(() => {
    quadSource = {
      getQuads: jest.fn(() => streamifyArray([])),
    };
    fragmentationStrategy = {
      fragment: jest.fn(),
    };
    quadSink = {
      close: jest.fn(),
    };
    fragmenter = new Fragmenter({ quadSource, fragmentationStrategy, quadSink });
    transformers = [
      new QuadTransformerIdentity(),
      new QuadTransformerIdentity(),
    ];
  });

  describe('getTransformedQuadStream', () => {
    it('should handle an empty stream without transformers', async() => {
      expect(await arrayifyStream(Fragmenter.getTransformedQuadStream(quadSource, [])))
        .toEqual([]);
    });

    it('should handle an empty stream with transformers', async() => {
      expect(await arrayifyStream(Fragmenter.getTransformedQuadStream(quadSource, transformers)))
        .toEqual([]);
    });

    it('should handle a non-empty stream with transformers', async() => {
      quadSource = {
        getQuads: jest.fn(() => streamifyArray([ 'a', 'b' ])),
      };
      expect(await arrayifyStream(Fragmenter.getTransformedQuadStream(quadSource, transformers)))
        .toEqual([ 'a', 'b' ]);
    });

    it('should forward errors', async() => {
      const stream: any = new Readable();
      stream._read = () => {
        stream.emit('error', new Error('Error in stream'));
      };
      quadSource = {
        getQuads: jest.fn(() => stream),
      };
      await expect(arrayifyStream(Fragmenter.getTransformedQuadStream(quadSource, transformers)))
        .rejects.toThrow(new Error('Error in stream'));
    });

    it('should handle a non-empty stream with chained multi-output transformers', async() => {
      transformers = [
        new QuadTransformerClone(),
        new QuadTransformerClone(),
      ];
      quadSource = {
        getQuads: jest.fn(() => streamifyArray([ 'a', 'b' ])),
      };
      expect(await arrayifyStream(Fragmenter.getTransformedQuadStream(quadSource, transformers)))
        .toEqual([ 'a', 'a', 'a', 'a', 'b', 'b', 'b', 'b' ]);
    });

    it('should handle a non-empty stream with chained modifying transformers', async() => {
      transformers = [
        new QuadTransformerReplaceIri('a', 'b'),
        new QuadTransformerReplaceIri('b', 'c'),
      ];
      quadSource = {
        getQuads: jest.fn(() => streamifyArray([
          DF.quad(DF.namedNode('a'), DF.namedNode('a'), DF.namedNode('a')),
          DF.quad(DF.namedNode('b'), DF.namedNode('b'), DF.namedNode('b')),
        ])),
      };
      expect(await arrayifyStream(Fragmenter.getTransformedQuadStream(quadSource, transformers)))
        .toEqual([
          DF.quad(DF.namedNode('c'), DF.namedNode('c'), DF.namedNode('c')),
          DF.quad(DF.namedNode('c'), DF.namedNode('c'), DF.namedNode('c')),
        ]);
    });
  });

  describe('fragment', () => {
    it('should handle an empty stream', async() => {
      await fragmenter.fragment();
      expect(quadSource.getQuads).toHaveBeenCalledTimes(1);
      expect(fragmentationStrategy.fragment).toHaveBeenCalledTimes(1);
      expect(fragmentationStrategy.fragment).toHaveBeenCalledWith(expect.anything(), quadSink);
      expect(quadSink.close).toHaveBeenCalledTimes(1);
    });
  });
});
