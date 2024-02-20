import { Readable } from 'stream';
import arrayifyStream from 'arrayify-stream';
import { QuadSourceComposite } from '../../../lib/io/QuadSourceComposite';

const streamifyArray = require('streamify-array');

describe('QuadSourceComposite', () => {
  let source: QuadSourceComposite;
  let sourceEmpty: any;
  let sourceNonEmpty: any;
  let sourceError: any;

  beforeEach(() => {
    sourceEmpty = {
      getQuads: () => streamifyArray([]),
    };
    sourceNonEmpty = {
      getQuads: () => streamifyArray([ 'a', 'b', 'c' ]),
    };
    sourceError = {
      getQuads() {
        const stream: any = new Readable();
        stream._read = () => {
          stream.emit('error', new Error('Error in stream'));
        };
        return stream;
      },
    };
  });

  describe('for no sources', () => {
    beforeEach(() => {
      source = new QuadSourceComposite([]);
    });

    it('should produce an empty stream', async() => {
      expect(await arrayifyStream(source.getQuads())).toEqual([]);
    });
  });

  describe('for empty sources', () => {
    beforeEach(() => {
      source = new QuadSourceComposite([
        sourceEmpty,
        sourceEmpty,
        sourceEmpty,
      ]);
    });

    it('should produce an empty stream', async() => {
      expect(await arrayifyStream(source.getQuads())).toEqual([]);
    });
  });

  describe('for non-empty sources', () => {
    beforeEach(() => {
      source = new QuadSourceComposite([
        sourceNonEmpty,
        sourceNonEmpty,
        sourceNonEmpty,
      ]);
    });

    it('should produce an empty stream', async() => {
      expect(await arrayifyStream(source.getQuads())).toEqual([
        'a',
        'b',
        'c',
        'a',
        'b',
        'c',
        'a',
        'b',
        'c',
      ]);
    });
  });

  describe('for erroring first stream', () => {
    beforeEach(() => {
      source = new QuadSourceComposite([
        sourceError,
        sourceNonEmpty,
        sourceNonEmpty,
      ]);
    });

    it('should emit an error', async() => {
      await expect(arrayifyStream(source.getQuads())).rejects.toThrow(new Error('Error in stream'));
    });
  });

  describe('for erroring middle stream', () => {
    beforeEach(() => {
      source = new QuadSourceComposite([
        sourceNonEmpty,
        sourceError,
        sourceNonEmpty,
      ]);
    });

    it('should emit an error', async() => {
      await expect(arrayifyStream(source.getQuads())).rejects.toThrow(new Error('Error in stream'));
    });
  });

  describe('for erroring last stream', () => {
    beforeEach(() => {
      source = new QuadSourceComposite([
        sourceNonEmpty,
        sourceNonEmpty,
        sourceError,
      ]);
    });

    it('should emit an error', async() => {
      await expect(arrayifyStream(source.getQuads())).rejects.toThrow(new Error('Error in stream'));
    });
  });
});
